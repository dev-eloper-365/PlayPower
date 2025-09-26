import db from '../models/db.js';

export function getLeaderboard({ grade, subject, limit = 10 }) {
  const rows = db.prepare(`
    SELECT u.username, s.score, s.created_at, q.subject, q.grade
    FROM submissions s
    JOIN users u ON u.id = s.user_id
    JOIN quizzes q ON q.id = s.quiz_id
    WHERE (? IS NULL OR q.grade = ?)
      AND (? IS NULL OR q.subject = ?)
    ORDER BY s.score DESC, s.created_at ASC
    LIMIT ?
  `).all(grade ?? null, grade ?? null, subject ?? null, subject ?? null, limit);
  return rows;
}

export default { getLeaderboard }; 