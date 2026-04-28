export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
  toJSON(requestId: string): {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  } {
    const base: { code: string; message: string; details?: unknown; requestId: string } = {
      code: this.code,
      message: this.message,
      requestId,
    };
    if (this.details !== undefined) base.details = this.details;
    return base;
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
}
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
}
export class NotFoundError extends AppError {
  readonly statusCode = 404;
}
export class ValidationError extends AppError {
  readonly statusCode = 400;
}
export class BadGatewayError extends AppError {
  readonly statusCode = 502;
}
export class InternalError extends AppError {
  readonly statusCode = 500;
}
