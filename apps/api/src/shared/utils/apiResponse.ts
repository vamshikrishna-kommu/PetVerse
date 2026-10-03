import type { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export const apiResponse = {
  success<T>(res: Response, data: T, statusCode = 200, meta?: ApiSuccessResponse['meta']): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      data,
      ...(meta ? { meta } : {}),
    } satisfies ApiSuccessResponse<T>);
  },

  created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  },

  noContent(res: Response): Response {
    return res.status(204).send();
  },

  paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response {
    return this.success(res, data, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  },
};
