import { getLeaderboard } from '../services/leaderboardService.js';

export const list = (req, res, next) => {
  try {
    const grade = req.query.grade ? Number(req.query.grade) : null;
    const subject = req.query.subject || null;
    const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 10;
    const rows = getLeaderboard({ grade, subject, limit });
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export default { list }; 