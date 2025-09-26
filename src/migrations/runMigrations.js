import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../models/db.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('migrations');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname);

const appliedTable = `migrations_applied`;

db.exec(`CREATE TABLE IF NOT EXISTS ${appliedTable} (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')));`);

const getApplied = db.prepare(`SELECT name FROM ${appliedTable}`).all().map((r) => r.name);

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => /^\d+_.*\.sql$/.test(f))
  .sort();

for (const file of files) {
  if (getApplied.includes(file)) {
    log.info('Skipping already applied', file);
    continue;
  }
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  log.info('Applying migration', file);
  db.exec('BEGIN');
  try {
    db.exec(sql);
    db.prepare(`INSERT INTO ${appliedTable} (name) VALUES (?)`).run(file);
    db.exec('COMMIT');
    log.info('Applied', file);
  } catch (err) {
    db.exec('ROLLBACK');
    log.error('Migration failed', file, err.message);
    process.exitCode = 1;
    break;
  }
}


