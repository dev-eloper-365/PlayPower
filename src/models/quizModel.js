import { randomUUID } from 'crypto';
import db from './db.js';

export const insertQuiz = ({ userId, subject, grade, questions, difficultyProfile, stream }) => {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO quizzes (id, user_id, subject, grade, questions_json, difficulty_profile_json, stream) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, userId, subject, grade, JSON.stringify(questions), JSON.stringify(difficultyProfile), stream || null);
  return getQuizById(id);
};

export const getQuizById = (id) => db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);

export const listQuizzesForUser = ({ userId, subject, grade, from, to, offset = 0, limit = 10 }) => {
  const where = ['user_id = ?'];
  const params = [userId];
  if (subject) {
    where.push('subject = ?');
    params.push(subject);
  }
  if (grade) {
    where.push('grade = ?');
    params.push(grade);
  }
  if (from) {
    where.push('created_at >= ?');
    params.push(from);
  }
  if (to) {
    where.push('created_at <= ?');
    params.push(to);
  }
  const rows = db
    .prepare(`SELECT * FROM quizzes WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const total = db
    .prepare(`SELECT COUNT(*) as cnt FROM quizzes WHERE ${where.join(' AND ')}`)
    .get(...params).cnt;
  return { rows, total };
};

export default { insertQuiz, getQuizById, listQuizzesForUser };


