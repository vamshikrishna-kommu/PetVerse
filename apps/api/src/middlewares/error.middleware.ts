import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';
import { ERROR_CODES } from '@petverse/shared-constants';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let code: string = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details: Array<{ field: string; message: string }> | undefined;

  // Known operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  }

  // Mongoose validation errors
  else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose cast error (invalid ObjectId)
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = ERROR_CODES.INVALID_INPUT;
    message = `Invalid value for field: ${error.path}`;
  }

  // MongoDB duplicate key
  else if ((error as any).code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.ALREADY_EXISTS;
    const keyMatch = error.message.match(/index: (.+?) dup key/);
    message = keyMatch
      ? `${keyMatch[1].split('_')[0]} already exists`
      : 'Duplicate value found';
  }

  // JWT errors (handled by auth middleware, but belt-and-suspenders)
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.TOKEN_INVALID;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Token has expired';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error({
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      // Include stack only in development
      ...(env.NODE_ENV === 'development' && statusCode >= 500
        ? { stack: error.stack }
        : {}),
    },
  });
}

/** Catch unhandled async errors in Express route handlers */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
