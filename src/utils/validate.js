import Joi from 'joi';
import { BadRequest } from './errors.js';

export const validateBody = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(BadRequest('Request body validation failed', error.details));
  req.body = value;
  next();
};

export const validateQuery = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(BadRequest('Query parameter validation failed', error.details));
  // Do not mutate req.query in Express 5 (getter-only); attach validated copy
  req.queryValidated = value;
  next();
};

export const schemas = {
  login: Joi.object({
    username: Joi.string().min(2).max(64).required(),
    password: Joi.string().min(2).max(128).required(),
  }),
  generateQuiz: Joi.object({
    grade: Joi.number().integer().min(1).max(12).required(),
    Subject: Joi.string().required(),
    TotalQuestions: Joi.number().integer().min(1).max(50).required(),
    MaxScore: Joi.number().integer().min(1).max(100).required(),
    Difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').required(),
    Stream: Joi.string().valid('Science Stream', 'Commerce Stream', 'Arts / Humanities Stream').when('grade', {
      is: Joi.number().integer().min(11).max(12),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
  }).required(),
  submitQuiz: Joi.object({
    quizId: Joi.string().required(),
    responses: Joi.array().items(Joi.object({ questionId: Joi.string().required(), userResponse: Joi.string().valid('A','B','C','D').required() })).min(1).required(),
  }),
  history: Joi.object({
    grade: Joi.number().integer().min(1).max(12).optional(),
    subject: Joi.string().min(2).max(64).optional(),
    stream: Joi.string().valid('Science Stream', 'Commerce Stream', 'Arts / Humanities Stream').optional(),
    minMarks: Joi.number().min(0).max(100).optional(),
    maxMarks: Joi.number().min(0).max(100).optional(),
    from: Joi.alternatives(
      Joi.date().iso(),
      Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    ).optional(),
    to: Joi.alternatives(
      Joi.date().iso(),
      Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    ).optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(10),
  }),
  hint: Joi.object({
    questionId: Joi.string().required(),
  }),
  retry: Joi.object({
    responses: Joi.array().items(Joi.object({ questionId: Joi.string().required(), userResponse: Joi.string().valid('A','B','C','D').required() })).min(1).required(),
  }),
};

export default { validateBody, validateQuery, schemas };


