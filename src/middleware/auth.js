import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { Unauthorized } from '../utils/errors.js';

export const signToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' });
};

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(Unauthorized('Missing Authorization header'));
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch {
    next(Unauthorized('Invalid or expired token'));
  }
};

export default { signToken, requireAuth };


