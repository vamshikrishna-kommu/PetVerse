import { ERROR_CODES } from '@petverse/shared-constants';

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode | string;
  public readonly details?: Array<{ field: string; message: string }>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code: ErrorCode | string = ERROR_CODES.INTERNAL_ERROR,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    details?: Array<{ field: string; message: string }>
  ) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, ERROR_CODES.ALREADY_EXISTS);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, ERROR_CODES.TOKEN_EXPIRED);
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super('Token is invalid', 401, ERROR_CODES.TOKEN_INVALID);
  }
}
