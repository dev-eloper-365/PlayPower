// Application Constants
export const APP_CONFIG = {
  DEFAULT_PORT: 3000,
  DEFAULT_JWT_EXPIRES_IN: '2h',
  DEFAULT_CACHE_TTL: 600, // 10 minutes
  DEFAULT_RATE_LIMIT_WINDOW: 60000, // 1 minute
  DEFAULT_RATE_LIMIT_MAX: 100,
  EMAIL_TIMEOUT: 8000, // 8 seconds
  EMAIL_CONNECTION_TIMEOUT: 5000, // 5 seconds
  EMAIL_SOCKET_TIMEOUT: 10000, // 10 seconds
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Database Constants
export const DB_CONFIG = {
  DEFAULT_DB_FILE: 'data/quiz.db',
  MIGRATION_TIMEOUT: 30000, // 30 seconds
};

// Quiz Constants
export const QUIZ_CONFIG = {
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 20,
  DEFAULT_QUESTIONS: 5,
  DIFFICULTY_LEVELS: ['EASY', 'MEDIUM', 'HARD', 'MIX'],
  GRADE_RANGES: {
    PRIMARY: { min: 1, max: 5 },
    MIDDLE: { min: 6, max: 8 },
    SECONDARY: { min: 9, max: 10 },
    HIGHER_SECONDARY: { min: 11, max: 12 },
  },
  STREAM_REQUIRED_GRADES: [11, 12],
};

// Email Constants
export const EMAIL_CONFIG = {
  DEFAULT_FROM: 'noreply@aiquizzer.com',
  PRIORITY: '3',
  MAILER: 'AI Quizzer',
  SPAM_CHECK: 'no',
  HEADERS: {
    'X-Priority': '3',
    'X-Mailer': 'AI Quizzer',
    'X-Spam-Check': 'no',
  },
};

// Cache Keys
export const CACHE_KEYS = {
  QUIZ_HISTORY: (userId, grade, subject, stream, minMarks, maxMarks, from, to, page, pageSize) => 
    `hist:${userId}:${grade}:${subject}:${stream}:${minMarks}:${maxMarks}:${from}:${to}:${page}:${pageSize}`,
  QUESTION_GENERATION: (subject, grade, stream, bucket, count, difficulty) => 
    `gen:${subject}:${grade}:${stream || 'none'}:${bucket || 'new'}:${count}:${difficulty || 'MIX'}`,
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  QUIZ_NOT_FOUND: 'Quiz not found',
  QUESTION_NOT_FOUND: 'Question not found',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  INVALID_SUBJECT: 'Invalid subject for grade',
  STREAM_REQUIRED: 'Stream is required for grades 11-12',
  EMAIL_SEND_FAILED: 'Email send failed',
  SMTP_NOT_CONFIGURED: 'SMTP not configured',
  SENDGRID_NOT_CONFIGURED: 'SendGrid not configured',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  QUIZ_GENERATED: 'Quiz generated successfully',
  QUIZ_SUBMITTED: 'Quiz submitted successfully',
  EMAIL_SENT: 'Email sent successfully',
  EMAIL_SKIPPED: 'Email skipped (not configured)',
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_MAX_LENGTH: 255,
  QUIZ_ID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

// File Paths
export const FILE_PATHS = {
  DATABASE: 'data/quiz.db',
  MIGRATIONS: 'src/migrations',
  LOGS: 'logs',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  QUIZ: {
    GENERATE: '/api/quiz/generate',
    SUBMIT: '/api/quiz/submit',
    HISTORY: '/api/quiz/history',
    HINT: (quizId) => `/api/quiz/${quizId}/hint`,
    RETRY: (quizId) => `/api/quiz/${quizId}/retry`,
    SEND_RESULT: (quizId) => `/api/quiz/${quizId}/send-result`,
  },
  LEADERBOARD: '/api/leaderboard',
  CONFIG: '/api/config',
};
