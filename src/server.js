import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import './models/db.js';
import './migrations/runMigrations.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import errorHandler from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { validateBody, validateQuery, schemas } from './utils/validate.js';
import * as authController from './controllers/authController.js';
import * as quizController from './controllers/quizController.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(apiRateLimiter);

// Static testing interface
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Auth
app.post('/api/auth/login', validateBody(schemas.login), authController.login);

// Quiz endpoints (protected)
app.post('/api/quiz/generate', requireAuth, validateBody(schemas.generateQuiz), quizController.generate);
app.post('/api/quiz/submit', requireAuth, validateBody(schemas.submitQuiz), quizController.submit);
app.get('/api/quiz/history', requireAuth, validateQuery(schemas.history), quizController.history);
app.post('/api/quiz/:quizId/retry', requireAuth, validateBody(schemas.retry), quizController.retry);
app.post('/api/quiz/:quizId/hint', requireAuth, validateBody(schemas.hint), quizController.hint);

// Not found
app.use((_req, res) => res.status(404).json({ ok: false, error: { message: 'Route not found' } }));

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`AI Quizzer backend listening on http://localhost:${config.port}`);
});

export default app;


