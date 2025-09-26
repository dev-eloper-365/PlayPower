AI Quizzer Backend Microservice

Overview
- Node.js (Express) backend for AI-powered quizzes with JWT auth, SQLite, and a built-in testing interface.

Quick Start
1) Copy .env.example to .env and adjust values.
2) npm install (already set up by scaffold).
3) npm run migrate
4) npm run dev

Environment
- PORT=3000
- JWT_SECRET=change-me
- JWT_EXPIRES_IN=2h
- DB_FILE=./data/quiz.db
- GROQ_API_KEY= (optional)
- RATE_WINDOW_MS=60000
- RATE_MAX_REQUESTS=100
- CORS_ORIGIN=*

API Endpoints
- POST /api/auth/login { username, password } -> { token }
- POST /api/quiz/generate { grade, subject } (auth)
- POST /api/quiz/submit { quizId, answers } (auth)
- GET /api/quiz/history?filters (auth)
- POST /api/quiz/:quizId/retry { answers } (auth)
- POST /api/quiz/:quizId/hint { questionId } (auth)

Testing Interface
- Visit / to use the HTML tester in `public/` (JWT is stored in sessionStorage).

Migrations
- Stored in src/migrations, run via `npm run migrate`.

AI Integration
- Uses Groq SDK placeholder. If no key provided, falls back to deterministic local generation/evaluation/hints.

Security
- Helmet, rate limiting, input validation (Joi), sanitized responses.

Notes
- Mock authentication: first login creates user with provided password; later logins verify the same.

Deployment (no Docker)
- Render: Create a Web Service from this repo/folder.
  - Runtime: Node 20
  - Build command: `npm install && npm run migrate`
  - Start command: `npm start`
  - Env: set `PORT`, `JWT_SECRET`, optional `GROQ_API_KEY`, and `DB_FILE` (persist if needed)
- Railway/Heroku: Similar commands. Ensure `npm run migrate` runs before start.
- Windows/Linux VM: `npm install`, `npm run migrate`, `npm start` (use a process manager like PM2).

Documentation
- Postman collection included: `postman_collection.json`. Import and set `baseUrl` and `token` variables.

Known Issues / Limitations
- AI generation uses a local fallback bank if GROQ_API_KEY is not set.
- SQLite is single-process. For production scale, swap to Postgres/MySQL and update models.


