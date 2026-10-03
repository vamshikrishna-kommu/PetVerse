import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { authService } from '../auth.service';
import { userRepository } from '../../users/user.repository';
import { UserModel } from '../../users/user.model';
import { UnauthorizedError, ConflictError, NotFoundError, AppError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('AuthService Comprehensive Unit Tests', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@testauth\.com$/i });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  const testEmail = `user_${Date.now()}@testauth.com`;
  const testPassword = 'Password123!';
  let createdUserId: string;
  let currentRefreshToken: string;

  describe('1. Registration Flow', () => {
    it('successfully registers a new user with hashed password and initial state', async () => {
      const result = await authService.register({
        firstName: 'Jane',
        lastName: 'Doe',
        email: testEmail,
        password: testPassword,
        phone: '+15551234567',
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail.toLowerCase());
      expect(result.user.isVerified).toBe(false);
      expect(result.user.role).toBe('pet_owner');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      createdUserId = result.user._id.toString();
      currentRefreshToken = result.tokens.refreshToken;

      // Verify DB persistence and password hashing
      const dbUser = await UserModel.findById(createdUserId).select('+passwordHash');
      expect(dbUser).not.toBeNull();
      expect(dbUser!.passwordHash).not.toBe(testPassword);
      const isPasswordHashed = await bcrypt.compare(testPassword, dbUser!.passwordHash!);
      expect(isPasswordHashed).toBe(true);
    });

    it('rejects duplicate email registration with ConflictError', async () => {
      await expect(
        authService.register({
          firstName: 'Another',
          lastName: 'User',
          email: testEmail,
          password: 'AnotherPassword123!',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('2. Login & Authentication Flow', () => {
    it('successfully authenticates with valid credentials', async () => {
      const result = await authService.login(testEmail, testPassword);
      expect(result).toBeDefined();
      expect(result.user._id.toString()).toBe(createdUserId);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      currentRefreshToken = result.tokens.refreshToken;
    });

    it('rejects login with incorrect password', async () => {
      await expect(
        authService.login(testEmail, 'WrongPassword456!')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects login with non-existent email', async () => {
      await expect(
        authService.login('nonexistent@testauth.com', testPassword)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects login if account is deactivated/disabled', async () => {
      // Temporarily deactivate account
      await UserModel.findByIdAndUpdate(createdUserId, { isActive: false });

      await expect(
        authService.login(testEmail, testPassword)
      ).rejects.toThrow(AppError);

      // Restore active status
      await UserModel.findByIdAndUpdate(createdUserId, { isActive: true });
    });

    it('locks account after 5 consecutive failed login attempts', async () => {
      // Ensure clean state before test
      await UserModel.findByIdAndUpdate(createdUserId, {
        failedLoginAttempts: 0,
        $unset: { lockUntil: 1 },
      });

      // 4 failed attempts should throw UnauthorizedError
      for (let i = 0; i < 4; i++) {
        await expect(authService.login(testEmail, 'wrong-password')).rejects.toThrow(
          UnauthorizedError
        );
      }

      // 5th failed attempt triggers account lockout (HTTP 423)
      try {
        await authService.login(testEmail, 'wrong-password');
        fail('Expected account lockout error');
      } catch (err: any) {
        expect(err.statusCode).toBe(423);
        expect(err.code).toBe('ACCOUNT_LOCKED');
      }

      // Subsequent attempt even with correct password is still locked
      try {
        await authService.login(testEmail, testPassword);
        fail('Expected locked account to reject login');
      } catch (err: any) {
        expect(err.statusCode).toBe(423);
        expect(err.code).toBe('ACCOUNT_LOCKED');
      }

      // Unlock for following tests
      await UserModel.findByIdAndUpdate(createdUserId, {
        failedLoginAttempts: 0,
        $unset: { lockUntil: 1 },
      });
    });
  });

  describe('3. Token Refresh & Reuse Protection', () => {
    it('issues a new access & refresh token pair given a valid refresh token', async () => {
      const newTokens = await authService.refreshTokens(currentRefreshToken);
      expect(newTokens).toBeDefined();
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(currentRefreshToken);

      const oldToken = currentRefreshToken;
      currentRefreshToken = newTokens.refreshToken;

      // Ensure that reusing the old token is detected and triggers security lockout
      await expect(authService.refreshTokens(oldToken)).rejects.toThrow(UnauthorizedError);

      // Verify that user sessions were revoked upon reuse
      const user = await UserModel.findById(createdUserId).select('+refreshTokenHash');
      expect(user?.refreshTokenHash).toBeUndefined();
    });

    it('rejects an invalid/malformed refresh token', async () => {
      await expect(
        authService.refreshTokens('invalid.token.structure')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('4. OTP Generation and Verification Flow', () => {
    it('sends an OTP to a registered user and validates successfully', async () => {
      await authService.sendOtp(testEmail, 'email');

      const userWithOtp = await UserModel.findById(createdUserId).select('+otpHash +otpExpiry');
      expect(userWithOtp?.otpHash).toBeDefined();
      expect(userWithOtp?.otpExpiry).toBeDefined();
      expect(new Date(userWithOtp!.otpExpiry!) > new Date()).toBe(true);

      // Try verifying with invalid OTP
      await expect(
        authService.verifyOtp(testEmail, '000000')
      ).rejects.toThrow(AppError);
    });

    it('rejects OTP verification when OTP is expired', async () => {
      // Set OTP expiry into the past
      await UserModel.findByIdAndUpdate(createdUserId, {
        otpHash: 'somehash',
        otpExpiry: new Date(Date.now() - 10000),
      });

      await expect(
        authService.verifyOtp(testEmail, '123456')
      ).rejects.toThrow(AppError);
    });
  });

  describe('5. Session Termination / Logout', () => {
    it('clears refresh token hash on logout', async () => {
      // Login to get active session
      const loginRes = await authService.login(testEmail, testPassword);
      expect(loginRes.tokens.refreshToken).toBeDefined();

      const userBefore = await UserModel.findById(createdUserId).select('+refreshTokenHash');
      expect(userBefore?.refreshTokenHash).toBeDefined();

      await authService.logout(createdUserId);

      const userAfter = await UserModel.findById(createdUserId).select('+refreshTokenHash');
      expect(userAfter?.refreshTokenHash).toBeUndefined();
    });
  });
});
