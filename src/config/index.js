import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  dbFile: process.env.DB_FILE || path.resolve(__dirname, '../../data/quiz.db'),
  groqApiKey: process.env.GROQ_API_KEY || '',
  rateLimit: {
    windowMs: Number(process.env.RATE_WINDOW_MS || 60_000),
    max: Number(process.env.RATE_MAX_REQUESTS || 100),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.SENDGRID_FROM || 'noreply@aiquizzer.com',
  },
  redis: {
    url: process.env.REDIS_URL || '',
    ttlSeconds: Number(process.env.CACHE_TTL_SECONDS || 60),
  },
};

export default config;


