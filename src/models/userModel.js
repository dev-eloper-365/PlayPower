import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import db from './db.js';

export const findByUsername = (username) => {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
};

export const createMockUserIfMissing = (username, plaintextPassword) => {
  let user = findByUsername(username);
  if (user) return user;
  const id = randomUUID();
  const password_hash = bcrypt.hashSync(plaintextPassword, 8);
  db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(id, username, password_hash);
  user = findByUsername(username);
  return user;
};

export const verifyPassword = (password, password_hash) => bcrypt.compareSync(password, password_hash);

export default { findByUsername, createMockUserIfMissing, verifyPassword };


