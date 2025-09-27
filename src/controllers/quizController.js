import { generateQuizForUser, submitAnswers, retryQuiz, getHint } from '../services/quizService.js';
import { filterSubmissionsForUser } from '../models/submissionModel.js';
import { cacheGet, cacheSet } from '../services/cacheService.js';
import { sendSubmissionEmail } from '../services/resultEmailService.js';
import { CACHE_KEYS, HTTP_STATUS } from '../constants/index.js';

class QuizController {
  async generate(req, res, next) {
    try {
      const { grade, Subject, TotalQuestions, MaxScore, Difficulty, Stream } = req.body;
      const { userId } = req.user;
      
      const result = await generateQuizForUser({ 
        userId, 
        subject: Subject, 
        grade, 
        totalQuestions: TotalQuestions, 
        difficulty: Difficulty, 
        stream: Stream 
      });
      
      const response = {
        ok: true,
        quiz: {
          id: result.quiz.id,
          Subject,
          grade,
          TotalQuestions,
          MaxScore,
          Difficulty,
          Stream,
          questions: JSON.parse(result.quiz.questions_json)
        },
        difficulty: result.difficultyProfile
      };
      
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submit(req, res, next) {
    try {
      const { quizId, responses } = req.body;
      const { userId } = req.user;
      
      const result = await submitAnswers({ 
        userId, 
        quizId, 
        answers: responses 
      });
      
      const response = {
        ok: true,
        score: result.score,
        suggestions: result.suggestions,
        submissionId: result.submission.id
      };
      
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  normalizeDate(dateValue) {
    if (!dateValue) return dateValue;
    if (dateValue instanceof Date) {
      return dateValue.toISOString().slice(0, 10);
    }
    if (typeof dateValue === 'string') {
      const dateMatch = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dateMatch) {
        const [, dd, mm, yyyy] = dateMatch;
        return `${yyyy}-${mm}-${dd}`;
      }
      return dateValue;
    }
    return dateValue;
  }

  normalizeQueryParameters(queryParams) {
    const {
      grade,
      subject,
      stream,
      minMarks,
      maxMarks,
      from,
      to,
      page = 1,
      pageSize = 10
    } = queryParams || {};

    const normalizedFrom = this.normalizeDate(from);
    let normalizedTo = this.normalizeDate(to);
    
    if (typeof normalizedTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalizedTo)) {
      normalizedTo = `${normalizedTo} 23:59:59`;
    }

    return {
      grade: grade != null ? Number(grade) : grade,
      subject,
      stream,
      minMarks: minMarks != null ? Number(minMarks) : minMarks,
      maxMarks: maxMarks != null ? Number(maxMarks) : maxMarks,
      from: normalizedFrom,
      to: normalizedTo,
      page: Number(page),
      pageSize: Number(pageSize)
    };
  }

  async history(req, res, next) {
    try {
      const { userId } = req.user;
      const queryParams = this.normalizeQueryParameters(req.queryValidated);
      
      const cacheKey = CACHE_KEYS.QUIZ_HISTORY(
        userId,
        queryParams.grade ?? '',
        queryParams.subject ?? '',
        queryParams.stream ?? '',
        queryParams.minMarks ?? '',
        queryParams.maxMarks ?? '',
        queryParams.from ?? '',
        queryParams.to ?? '',
        queryParams.page,
        queryParams.pageSize
      );
      
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.status(HTTP_STATUS.OK).json(cached);
      }
      
      const offset = (queryParams.page - 1) * queryParams.pageSize;
      const result = filterSubmissionsForUser({
        userId,
        subject: queryParams.subject,
        grade: queryParams.grade,
        stream: queryParams.stream,
        minMarks: queryParams.minMarks,
        maxMarks: queryParams.maxMarks,
        from: queryParams.from,
        to: queryParams.to,
        offset,
        limit: queryParams.pageSize
      });
      
      const response = {
        ok: true,
        data: result.rows,
        total: result.total,
        page: queryParams.page,
        pageSize: queryParams.pageSize
      };
      
      await cacheSet(cacheKey, response);
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async retry(req, res, next) {
    try {
      const { quizId } = req.params;
      const { responses } = req.body;
      const { userId } = req.user;
      
      const result = await retryQuiz({ 
        userId, 
        quizId, 
        answers: responses 
      });
      
      const response = {
        ok: true,
        score: result.score,
        submissionId: result.submission.id
      };
      
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async hint(req, res, next) {
    try {
      const { quizId } = req.params;
      const { questionId } = req.body;
      const { userId } = req.user;
      
      const result = await getHint({ 
        userId, 
        quizId, 
        questionId 
      });
      
      const response = {
        ok: true,
        hint: result.hint
      };
      
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendResultEmail(req, res, next) {
    try {
      const { quizId } = req.params;
      const { userId } = req.user;
      const to = (req.body?.to || '').trim();
      
      const result = await sendSubmissionEmail({ 
        userId, 
        quizId, 
        to 
      });
      
      const response = {
        ok: true,
        sent: result.ok,
        skipped: result.skipped,
        messageId: result.messageId
      };
      
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}

const quizController = new QuizController();

export const generate = (req, res, next) => quizController.generate(req, res, next);
export const submit = (req, res, next) => quizController.submit(req, res, next);
export const history = (req, res, next) => quizController.history(req, res, next);
export const retry = (req, res, next) => quizController.retry(req, res, next);
export const hint = (req, res, next) => quizController.hint(req, res, next);
export const sendResultEmail = (req, res, next) => quizController.sendResultEmail(req, res, next);

export default { generate, submit, history, retry, hint, sendResultEmail };


