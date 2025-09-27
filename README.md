# AI Quizzer Backend

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-blue.svg)](https://sqlite.org/)

**A comprehensive, AI-powered quiz management system with JWT authentication, intelligent question generation, and real-time performance analytics.**

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Introduction

AI Quizzer Backend is a robust, scalable microservice designed for educational institutions and learning platforms. It provides intelligent quiz generation, adaptive difficulty assessment, and comprehensive analytics for student performance tracking.

### Key Benefits

- **Intelligent Question Generation**: AI-powered question creation with context-aware difficulty levels
- **Adaptive Learning**: Dynamic difficulty adjustment based on student performance
- **Comprehensive Analytics**: Detailed performance tracking and leaderboard functionality
- **Scalable Architecture**: Built with modern Node.js and Express.js for high performance
- **Educational Focus**: Specifically designed for GSEB (Gujarat State Education Board) curriculum

---

## Features

- **Authentication & Authorization**
  - JWT-based secure authentication
  - Role-based access control
  - Session management

- **Quiz Management**
  - AI-powered question generation
  - Multiple difficulty levels (Easy, Medium, Hard)
  - Subject-specific question banks
  - Grade-wise curriculum alignment

- **Performance Analytics**
  - Real-time scoring and evaluation
  - Historical performance tracking
  - Adaptive difficulty recommendations
  - Comprehensive leaderboards

- **Advanced Features**
  - Hint system for challenging questions
  - Quiz retry functionality
  - Email result notifications
  - Caching for improved performance

- **Developer Experience**
  - Built-in testing interface
  - Comprehensive API documentation
  - Postman collection included
  - Docker support

---

## Project Structure

```
ai-quizzer-backend/
├── data/                          # Database files
│   ├── quiz.db                    # SQLite database
│   ├── quiz.db-shm               # SQLite shared memory
│   └── quiz.db-wal               # SQLite write-ahead log
├── public/                        # Static frontend files
│   ├── favicon.svg               # Application favicon
│   ├── index.html                # Testing interface
│   ├── script.js                 # Frontend JavaScript
│   └── styles.css                # Frontend styles
├── scripts/                       # Utility scripts
│   ├── e2e.js                    # End-to-end testing
│   └── manual-email-test.js      # Email testing utility
├── src/                          # Source code
│   ├── config/                   # Configuration management
│   │   └── index.js              # Environment configuration
│   ├── controllers/              # Request handlers
│   │   ├── authController.js     # Authentication endpoints
│   │   ├── configController.js   # Configuration endpoints
│   │   ├── leaderboardController.js # Leaderboard endpoints
│   │   └── quizController.js     # Quiz management endpoints
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   └── rateLimit.js          # Rate limiting
│   ├── migrations/               # Database migrations
│   │   ├── 001_init.sql          # Initial schema
│   │   ├── 002_add_stream.sql    # Stream support
│   │   └── runMigrations.js      # Migration runner
│   ├── models/                   # Data models
│   │   ├── db.js                 # Database connection
│   │   ├── performanceModel.js   # Performance tracking
│   │   ├── quizModel.js          # Quiz data model
│   │   ├── submissionModel.js    # Submission handling
│   │   └── userModel.js          # User management
│   ├── services/                 # Business logic
│   │   ├── aiService.js          # AI question generation
│   │   ├── cacheService.js       # Caching layer
│   │   ├── emailService.js       # Email notifications
│   │   ├── leaderboardService.js # Leaderboard logic
│   │   └── quizService.js        # Quiz management
│   ├── utils/                    # Utility functions
│   │   ├── errors.js             # Custom error classes
│   │   ├── logger.js             # Logging utilities
│   │   └── validate.js           # Input validation
│   └── server.js                 # Application entry point
├── Dockerfile                    # Docker configuration
├── package.json                  # Dependencies and scripts
├── postman_collection.json       # API testing collection
└── README.md                     # Project documentation
```

---

## Installation

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn package manager
- SQLite3 (included with Node.js)

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-quizzer-backend.git
   cd ai-quizzer-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

---

## Usage

### Basic API Usage

1. **Authentication**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "student1", "password": "password123"}'
   ```

2. **Generate a Quiz**
   ```bash
   curl -X POST http://localhost:3000/api/quiz/generate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "subject": "Mathematics",
       "grade": 10,
       "totalQuestions": 5,
       "difficulty": "MIX"
     }'
   ```

3. **Submit Quiz Answers**
   ```bash
   curl -X POST http://localhost:3000/api/quiz/submit \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "quizId": "quiz-uuid",
       "answers": [
         {"questionId": "q1", "userResponse": "A"},
         {"questionId": "q2", "userResponse": "B"}
       ]
     }'
   ```

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production server
npm start

# Run database migrations
npm run migrate

# End-to-end testing
npm run e2e

# Linting (placeholder)
npm run lint
```

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.0.0+ | Runtime environment |
| **Express.js** | 5.1.0 | Web framework |
| **SQLite3** | 3.0+ | Database |
| **JWT** | 9.0.2 | Authentication |
| **Joi** | 18.0.1 | Input validation |
| **Helmet** | 8.1.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin requests |
| **Morgan** | 1.10.1 | HTTP logging |
| **SendGrid** | 8.1.6 | Email service |
| **Redis** | 4.7.0 | Caching (optional) |
| **Groq SDK** | 0.32.0 | AI integration |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | change-me | JWT signing secret |
| `JWT_EXPIRES_IN` | 2h | Token expiration |
| `DB_FILE` | ./data/quiz.db | SQLite database path |
| `GROQ_API_KEY` | - | AI service API key |
| `SENDGRID_API_KEY` | - | Email service API key |
| `SENDGRID_FROM` | noreply@aiquizzer.com | Email sender |
| `REDIS_URL` | - | Redis connection URL |
| `CACHE_TTL_SECONDS` | 60 | Cache time-to-live |
| `RATE_WINDOW_MS` | 60000 | Rate limit window |
| `RATE_MAX_REQUESTS` | 100 | Max requests per window |
| `CORS_ORIGIN` | * | Allowed origins |

