import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject, ZodEffects } from 'zod';
import { ValidationError } from '../shared/errors/AppError';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/** Validate request body/query/params against a Zod schema */
export function validate(schema: Schema, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync(req[source]);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // Replace with parsed (coerced/transformed) values
    req[source] = result.data;
    next();
  };
}
