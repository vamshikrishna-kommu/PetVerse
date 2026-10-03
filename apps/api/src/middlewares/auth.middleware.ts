import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError, TokenExpiredError, TokenInvalidError } from '../shared/errors/AppError';
import type { UserRole } from '@petverse/shared-types';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Verify JWT access token and attach user to request */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return next(new UnauthorizedError('No token provided'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new TokenExpiredError());
    }
    return next(new TokenInvalidError());
  }
}

/** Optional auth — attaches user if token present, continues if not */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
  } catch {
    // ignore invalid/expired tokens
  }
  next();
}

/** Require specific role(s) — must be used after authenticate */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

/** Require the requesting user to own the resource (or be admin) */
export function requireOwnership(
  getOwnerId: (req: Request) => string | undefined
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.role === 'admin') return next();

    const ownerId = getOwnerId(req);
    if (!ownerId || ownerId !== req.user.userId) {
      return next(new ForbiddenError('You do not own this resource'));
    }
    next();
  };
}
