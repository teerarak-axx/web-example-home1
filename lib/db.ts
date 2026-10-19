import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { defaults, seed, seedBusinessContent } from './seed';
import type { Settings, SiteData, ProjectImage } from './types';
export const storageRoot = path.resolve(
  /* turbopackIgnore: true */ process.env.STORAGE_DIR || path.join(process.cwd(), 'storage'),
);
let connection: Database.Database | undefined;
export function db() {
  if (connection) return connection;
  fs.mkdirSync(path.join(storageRoot, 'db'), { recursive: true });
  fs.mkdirSync(path.join(storageRoot, 'uploads'), { recursive: true });
  const d = new Database(path.join(storageRoot, 'db', 'site.sqlite'));
  d.pragma('journal_mode = WAL');
  d.pragma('synchronous = NORMAL');
  d.pragma('foreign_keys = ON');
  d.pragma('busy_timeout = 5000');
  d.exec(`CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY CHECK(id=1),${Object.keys(
    defaults,
  )
    .map((k) => `${k} TEXT NOT NULL DEFAULT ''`)
    .join(',')},admin_password_hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS hero_slides(id INTEGER PRIMARY KEY AUTOINCREMENT,image_url TEXT NOT NULL DEFAULT '',title TEXT NOT NULL DEFAULT '',subtitle TEXT NOT NULL DEFAULT '',alt_text TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,is_active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY AUTOINCREMENT,title_th TEXT NOT NULL DEFAULT '',title_en TEXT NOT NULL DEFAULT '',description_th TEXT NOT NULL DEFAULT '',full_content_th TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',alt_text TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT 'landscape-construction' CHECK(category IN ('landscape-construction','home-extension','3d-design','maintenance')),description TEXT NOT NULL DEFAULT '',location TEXT NOT NULL DEFAULT '',cover_thumb_url TEXT NOT NULL DEFAULT '',cover_full_url TEXT NOT NULL DEFAULT '',is_featured_on_home INTEGER NOT NULL DEFAULT 1,sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS project_images(id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,thumb_url TEXT NOT NULL,full_url TEXT NOT NULL,alt_text TEXT NOT NULL DEFAULT '',caption TEXT NOT NULL DEFAULT '',width INTEGER NOT NULL,height INTEGER NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS project_images_album ON project_images(project_id,sort_order,id);
 CREATE TABLE IF NOT EXISTS team_members(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL DEFAULT '',role TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',alt_text TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS login_attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS media_assets(full_url TEXT PRIMARY KEY,thumb_url TEXT NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS file_deletions(url TEXT PRIMARY KEY,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  try {
    const prior = d.prepare('SELECT * FROM site_settings WHERE id=1').get() as
      Record<string, string> | undefined;
    const migrationKey = '2026-10-baanpoo-editable-content-v2';
    d.exec(
      'CREATE TABLE IF NOT EXISTS app_migrations(key TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
    );
    const needsMigration = !d
      .prepare('SELECT key FROM app_migrations WHERE key=?')
      .get(migrationKey);
    if (prior && needsMigration) {
      const dir = path.join(storageRoot, 'backups');
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      fs.writeFileSync(path.join(dir, 'before-baanpoo-' + Date.now() + '.sqlite'), d.serialize(), {
        mode: 0o600,
      });
    }
    d.transaction(() => {
      const columns = new Set(
        (d.prepare('PRAGMA table_info(site_settings)').all() as { name: string }[]).map(
          (c) => c.name,
        ),
      );
      for (const [key, value] of Object.entries(defaults))
        if (!columns.has(key))
          d.exec(
            `ALTER TABLE site_settings ADD COLUMN ${key} TEXT NOT NULL DEFAULT '${value.replace(/'/g, "''")}'`,
          );
    }).immediate();
    seed(d);
    if (needsMigration)
      d.transaction(() => {
        if (prior?.company_name_en === 'NAYTURE PRIME DESIGN') {
          const { canonical_url, ...newSettings } = defaults;
          void canonical_url;
          d.prepare(
            `UPDATE site_settings SET ${Object.keys(newSettings)
              .map((k) => k + '=?')
              .join(',')} WHERE id=1`,
          ).run(...Object.values(newSettings));
          d.prepare(
            "DELETE FROM hero_slides WHERE alt_text='ภาพตัวอย่างบ้านและสวนจาก Unsplash'",
          ).run();
          d.prepare(
            "DELETE FROM services WHERE image_url LIKE 'https://images.unsplash.com/%'",
          ).run();
          d.prepare(
            "DELETE FROM projects WHERE location='CONCEPT COLLECTION' AND description LIKE '%อัลบั้มแนวคิดตัวอย่าง%'",
          ).run();
          d.prepare(
            "DELETE FROM team_members WHERE alt_text LIKE '%ภาพบรรยากาศตัวอย่างจาก Unsplash%'",
          ).run();
          seedBusinessContent(d);
        }
        d.prepare('INSERT INTO app_migrations(key) VALUES (?)').run(migrationKey);
      }).immediate();
  } catch (error) {
    d.close();
    throw error;
  }
  connection = d;
  return d;
}
export function getSettings(): Settings {
  const row = db().prepare('SELECT * FROM site_settings WHERE id=1').get() as Settings;
  const { admin_password_hash, id, ...settings } = row;
  void admin_password_hash;
  void id;
  return settings;
}
export function getSiteData(): SiteData {
  return {
    settings: getSettings(),
    hero_slides: db()
      .prepare('SELECT * FROM hero_slides WHERE is_active=1 ORDER BY sort_order,id')
      .all(),
    services: db().prepare('SELECT * FROM services ORDER BY sort_order,id').all(),
    projects: db()
      .prepare(
        'SELECT p.*, (SELECT COUNT(*) FROM project_images i WHERE i.project_id=p.id) AS image_count FROM projects p ORDER BY is_featured_on_home DESC,sort_order,id',
      )
      .all(),
    team_members: db().prepare('SELECT * FROM team_members ORDER BY sort_order,id').all(),
  } as SiteData;
}
export function albumImages(id: number) {
  return db()
    .prepare('SELECT * FROM project_images WHERE project_id=? ORDER BY sort_order,id')
    .all(id) as ProjectImage[];
}
