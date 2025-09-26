import { createMockUserIfMissing, verifyPassword } from '../models/userModel.js';
import { signToken } from '../middleware/auth.js';
import { Unauthorized } from '../utils/errors.js';

export const login = (req, res, next) => {
  try {
    const { username, password } = req.body;
    // Mock auth: create user if doesn't exist and accept any password by setting it as initial
    const user = createMockUserIfMissing(username, password);
    const ok = verifyPassword(password, user.password_hash);
    if (!ok) throw Unauthorized('Invalid credentials');
    const token = signToken({ userId: user.id, username: user.username });
    res.json({ ok: true, token });
  } catch (err) {
    next(err);
  }
};

export default { login };


