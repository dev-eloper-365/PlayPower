import { randomUUID } from 'crypto';
import db from './db.js';

export const upsertPerformance = ({ userId, subject, grade, score }) => {
  const existing = db
    .prepare('SELECT * FROM user_performance WHERE user_id = ? AND subject = ? AND grade = ?')
    .get(userId, subject, grade);
  if (!existing) {
    const id = randomUUID();
    db.prepare(
      'INSERT INTO user_performance (id, user_id, subject, grade, rolling_accuracy, attempts) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, subject, grade, score, 1);
  } else {
    const newAttempts = existing.attempts + 1;
    const newAcc = (existing.rolling_accuracy * existing.attempts + score) / newAttempts;
    db.prepare(
      "UPDATE user_performance SET rolling_accuracy = ?, attempts = ?, last_updated = datetime('now') WHERE id = ?"
    ).run(newAcc, newAttempts, existing.id);
  }
};

export const getPerformance = ({ userId, subject, grade }) =>
  db.prepare('SELECT * FROM user_performance WHERE user_id = ? AND subject = ? AND grade = ?').get(userId, subject, grade);

export default { upsertPerformance, getPerformance };


