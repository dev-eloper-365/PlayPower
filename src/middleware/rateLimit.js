import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

export default apiRateLimiter;


