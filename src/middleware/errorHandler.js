import { HttpError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('errors');

export const errorHandler = (err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.statusCode : 500;
  if (status >= 500) log.error('Unhandled error:', err);
  res.status(status).json({
    ok: false,
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details || undefined,
    },
  });
};

export default errorHandler;


