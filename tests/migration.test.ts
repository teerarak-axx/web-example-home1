import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import { hashPassword } from '../lib/password';

test('legacy database upgrades once, with a consistent backup and preserved credentials', () => {
  const storage = mkdtempSync(path.join(tmpdir(), 'baanpoo-migration-'));
  mkdirSync(path.join(storage, 'db'));
  const file = path.join(storage, 'db/site.sqlite'),
    passwordHash = hashPassword('legacy-test-password');
  const old = new Database(file);
  old.exec(
    'CREATE TABLE site_settings(id INTEGER PRIMARY KEY,company_name_en TEXT,admin_password_hash TEXT)',
  );
  old.prepare('INSERT INTO site_settings VALUES(1,?,?)').run('NAYTURE PRIME DESIGN', passwordHash);
  old.close();
  const entry = pathToFileURL(path.join(process.cwd(), 'lib/db.ts')).href;
  const script = `import {db,getSettings} from ${JSON.stringify(entry)};const settings=getSettings();console.log(JSON.stringify({brand:settings.company_name_en,logo:settings.logo_image_url}));db().close();`;
  const run = () =>
    JSON.parse(
      execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'development', STORAGE_DIR: storage },
        encoding: 'utf8',
      }),
    );
  try {
    assert.equal(run().brand, 'BAAN POO GARDEN');
    const backups = readdirSync(path.join(storage, 'backups'));
    assert.equal(backups.length, 1);
    const snapshot = new Database(path.join(storage, 'backups', backups[0]), { readonly: true });
    assert.equal(
      (
        snapshot.prepare('SELECT company_name_en FROM site_settings').get() as {
          company_name_en: string;
        }
      ).company_name_en,
      'NAYTURE PRIME DESIGN',
    );
    assert.equal(snapshot.pragma('integrity_check', { simple: true }), 'ok');
    snapshot.close();
    const current = new Database(file);
    assert.equal(
      (
        current.prepare('SELECT admin_password_hash FROM site_settings').get() as {
          admin_password_hash: string;
        }
      ).admin_password_hash,
      passwordHash,
    );
    current.prepare('UPDATE site_settings SET company_name_en=?').run('CLIENT EDIT PRESERVED');
    current.close();
    assert.equal(run().brand, 'CLIENT EDIT PRESERVED');
    assert.equal(
      readdirSync(path.join(storage, 'backups')).filter((name) => name.endsWith('.sqlite')).length,
      1,
    );
  } finally {
    rmSync(storage, { recursive: true, force: true });
  }
});
