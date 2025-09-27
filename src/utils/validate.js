import Joi from 'joi';
import { BadRequest } from './errors.js';
import { VALIDATION_RULES, QUIZ_CONFIG, ERROR_MESSAGES } from '../constants/index.js';

class ValidationMiddleware {
  validateBody(schema) {
    return (req, _res, next) => {
      const { error, value } = schema.validate(req.body, { 
        abortEarly: false, 
        stripUnknown: true 
      });
      
      if (error) {
        return next(BadRequest(ERROR_MESSAGES.INVALID_REQUEST, error.details));
      }
      
      req.body = value;
      next();
    };
  }

  validateQuery(schema) {
    return (req, _res, next) => {
      const { error, value } = schema.validate(req.query, { 
        abortEarly: false, 
        stripUnknown: true 
      });
      
      if (error) {
        return next(BadRequest(ERROR_MESSAGES.INVALID_REQUEST, error.details));
      }
      
      // Do not mutate req.query in Express 5 (getter-only); attach validated copy
      req.queryValidated = value;
      next();
    };
  }
}

class ValidationSchemas {
  constructor() {
    this.usernameRules = Joi.string()
      .min(VALIDATION_RULES.USERNAME_MIN_LENGTH)
      .max(VALIDATION_RULES.USERNAME_MAX_LENGTH)
      .required();
    
    this.passwordRules = Joi.string()
      .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
      .required();
    
    this.emailRules = Joi.string()
      .email()
      .max(VALIDATION_RULES.EMAIL_MAX_LENGTH)
      .required();
    
    this.gradeRules = Joi.number()
      .integer()
      .min(QUIZ_CONFIG.GRADE_RANGES.PRIMARY.min)
      .max(QUIZ_CONFIG.GRADE_RANGES.HIGHER_SECONDARY.max)
      .required();
    
    this.quizIdRules = Joi.string()
      .pattern(VALIDATION_RULES.QUIZ_ID_PATTERN)
      .required();
  }

  get login() {
    return Joi.object({
      username: this.usernameRules,
      password: this.passwordRules,
    });
  }

  get generateQuiz() {
    return Joi.object({
      grade: this.gradeRules,
      Subject: Joi.string().required(),
      TotalQuestions: Joi.number()
        .integer()
        .min(QUIZ_CONFIG.MIN_QUESTIONS)
        .max(QUIZ_CONFIG.MAX_QUESTIONS)
        .required(),
      MaxScore: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required(),
      Difficulty: Joi.string()
        .valid(...QUIZ_CONFIG.DIFFICULTY_LEVELS)
        .required(),
      Stream: Joi.string()
        .valid('Science Stream', 'Commerce Stream', 'Arts / Humanities Stream')
        .when('grade', {
          is: Joi.number().integer().min(11).max(12),
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
    }).required();
  }

  get submitQuiz() {
    return Joi.object({
      quizId: this.quizIdRules,
      responses: Joi.array()
        .items(
          Joi.object({
            questionId: Joi.string().required(),
            userResponse: Joi.string().valid('A', 'B', 'C', 'D').required()
          })
        )
        .min(1)
        .required(),
    });
  }

  get history() {
    return Joi.object({
      grade: Joi.number()
        .integer()
        .min(QUIZ_CONFIG.GRADE_RANGES.PRIMARY.min)
        .max(QUIZ_CONFIG.GRADE_RANGES.HIGHER_SECONDARY.max)
        .optional(),
      subject: Joi.string()
        .min(2)
        .max(64)
        .optional(),
      stream: Joi.string()
        .valid('Science Stream', 'Commerce Stream', 'Arts / Humanities Stream')
        .optional(),
      minMarks: Joi.number()
        .min(0)
        .max(100)
        .optional(),
      maxMarks: Joi.number()
        .min(0)
        .max(100)
        .optional(),
      from: Joi.alternatives(
        Joi.date().iso(),
        Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
      ).optional(),
      to: Joi.alternatives(
        Joi.date().iso(),
        Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
      ).optional(),
      page: Joi.number()
        .integer()
        .min(1)
        .default(1),
      pageSize: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    });
  }

  get hint() {
    return Joi.object({
      questionId: Joi.string().required(),
    });
  }

  get retry() {
    return Joi.object({
      responses: Joi.array()
        .items(
          Joi.object({
            questionId: Joi.string().required(),
            userResponse: Joi.string().valid('A', 'B', 'C', 'D').required()
          })
        )
        .min(1)
        .required(),
    });
  }

  get leaderboard() {
    return Joi.object({
      grade: Joi.number()
        .integer()
        .min(QUIZ_CONFIG.GRADE_RANGES.PRIMARY.min)
        .max(QUIZ_CONFIG.GRADE_RANGES.HIGHER_SECONDARY.max)
        .optional(),
      subject: Joi.string()
        .min(1)
        .max(64)
        .optional(),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
    });
  }
}

const validationMiddleware = new ValidationMiddleware();
const validationSchemas = new ValidationSchemas();

export const validateBody = (schema) => validationMiddleware.validateBody(schema);
export const validateQuery = (schema) => validationMiddleware.validateQuery(schema);
export const schemas = validationSchemas;

export default { validateBody, validateQuery, schemas };


