import { randomUUID } from 'crypto';
import db from './db.js';

export const insertSubmission = ({ quizId, userId, answers, evaluation, score }) => {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO submissions (id, quiz_id, user_id, answers_json, evaluation_json, score) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, quizId, userId, JSON.stringify(answers), JSON.stringify(evaluation), score);
  return getSubmissionById(id);
};

export const getSubmissionById = (id) => db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);

export const listSubmissionsForQuiz = (quizId) =>
  db.prepare('SELECT * FROM submissions WHERE quiz_id = ? ORDER BY created_at DESC').all(quizId);

export const filterSubmissionsForUser = ({ userId, subject, grade, stream, minMarks, maxMarks, from, to, offset = 0, limit = 10 }) => {
  const where = ['s.user_id = ?'];
  const params = [userId];
  if (subject) {
    where.push('q.subject = ?');
    params.push(subject);
  }
  if (grade) {
    where.push('q.grade = ?');
    params.push(grade);
  }
  if (stream) {
    where.push('q.stream = ?');
    params.push(stream);
  }
  if (typeof minMarks === 'number') {
    where.push('s.score >= ?');
    params.push(minMarks);
  }
  if (typeof maxMarks === 'number') {
    where.push('s.score <= ?');
    params.push(maxMarks);
  }
  if (from) {
    where.push('s.created_at >= ?');
    params.push(from);
  }
  if (to) {
    where.push('s.created_at <= ?');
    params.push(to);
  }
  const rows = db
    .prepare(`
      SELECT 
        s.*, 
        q.subject, q.grade, q.stream
      FROM submissions s
      JOIN quizzes q ON q.id = s.quiz_id
      WHERE ${where.join(' AND ')}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset);
  const total = db
    .prepare(`
      SELECT COUNT(*) as cnt
      FROM submissions s
      JOIN quizzes q ON q.id = s.quiz_id
      WHERE ${where.join(' AND ')}
    `)
    .get(...params).cnt;
  return { rows, total };
};

export default { insertSubmission, getSubmissionById, listSubmissionsForQuiz, filterSubmissionsForUser };


