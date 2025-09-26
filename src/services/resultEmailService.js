import { getQuizById } from '../models/quizModel.js';
import { listSubmissionsForQuiz } from '../models/submissionModel.js';
import { sendEmail } from './emailService.js';
import db from '../models/db.js';
import { NotFound } from '../utils/errors.js';

function isEmailLike(str) {
  return /.+@.+\..+/.test(str || '');
}

export async function sendSubmissionEmail({ userId, quizId, to }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const subs = listSubmissionsForQuiz(quizId);
  const latest = subs[0];
  if (!latest) throw new NotFound('No submission found');
  let recipient = (to || '').trim();
  if (!recipient) {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    const candidate = user?.username || '';
    recipient = isEmailLike(candidate) ? candidate : '';
  }
  if (!recipient) return { ok: false, skipped: true };
  const subject = `Quiz result receipt: ${quiz.subject} (Grade ${quiz.grade})`;
  const text = `Thank you for completing your quiz.\nScore: ${latest.score}%\nSubmission ID: ${latest.id}`;
  const html = `<p>Thank you for completing your quiz.</p><p><strong>Score:</strong> ${latest.score}%</p><p><strong>Submission ID:</strong> ${latest.id}</p>`;
  return await sendEmail({ to: recipient, subject, text, html });
}

export default { sendSubmissionEmail }; 