### Example .env File

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=2h

# Database
DB_FILE=./data/quiz.db

# AI Integration
GROQ_API_KEY=your-groq-api-key-here

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM=noreply@yourdomain.com

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300

# Rate Limiting
RATE_WINDOW_MS=60000
RATE_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://yourdomain.com
```

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |

### Quiz Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/quiz/generate` | Generate new quiz | Yes |
| POST | `/api/quiz/submit` | Submit quiz answers | Yes |
| GET | `/api/quiz/history` | Get quiz history | Yes |
| POST | `/api/quiz/:id/retry` | Retry quiz | Yes |
| POST | `/api/quiz/:id/hint` | Get question hint | Yes |
| POST | `/api/quiz/:id/send-result` | Send result email | Yes |

### Analytics & Leaderboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leaderboard` | Get leaderboard | No |

### Configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/config` | Get app configuration | No |

---

## Testing

### Running Tests

```bash
# End-to-end testing
npm run e2e

# Manual testing with Postman
# Import postman_collection.json
# Set baseUrl and token variables
```

### Test Coverage

The project includes comprehensive testing for:
- Authentication flows
- Quiz generation and submission
- API endpoint validation
- Error handling scenarios

---

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t ai-quizzer-backend .

# Run container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e GROQ_API_KEY=your-key \
  ai-quizzer-backend
```

### Cloud Deployment (Render)

1. Connect your GitHub repository
2. Set environment variables
3. Configure build command: `npm install && npm run migrate`
4. Set start command: `npm start`

### Environment-Specific Configuration

```bash
# Production
NODE_ENV=production
JWT_SECRET=your-production-secret
DB_FILE=/app/data/quiz.db

# Staging
NODE_ENV=staging
JWT_SECRET=your-staging-secret
DB_FILE=/app/data/quiz-staging.db
```

---

## Roadmap

### Phase 1: Core Enhancements
- [ ] Advanced AI question generation
- [ ] Multi-language support
- [ ] Enhanced analytics dashboard
- [ ] Mobile app API support

### Phase 2: Scalability
- [ ] PostgreSQL migration
- [ ] Redis clustering
- [ ] Microservices architecture
- [ ] Load balancing

### Phase 3: Advanced Features
- [ ] Real-time collaboration
- [ ] Advanced reporting
- [ ] Integration with LMS platforms
- [ ] Machine learning insights

---

## Contributing

We welcome contributions! Please follow these steps:

### Development Setup

```bash
# Fork the repository
git clone https://github.com/your-username/ai-quizzer-backend.git
cd ai-quizzer-backend

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Contribution Guidelines

1. **Code Style**: Follow existing code patterns
2. **Testing**: Add tests for new features
3. **Documentation**: Update README for API changes
4. **Commits**: Use conventional commit messages
5. **Pull Requests**: Provide clear descriptions

### Pull Request Process

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- **Express.js Team** - For the robust web framework
- **SQLite Team** - For the lightweight database solution
- **JWT Community** - For secure authentication standards
- **GSEB** - For educational curriculum guidelines
- **Open Source Community** - For the amazing tools and libraries

---

**Built with ❤️ for education and learning**


