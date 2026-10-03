/**
 * BUG-01 Regression Tests: Separate Password Reset Tokens from Email OTP
 *
 * Verifies:
 * 1. OTP can exist while password reset token exists.
 * 2. Password reset does not invalidate OTP.
 * 3. OTP verification does not invalidate password reset token.
 * 4. Expired reset token is rejected.
 * 5. Used reset token cannot be reused.
 * 6. Password reset still revokes active refresh sessions.
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import { authService } from '../auth.service';
import { UserModel } from '../../users/user.model';
import { userRepository } from '../../users/user.repository';
import { AppError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

describe('BUG-01: Separate Password Reset Tokens & OTP Verification', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('1. OTP can exist while password reset token exists simultaneously', async () => {
    const email = `bug01-simultaneous-${Date.now()}@petverse.test`;
    await authService.register({
      firstName: 'Alice',
      lastName: 'Tester',
      email,
      password: 'OldPassword123!',
    });

    const rawOtp = '123456';
    const otpHash = hashToken(rawOtp);
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(rawResetToken);

    const user = await userRepository.findByEmail(email);
    expect(user).not.toBeNull();

    // Set OTP and Reset Token
    await userRepository.updateById(user!._id.toString(), {
      otpHash,
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      resetTokenHash,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    const reloaded = await UserModel.findById(user!._id)
      .select('+otpHash +otpExpiry +resetTokenHash +resetTokenExpiry')
      .exec();

    expect(reloaded?.otpHash).toBe(otpHash);
    expect(reloaded?.resetTokenHash).toBe(resetTokenHash);
    expect(reloaded?.otpExpiry).toBeDefined();
    expect(reloaded?.resetTokenExpiry).toBeDefined();
  });

  it('2. Password reset does not invalidate existing OTP', async () => {
    const email = `bug01-pwreset-keeps-otp-${Date.now()}@petverse.test`;
    await authService.register({
      firstName: 'Bob',
      lastName: 'Tester',
      email,
      password: 'OldPassword123!',
    });

    const user = (await userRepository.findByEmail(email))!;
    const rawOtp = '654321';
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    await userRepository.updateById(user._id.toString(), {
      otpHash: hashToken(rawOtp),
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      resetTokenHash: hashToken(rawResetToken),
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Perform password reset using reset token
    await authService.resetPassword(rawResetToken, 'BrandNewPass123!');

    // Verify resetTokenHash was unset, but otpHash and otpExpiry are still present
    const updatedUser = await UserModel.findById(user._id)
      .select('+otpHash +otpExpiry +resetTokenHash +resetTokenExpiry')
      .exec();

    expect(updatedUser?.resetTokenHash).toBeUndefined();
    expect(updatedUser?.otpHash).toBe(hashToken(rawOtp));
    expect(updatedUser?.otpExpiry).toBeDefined();

    // The user should still be able to verify OTP successfully
    const otpVerified = await authService.verifyOtp(email, rawOtp);
    expect(otpVerified).toBe(true);

    // After OTP verification, isVerified should be true and otpHash cleared
    const verifiedUser = await UserModel.findById(user._id)
      .select('+otpHash +otpExpiry')
      .exec();
    expect(verifiedUser?.isVerified).toBe(true);
    expect(verifiedUser?.otpHash).toBeUndefined();
  });

  it('3. OTP verification does not invalidate password reset token', async () => {
    const email = `bug01-otp-keeps-pwreset-${Date.now()}@petverse.test`;
    await authService.register({
      firstName: 'Carol',
      lastName: 'Tester',
      email,
      password: 'OldPassword123!',
    });

    const user = (await userRepository.findByEmail(email))!;
    const rawOtp = '777888';
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    await userRepository.updateById(user._id.toString(), {
      otpHash: hashToken(rawOtp),
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      resetTokenHash: hashToken(rawResetToken),
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Verify OTP first
    const otpVerified = await authService.verifyOtp(email, rawOtp);
    expect(otpVerified).toBe(true);

    // Verify resetToken is still intact
    const userAfterOtp = await UserModel.findById(user._id)
      .select('+otpHash +otpExpiry +resetTokenHash +resetTokenExpiry')
      .exec();

    expect(userAfterOtp?.otpHash).toBeUndefined();
    expect(userAfterOtp?.resetTokenHash).toBe(hashToken(rawResetToken));

    // Reset password using the preserved token
    await authService.resetPassword(rawResetToken, 'NewPassAfterOtp123!');

    // New password allows login
    const loginResult = await authService.login(email, 'NewPassAfterOtp123!');
    expect(loginResult.tokens.accessToken).toBeDefined();
  });

  it('4. Expired reset token is rejected', async () => {
    const email = `bug01-expired-${Date.now()}@petverse.test`;
    await authService.register({
      firstName: 'Dave',
      lastName: 'Tester',
      email,
      password: 'OldPassword123!',
    });

    const user = (await userRepository.findByEmail(email))!;
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // Set expired reset token (1 minute in the past)
    await userRepository.updateById(user._id.toString(), {
      resetTokenHash: hashToken(rawResetToken),
      resetTokenExpiry: new Date(Date.now() - 60 * 1000),
    });

    await expect(
      authService.resetPassword(rawResetToken, 'NewExpiredPass123!')
    ).rejects.toThrow(AppError);
  });

  it('5. Used reset token cannot be reused', async () => {
    const email = `bug01-singleuse-${Date.now()}@petverse.test`;
    await authService.register({
      firstName: 'Eve',
      lastName: 'Tester',
      email,
      password: 'OldPassword123!',
    });

    const user = (await userRepository.findByEmail(email))!;
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    await userRepository.updateById(user._id.toString(), {
      resetTokenHash: hashToken(rawResetToken),
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    // First use: succeeds
    await authService.resetPassword(rawResetToken, 'FirstReset123!');

    // Second use: must be rejected
    await expect(
      authService.resetPassword(rawResetToken, 'SecondReset123!')
    ).rejects.toThrow(AppError);
  });

  it('6. Password reset still revokes active refresh sessions', async () => {
    const email = `bug01-session-revoke-${Date.now()}@petverse.test`;
    await authService.register({
      firstName: 'Frank',
      lastName: 'Tester',
      email,
      password: 'OldPassword123!',
    });

    // Login to obtain active session with refreshToken
    const loginResult = await authService.login(email, 'OldPassword123!');
    const activeRefreshToken = loginResult.tokens.refreshToken;

    // Verify session is active
    const refreshed = await authService.refreshTokens(activeRefreshToken);
    expect(refreshed.accessToken).toBeDefined();

    // Now issue a password reset token and execute password reset
    const user = (await userRepository.findByEmail(email))!;
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    await userRepository.updateById(user._id.toString(), {
      resetTokenHash: hashToken(rawResetToken),
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    await authService.resetPassword(rawResetToken, 'NewSecurePassAfterSessionRevoke123!');

    // Attempting to refresh tokens with the old session must fail
    await expect(
      authService.refreshTokens(activeRefreshToken)
    ).rejects.toBeDefined();
  });
});
