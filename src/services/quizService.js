import { insertQuiz, getQuizById } from '../models/quizModel.js';
import { insertSubmission } from '../models/submissionModel.js';
import { upsertPerformance, getPerformance } from '../models/performanceModel.js';
import { generateQuestions, evaluateAnswers, generateHint } from './aiService.js';
import { NotFound } from '../utils/errors.js';
import { sendEmail } from './emailService.js';

export async function generateQuizForUser({ userId, subject, grade, totalQuestions, difficulty, stream }) {
  const perf = getPerformance({ userId, subject, grade });
  const userProfile = perf
    ? { bucket: perf.rolling_accuracy >= 75 ? 'high' : perf.rolling_accuracy <= 40 ? 'low' : 'mid' }
    : { bucket: 'new' };
  const { questions, difficultyProfile } = await generateQuestions({ userProfile, subject, grade, count: totalQuestions, difficulty, stream });
  const quiz = insertQuiz({ userId, subject, grade, questions, difficultyProfile, stream });
  return { quiz: { ...quiz, questions }, difficultyProfile };
}

export async function submitAnswers({ userId, quizId, answers }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const evaluation = await evaluateAnswers({ questions, responses: answers });
  const score = evaluation.score;
  const submission = insertSubmission({ quizId, userId, answers, evaluation, score });
  // update rolling performance
  upsertPerformance({ userId, subject: quiz.subject, grade: quiz.grade, score });
  // fire-and-forget email (if configured)
  try {
    const subject = `Quiz result receipt: ${quiz.subject} (Grade ${quiz.grade})`;
    const text = `Thank you for completing your quiz.\nScore: ${score}%\nSubmission ID: ${submission.id}`;
    const html = `<p>Thank you for completing your quiz.</p><p><strong>Score:</strong> ${score}%</p><p><strong>Submission ID:</strong> ${submission.id}</p>`;
    await sendEmail({ to: `${userId}@example.local`, subject, text, html });
  } catch {}
  return { submission, score, suggestions: evaluation.suggestions };
}

export async function retryQuiz({ userId, quizId, answers }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const evaluation = await evaluateAnswers({ questions, responses: answers });
  const score = evaluation.score;
  const submission = insertSubmission({ quizId, userId, answers, evaluation, score });
  upsertPerformance({ userId, subject: quiz.subject, grade: quiz.grade, score });
  return { submission, score };
}

export async function getHint({ userId, quizId, questionId }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const question = questions.find((q) => q.id === questionId);
  if (!question) throw new NotFound('Question not found');
  const hint = await generateHint({ question, context: { subject: quiz.subject, grade: quiz.grade } });
  return { hint };
}

export default { generateQuizForUser, submitAnswers, retryQuiz, getHint };


