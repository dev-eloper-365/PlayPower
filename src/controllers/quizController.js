import { generateQuizForUser, submitAnswers, retryQuiz, getHint } from '../services/quizService.js';
import { filterSubmissionsForUser } from '../models/submissionModel.js';

export const generate = async (req, res, next) => {
  try {
    const { grade, Subject, TotalQuestions, MaxScore, Difficulty, Stream } = req.body;
    const { userId } = req.user;
    const result = await generateQuizForUser({ userId, subject: Subject, grade, totalQuestions: TotalQuestions, difficulty: Difficulty, stream: Stream });
    res.json({ ok: true, quiz: { id: result.quiz.id, Subject, grade, TotalQuestions, MaxScore, Difficulty, Stream, questions: JSON.parse(result.quiz.questions_json) }, difficulty: result.difficultyProfile });
  } catch (err) {
    next(err);
  }
};

export const submit = async (req, res, next) => {
  try {
    const { quizId, responses } = req.body;
    const { userId } = req.user;
    const result = await submitAnswers({ userId, quizId, answers: responses });
    res.json({ ok: true, score: result.score, suggestions: result.suggestions, submissionId: result.submission.id });
  } catch (err) {
    next(err);
  }
};

export const history = async (req, res, next) => {
  try {
    const { userId } = req.user;
    // use validated copy from middleware
    let { grade, subject, stream, minMarks, maxMarks, from, to, page = 1, pageSize = 10 } = req.queryValidated || {};
    // Normalize date inputs: accept Date objects, dd/mm/yyyy, or yyyy-mm-dd
    const normDate = (val) => {
      if (!val) return val;
      if (val instanceof Date) {
        return val.toISOString().slice(0, 10);
      }
      if (typeof val === 'string') {
        const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
          const [, dd, mm, yyyy] = m;
          return `${yyyy}-${mm}-${dd}`;
        }
        return val;
      }
      return val;
    };
    from = normDate(from);
    to = normDate(to);
    if (typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to)) to = `${to} 23:59:59`;
    // coerce numeric values
    grade = grade != null ? Number(grade) : grade;
    minMarks = minMarks != null ? Number(minMarks) : minMarks;
    maxMarks = maxMarks != null ? Number(maxMarks) : maxMarks;
    page = Number(page);
    pageSize = Number(pageSize);
    const offset = (page - 1) * pageSize;
    const result = filterSubmissionsForUser({ userId, subject, grade, stream, minMarks, maxMarks, from, to, offset, limit: pageSize });
    res.json({ ok: true, data: result.rows, total: result.total, page, pageSize });
  } catch (err) {
    next(err);
  }
};

export const retry = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { responses } = req.body;
    const { userId } = req.user;
    const result = await retryQuiz({ userId, quizId, answers: responses });
    res.json({ ok: true, score: result.score, submissionId: result.submission.id });
  } catch (err) {
    next(err);
  }
};

export const hint = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { questionId } = req.body;
    const { userId } = req.user;
    const result = await getHint({ userId, quizId, questionId });
    res.json({ ok: true, hint: result.hint });
  } catch (err) {
    next(err);
  }
};

export default { generate, submit, history, retry, hint };


