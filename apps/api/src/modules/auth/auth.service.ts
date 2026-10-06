import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { totp } from 'otplib';
import { env } from '../../config/env';
import { userRepository } from '../users/user.repository';
import { UserModel } from '../users/user.model';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  AppError,
} from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import type { IUser } from '@petverse/shared-types';
import { ERROR_CODES } from '@petverse/shared-constants';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: IUser;
  tokens: AuthTokens;
}

// ─── Email Transport ───────────────────────────────────────
/**
 * Build a nodemailer transporter.
 * Uses SendGrid SMTP if SENDGRID_API_KEY is configured.
 * In dev (no key), falls back to logging the email to console
 * so developers can use OTPs and reset links without a mail server.
 */
function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: env.SENDGRID_API_KEY,
      },
    });
  }

  // Dev fallback: stream transport (buffer messages, don't actually send)
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const hasMailProvider = !!(env.SENDGRID_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER));
  if (!hasMailProvider || process.env.NODE_ENV === 'test') {
    // No external mail server configured — log to stdout so developers can see OTPs and reset links
    logger.info(`[DEV EMAIL] (No mail provider configured) To: ${to} | Subject: ${subject}`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `PetVerse <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

// ─── Token Utilities ───────────────────────────────────────
function signAccessToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

async function hashToken(token: string): Promise<string> {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Auth Service ──────────────────────────────────────────
export const authService = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResult> {
    const exists = await userRepository.exists({ email: data.email.toLowerCase() });
    if (exists) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await userRepository.create({
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
      isVerified: false,
    });

    return this._issueTokens(user);
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(
      email.toLowerCase(),
      '+passwordHash +failedLoginAttempts +lockUntil'
    );

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      throw new AppError(
        `Account temporarily locked due to consecutive failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    if (!user.isActive) {
      throw new AppError('Account is disabled', 403, ERROR_CODES.ACCOUNT_DISABLED);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MINUTES = 15;

      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_ATTEMPTS) {
        updateData.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        updateData.failedLoginAttempts = 0;
        await userRepository.updateById(user._id.toString(), updateData);
        throw new AppError(
          `Account locked for ${LOCKOUT_MINUTES} minutes due to multiple failed login attempts.`,
          423,
          'ACCOUNT_LOCKED'
        );
      } else {
        await userRepository.updateById(user._id.toString(), updateData);
        throw new UnauthorizedError('Invalid email or password');
      }
    }

    // Reset failed login counter on successful password verification
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      await userRepository.updateById(user._id.toString(), {
        failedLoginAttempts: 0,
        lockUntil: undefined,
      });
    }

    return this._issueTokens(user);
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: { userId: string };

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenHash = await hashToken(refreshToken);
    const user = await userRepository.findById(payload.userId, '+refreshTokenHash');

    if (!user || user.refreshTokenHash !== tokenHash) {
      if (user) {
        // Reuse detected: invalidate all sessions for security
        await userRepository.updateById(user._id.toString(), {
          $unset: { refreshTokenHash: 1 },
        });
      }
      throw new UnauthorizedError('Refresh token reuse detected');
    }

    const userId = user._id.toString();
    const newAccessToken = signAccessToken({
      userId,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = signRefreshToken(userId);
    const newRefreshTokenHash = await hashToken(newRefreshToken);

    await userRepository.updateById(userId, {
      refreshTokenHash: newRefreshTokenHash,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60,
    };
  },

  async googleAuth(idToken: string): Promise<AuthResult> {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedError('Invalid Google token');
    }

    let user = await userRepository.findByGoogleId(payload.sub);

    if (!user) {
      user = await userRepository.findByEmail(payload.email);

      if (user) {
        await userRepository.updateById(user._id.toString(), {
          googleId: payload.sub,
          isVerified: true,
          ...(payload.picture && !user.profile.avatar
            ? { 'profile.avatar': payload.picture }
            : {}),
        });
      } else {
        user = await userRepository.create({
          email: payload.email.toLowerCase(),
          googleId: payload.sub,
          isVerified: true,
          profile: {
            firstName: payload.given_name ?? 'User',
            lastName: payload.family_name ?? '',
            avatar: payload.picture,
          },
        });
      }
    }

    if (!user) throw new AppError('Failed to create user', 500);

    return this._issueTokens(user);
  },

  async sendOtp(target: string, _type: 'email' | 'phone'): Promise<void> {
    const user = await userRepository.findByEmail(target);
    if (!user) throw new NotFoundError('User');

    // Generate TOTP with 5-minute TTL
    totp.options = { step: 300, digits: 6 };
    const secret = crypto.randomBytes(20).toString('hex');
    const otp = totp.generate(secret);
    const otpHash = await hashToken(otp);

    await userRepository.updateById(user._id.toString(), {
      otpHash,
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
    });

    logger.info(`[AUTH OTP] Generated verification OTP for ${target}: ${otp}`);

    await sendEmail(
      target,
      'Your PetVerse Verification Code',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#6366f1;margin-bottom:8px;">PetVerse</h2>
          <p style="color:#374151;">Your verification code is:</p>
          <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#6366f1;padding:20px 0;">${otp}</div>
          <p style="color:#6b7280;font-size:14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      `
    );
  },

  async verifyOtp(target: string, otp: string): Promise<boolean> {
    const user = await userRepository.findByEmail(target, '+otpHash +otpExpiry');
    if (!user) throw new NotFoundError('User');

    // If OTP has expired, reject
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      throw new AppError('OTP has expired', 400, ERROR_CODES.OTP_EXPIRED);
    }

    // In non-production, allow demo code 123456 only if no mail provider is configured and no specific OTP was generated
    const hasMailProvider = !!(env.SENDGRID_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER));
    const isDemoBypass = env.NODE_ENV !== 'production' && otp === '123456' && !hasMailProvider && !user.otpHash;

    if (!isDemoBypass) {
      if (!user.otpHash || !user.otpExpiry) {
        throw new AppError('OTP has expired', 400, ERROR_CODES.OTP_EXPIRED);
      }

      const hash = await hashToken(otp);
      if (hash !== user.otpHash) {
        throw new AppError('Invalid OTP', 400, ERROR_CODES.OTP_INVALID);
      }
    }

    await userRepository.updateById(user._id.toString(), {
      isVerified: true,
      $unset: { otpHash: 1, otpExpiry: 1 },
    });

    return true;
  },

  /**
   * Initiate the password reset flow. Generates a secure token, stores its
   * hash in the user document, and sends a reset link via email.
   * Never reveals whether the email exists (enumeration protection).
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) return; // Silent — do not leak account existence

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Use dedicated resetTokenHash/resetTokenExpiry fields to avoid clobbering email OTP verification
    await userRepository.updateById(user._id.toString(), {
      resetTokenHash,
      resetTokenExpiry,
    });

    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      'Reset Your PetVerse Password',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#6366f1;margin-bottom:8px;">PetVerse</h2>
          <p style="color:#374151;">You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:12px;">This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>
          <p style="color:#9ca3af;font-size:11px;word-break:break-all;">Or copy this URL: ${resetUrl}</p>
        </div>
      `
    );
  },

  /**
   * Complete the password reset. Validates the token and updates the password.
   * Also invalidates all existing sessions (clears refreshTokenHash).
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = await hashToken(token);

    // Find user by hashed reset token that hasn't expired
    const userDoc = await UserModel.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpiry').exec();

    if (!userDoc) {
      throw new AppError(
        'Password reset token is invalid or has expired',
        400,
        'INVALID_RESET_TOKEN'
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    // Update password, clear reset token, and revoke all active sessions
    await userRepository.updateById(userDoc._id.toString(), {
      passwordHash,
      $unset: { resetTokenHash: 1, resetTokenExpiry: 1, refreshTokenHash: 1 },
    });
  },

  async logout(userId: string): Promise<void> {
    await userRepository.updateById(userId, {
      $unset: { refreshTokenHash: 1 },
    });
  },

  // ─── Private ──────────────────────────────────────────────
  async _issueTokens(user: Awaited<ReturnType<typeof userRepository.findByEmail>>): Promise<AuthResult> {
    if (!user) throw new AppError('User not found', 404);

    const userId = user._id.toString();
    const accessToken = signAccessToken({ userId, email: user.email, role: user.role });
    const refreshToken = signRefreshToken(userId);
    const refreshTokenHash = await hashToken(refreshToken);

    await userRepository.updateById(userId, { refreshTokenHash });

    return {
      user: user.toJSON() as unknown as IUser,
      tokens: { accessToken, refreshToken, expiresIn: 15 * 60 },
    };
  },
};
