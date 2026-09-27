import { AppError } from './app-error';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details?: unknown) {
    super(message, 429, 'TOO_MANY_REQUESTS', details);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', details?: unknown) {
    super(message, 429, 'RATE_LIMITED', details);
  }
}

export class UsageLimitReachedError extends AppError {
  constructor(
    message = "You've reached your monthly limit for this feature. Your limit resets on the 1st of next month.",
    details?: unknown,
  ) {
    super(message, 429, 'USAGE_LIMIT_REACHED', details);
  }
}

export class TooManyActiveRequestsError extends AppError {
  constructor(
    message = 'You already have requests in progress. Please wait for them to finish.',
    details?: unknown,
  ) {
    super(message, 429, 'TOO_MANY_ACTIVE_REQUESTS', details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request payload is too large.', details?: unknown) {
    super(message, 413, 'REQUEST_TOO_LARGE', details);
  }
}

export class InvalidFileError extends AppError {
  constructor(message = 'Invalid file uploaded.', details?: unknown) {
    super(message, 400, 'INVALID_FILE', details);
  }
}

export class RequestTimeoutError extends AppError {
  constructor(message = 'Request timed out.', details?: unknown) {
    super(message, 408, 'REQUEST_TIMEOUT', details);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}
