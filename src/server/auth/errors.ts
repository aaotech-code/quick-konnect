export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = 'Not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  readonly status = 422;
  constructor(message = 'Invalid input.') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  readonly status = 409;
  constructor(message = 'Conflict.') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class FeatureDisabledError extends Error {
  readonly status = 409;
  readonly feature: string;
  constructor(feature: string, message: string) {
    super(message);
    this.name = 'FeatureDisabledError';
    this.feature = feature;
  }
}
