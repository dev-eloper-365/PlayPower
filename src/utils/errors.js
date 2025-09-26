export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const BadRequest = (msg = 'Invalid request', details) => new HttpError(400, msg, details);
export const Unauthorized = (msg = 'Unauthorized') => new HttpError(401, msg);
export const Forbidden = (msg = 'Forbidden') => new HttpError(403, msg);
export const NotFound = (msg = 'Not Found') => new HttpError(404, msg);
export const TooManyRequests = (msg = 'Too Many Requests') => new HttpError(429, msg);
export const ServerError = (msg = 'Internal Server Error', details) => new HttpError(500, msg, details);

export default {
  HttpError,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  TooManyRequests,
  ServerError,
};


