import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const storage = await fs.mkdtemp(path.join(tmpdir(), 'nayture-docker-test-'));
const socket = net.createServer();
await new Promise((r) => socket.listen(0, '127.0.0.1', r));
const port = socket.address().port;
await new Promise((r) => socket.close(r));
const name = 'nayture-smoke-' + randomBytes(5).toString('hex');
const base = 'http://127.0.0.1:' + port;
const password = randomBytes(24).toString('hex');
let cookie = '';
async function start() {
  docker(
    'run',
    '-d',
    '--name',
    name,
    '-p',
    `127.0.0.1:${port}:3000`,
    '--mount',
    `type=bind,src=${storage},dst=/app/storage`,
    '-e',
    'SITE_URL=' + base,
    '-e',
    'ADMIN_INITIAL_PASSWORD=' + password,
    '-e',
    'COOKIE_SECURE=false',
    '-e',
    'TRUST_PROXY=false',
    'nayture-web:local',
  );
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base + '/api/health')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(docker('logs', name));
}
async function api(url, method = 'GET', data) {
  const res = await fetch(base + url, {
    method,
    headers: {
      cookie,
      ...(method !== 'GET' ? { Origin: base } : {}),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  assert.ok(res.ok, await res.clone().text());
  return res;
}
try {
  await start();
  assert.equal(docker('exec', name, 'id', '-u'), '1000');
  console.log('PASS: production container runs as non-root UID 1000');
  const login = await api('/api/auth', 'POST', { password });
  cookie = login.headers.get('set-cookie').split(';')[0];
  await api('/api/admin/settings', 'PATCH', { meta_title: 'Docker persistent verification' });
  const project = await (
    await api('/api/admin/projects', 'POST', {
      title: 'Docker image processing',
      category: 'home-extension',
    })
  ).json();
  const png = await sharp({
    create: { width: 2200, height: 1500, channels: 3, background: '#31582a' },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append('files', new Blob([png], { type: 'image/png' }), 'docker-garden.png');
  form.append('bucket', 'projects');
  form.append('project_id', String(project.id));
  const upload = await fetch(base + '/api/upload', {
    method: 'POST',
    headers: { cookie, Origin: base },
    body: form,
  });
  assert.equal(upload.status, 201, await upload.clone().text());
  const image = (await upload.json()).images[0];
  for (const [url, width] of [
    [image.thumb_url, 640],
    [image.full_url, 1920],
  ]) {
    const res = await api(url);
    const metadata = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    assert.equal(metadata.width, width);
    assert.equal(metadata.format, 'webp');
  }
  console.log(
    'PASS: native SQLite + sharp work inside Docker; both image sizes served immediately',
  );
  docker('rm', '-f', name);
  await start();
  assert.match(await (await api('/')).text(), /Docker persistent verification/);
  assert.equal((await api(image.full_url)).status, 200);
  const projects = await (await api('/api/projects/' + project.id)).json();
  assert.equal(projects.images.length, 1);
  console.log('PASS: database and uploaded files persist after container recreation');
} catch (error) {
  try {
    console.error(docker('logs', name));
  } catch {}
  throw error;
} finally {
  try {
    docker('rm', '-f', name);
  } catch {}
  await fs.rm(storage, { recursive: true, force: true });
}
