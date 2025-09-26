import { insertQuiz, getQuizById } from '../models/quizModel.js';
import { insertSubmission } from '../models/submissionModel.js';
import { upsertPerformance, getPerformance } from '../models/performanceModel.js';
import { generateQuestions, evaluateAnswers, generateHint } from './aiService.js';
import { NotFound } from '../utils/errors.js';

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
  if (!quiz || quiz.user_id !== userId) throw NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const evaluation = await evaluateAnswers({ questions, responses: answers });
  const saved = insertSubmission({ quizId, userId, answers, evaluation: evaluation.details, score: evaluation.score });
  await upsertPerformance({ userId, subject: quiz.subject, grade: quiz.grade, score: evaluation.score });
  return { submission: saved, score: evaluation.score, suggestions: evaluation.suggestions };
}

export async function retryQuiz({ userId, quizId, answers }) {
  // simple alias: a retry is just another submission
  return submitAnswers({ userId, quizId, answers });
}

export async function getHint({ userId, quizId, questionId }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const question = questions.find((q) => q.id === questionId);
  if (!question) throw NotFound('Question not found');
  const hint = await generateHint({ question, context: { subject: quiz.subject, grade: quiz.grade } });
  return { hint };
}

export default { generateQuizForUser, submitAnswers, retryQuiz, getHint };


