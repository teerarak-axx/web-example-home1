import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const storage = path.resolve(process.env.STORAGE_DIR || 'storage');
const destination = process.argv[2];
if (!destination) throw new Error('Usage: node scripts/backup.mjs /absolute/backup-directory');
const target = path.resolve(destination);
if (target === storage || target.startsWith(storage + path.sep))
  throw new Error('Choose a backup directory OUTSIDE storage');
fs.mkdirSync(target, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const database = new Database(path.join(storage, 'db/site.sqlite'), { readonly: true });
try {
  await database.backup(path.join(target, `site-${stamp}.sqlite`));
} finally {
  database.close();
}
execFileSync('tar', [
  '-czf',
  path.join(target, `uploads-${stamp}.tar.gz`),
  '-C',
  storage,
  'uploads',
]);
console.log('Backup created in', target);
console.log('Pause CMS writes during backup so database and uploads form the same snapshot.');
