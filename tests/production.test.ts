import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm, stat, access, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
import Database from 'better-sqlite3';
import sharp from 'sharp';

// Always use isolated storage: this suite never reads or mutates the client's data.
test('production CMS, storage, authentication and persistence', { timeout: 120000 }, async (t) => {
  const storage = await mkdtemp(path.join(tmpdir(), 'nayture-integration-'));
  const reservation = net.createServer();
  await new Promise<void>((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = (reservation.address() as net.AddressInfo).port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const base = `http://127.0.0.1:${port}`;
  const password = randomBytes(24).toString('hex');
  let child: ChildProcess | undefined;
  let logs = '';
  let cookie = '';
  async function start() {
    child = spawn(
      process.execPath,
      [
        'node_modules/next/dist/bin/next',
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          STORAGE_DIR: storage,
          ADMIN_INITIAL_PASSWORD: password,
          SITE_URL: base,
          COOKIE_SECURE: 'false',
          TRUST_PROXY: 'false',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    child.stdout?.on('data', (b) => {
      logs += b.toString();
    });
    child.stderr?.on('data', (b) => {
      logs += b.toString();
    });
    for (let i = 0; i < 120; i++) {
      try {
        if ((await fetch(base + '/api/health')).ok) return;
      } catch {
        /* server starting */
      }
      if (child.exitCode !== null) throw new Error(logs);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error('Server did not become healthy: ' + logs);
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const current = child;
    const exited = new Promise<void>((resolve) => current.once('exit', () => resolve()));
    current.kill('SIGTERM');
    await exited;
  }
  async function request(
    url: string,
    method = 'GET',
    body?: unknown,
    extra: Record<string, string> = {},
  ) {
    return fetch(base + url, {
      method,
      headers: {
        cookie,
        ...(method !== 'GET' ? { Origin: base } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...extra,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  async function json(url: string, method = 'GET', body?: unknown) {
    const r = await request(url, method, body);
    const result = await r.json();
    assert.ok(r.ok, `${method} ${url}: ${r.status} ${JSON.stringify(result)}`);
    return result;
  }
  async function login(pass = password) {
    const r = await request('/api/auth', 'POST', { password: pass });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie') || '', /HttpOnly/i);
    assert.match(r.headers.get('set-cookie') || '', /SameSite=strict/i);
    cookie = r.headers.get('set-cookie')!.split(';')[0];
  }
  const mediaFile = (url: string) => path.join(storage, 'uploads', url.replace('/api/media/', ''));
  let projectId = 0;
  let uploaded: { thumb_url: string; full_url: string; width: number; height: number }[] = [];
  try {
    await start();
    await t.test('SSR, SEO, seed and unauthorized access', async () => {
      assert.equal((await request('/api/admin/settings')).status, 401);
      assert.equal((await request('/api/admin/backup')).status, 401);
      const html = await (await request('/')).text();
      assert.match(html, /BAAN POO GARDEN/);
      assert.match(html, /application\/ld\+json/);
      assert.doesNotMatch(html, /admin_password_hash/);
      assert.ok((await request('/sitemap.xml')).ok);
      assert.match(await (await request('/robots.txt')).text(), /Disallow: \/admin/);
      assert.equal((await request('/api/auth', 'POST', { password: 'wrong' })).status, 401);
      await login();
      const noOrigin = await fetch(base + '/api/admin/settings', {
        method: 'PATCH',
        headers: { cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_title: 'No origin' }),
      });
      assert.equal(noOrigin.status, 403);
      const settings = await json('/api/admin/settings');
      assert.equal(settings.admin_password_hash, undefined);
      assert.ok(settings.company_name_en);
      const d = new Database(path.join(storage, 'db/site.sqlite'), { readonly: true });
      assert.equal(d.pragma('journal_mode', { simple: true }), 'wal');
      assert.equal(d.pragma('integrity_check', { simple: true }), 'ok');
      d.close();
    });
    await t.test('CSRF, URL and schema validation', async () => {
      assert.equal(
        (
          await request(
            '/api/admin/settings',
            'PATCH',
            { meta_title: 'bad' },
            { Origin: 'https://attacker.invalid' },
          )
        ).status,
        403,
      );
      assert.equal(
        (await request('/api/admin/settings', 'PATCH', { line_url: 'javascript:alert(1)' })).status,
        400,
      );
      assert.equal(
        (await request('/api/admin/projects', 'POST', { title: 'Bad', category: 'invalid' }))
          .status,
        400,
      );
      assert.equal((await request('/api/projects/-1')).status, 404);
      assert.equal((await request('/api/admin/settings', 'PATCH', ['invalid'])).status, 400);
      assert.equal((await request('/api/media/projects/not-an-image.webp')).status, 404);
      assert.equal((await request('/api/media/projects/%2e%2e%2fdb%2fsite.sqlite')).status, 404);
    });
    await t.test('all editable collections and immediately updated metadata', async () => {
      await json('/api/admin/settings', 'PATCH', {
        meta_title: 'Integration SEO title',
        welcome_body: 'เนื้อหาทดสอบ',
        canonical_url: base,
      });
      assert.match(await (await request('/')).text(), /<title>Integration SEO title<\/title>/);
      for (const [entity, data] of [
        ['services', { title_th: 'บริการทดสอบ', title_en: 'TEST', description_th: 'รายละเอียด' }],
        ['hero_slides', { title: 'Test slide', is_active: 1 }],
        ['team_members', { name: 'Test team', role: 'Architecture' }],
      ] as const) {
        const row = await json('/api/admin/' + entity, 'POST', data);
        await json('/api/admin/' + entity, 'PATCH', { id: row.id, sort_order: 99 });
        assert.ok(
          (await json('/api/admin/' + entity)).some((i: { id: number }) => i.id === row.id),
        );
        await json('/api/admin/' + entity + '?id=' + row.id, 'DELETE');
      }
      projectId = (
        await json('/api/admin/projects', 'POST', {
          title: 'Upload test album',
          category: 'home-extension',
          description: 'test',
          is_featured_on_home: 1,
        })
      ).id;
    });
    await t.test(
      'chunked upload creates two WebP variants and streams them without restart',
      async () => {
        const png = await sharp({
          create: { width: 2200, height: 1600, channels: 3, background: '#375430' },
        })
          .png()
          .toBuffer();
        for (let start = 0; start < 10; start += 3) {
          const form = new FormData();
          form.append('bucket', 'projects');
          form.append('project_id', String(projectId));
          for (let i = start; i < Math.min(start + 3, 10); i++)
            form.append(
              'files',
              new Blob([new Uint8Array(png)], { type: 'image/png' }),
              `garden-${i}.png`,
            );
          const response = await fetch(base + '/api/upload', {
            method: 'POST',
            headers: { cookie, Origin: base },
            body: form,
          });
          assert.equal(response.status, 201, await response.clone().text());
          uploaded.push(...(await response.json()).images);
        }
        assert.equal(uploaded.length, 10);
        const album = await json('/api/projects/' + projectId);
        assert.equal(album.images.length, 10);
        assert.equal(album.project.cover_thumb_url, uploaded[0].thumb_url);
        for (const key of ['thumb_url', 'full_url'] as const) {
          const response = await request(uploaded[0][key]);
          assert.equal(response.status, 200);
          assert.match(response.headers.get('cache-control')!, /immutable/);
          assert.equal(response.headers.get('content-type'), 'image/webp');
          const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
          assert.equal(metadata.format, 'webp');
          assert.equal(metadata.width, key === 'thumb_url' ? 640 : 1920);
          const conditional = await request(uploaded[0][key], 'GET', undefined, {
            'If-None-Match': response.headers.get('etag')!,
          });
          assert.equal(conditional.status, 304);
        }
        assert.equal(uploaded[0].width, 1920);
        assert.ok(uploaded[0].height > 0);
        const form = new FormData();
        form.append('bucket', 'projects');
        form.append('project_id', String(projectId));
        for (let i = 0; i < 4; i++)
          form.append('files', new Blob([new Uint8Array(png)]), 'four.png');
        assert.equal(
          (
            await fetch(base + '/api/upload', {
              method: 'POST',
              headers: { cookie, Origin: base },
              body: form,
            })
          ).status,
          400,
        );
        const invalid = new FormData();
        invalid.append('bucket', 'projects');
        invalid.append('project_id', String(projectId));
        invalid.append('files', new Blob(['not an image']), 'fake.jpg');
        assert.equal(
          (
            await fetch(base + '/api/upload', {
              method: 'POST',
              headers: { cookie, Origin: base },
              body: invalid,
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      'all nine site image settings and editorial text can be edited and rendered',
      async () => {
        const original = await json('/api/admin/settings');
        // Save the entire CMS payload, including all bundled site-local image URLs.
        await json('/api/admin/settings', 'PATCH', original);
        const imageKeys = [
          'logo_image_url',
          'favicon_image_url',
          'welcome_image_url',
          'concept_image_url',
          'video_cover_url',
          'mission_cover_url',
          'philosophy_bw_image_url',
          'contact_image_url',
          'og_image_url',
        ];
        const changes = Object.fromEntries(imageKeys.map((key) => [key, uploaded[2].full_url]));
        Object.assign(changes, {
          nav_home: 'หน้าแรกที่แก้จาก CMS',
          mission_button_text: 'ปรึกษางานผ่าน CMS',
          service_read_more_text: 'อ่านบริการที่แก้แล้ว',
          category_landscape: 'หมวดสวนที่แก้แล้ว',
          show_team: '1',
        });
        await json('/api/admin/settings', 'PATCH', changes);
        const saved = await json('/api/admin/settings');
        for (const [key, value] of Object.entries(changes)) assert.equal(saved[key], value);
        const html = await (await request('/')).text();
        for (const copy of [
          'หน้าแรกที่แก้จาก CMS',
          'ปรึกษางานผ่าน CMS',
          'อ่านบริการที่แก้แล้ว',
          'หมวดสวนที่แก้แล้ว',
        ])
          assert.ok(html.includes(copy));
        assert.ok(html.includes(uploaded[2].full_url));
        assert.ok(html.includes('id="team"'));
        assert.equal(
          (await request('/api/admin/settings', 'PATCH', { show_team: '2' })).status,
          400,
        );
        await json('/api/admin/settings', 'PATCH', original);
        assert.ok(!(await (await request('/')).text()).includes('id="team"'));
      },
    );
    await t.test('caption, order, cover and consistent downloadable backup', async () => {
      const images = (await json('/api/projects/' + projectId)).images;
      const reordered = images.map((i: { id: number }) => i.id).reverse();
      await json('/api/admin/reorder', 'POST', { project_id: projectId, ids: reordered });
      assert.deepEqual(
        (await json('/api/projects/' + projectId)).images.map((i: { id: number }) => i.id),
        reordered,
      );
      assert.equal(
        (
          await request('/api/admin/reorder', 'POST', {
            project_id: projectId,
            ids: [images[0].id],
          })
        ).status,
        400,
      );
      await json('/api/admin/project_images', 'PATCH', {
        id: images[1].id,
        alt_text: 'สวนทดสอบ',
        caption: 'รายละเอียดรูป',
        sort_order: 100,
      });
      await json('/api/admin/projects', 'PATCH', { id: projectId, cover_image_id: images[1].id });
      assert.equal(
        (await json('/api/projects/' + projectId)).project.cover_thumb_url,
        images[1].thumb_url,
      );
      const response = await request('/api/admin/backup');
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.subarray(0, 15).toString(), 'SQLite format 3');
      const backupPath = path.join(storage, 'downloaded-backup.sqlite');
      await writeFile(backupPath, bytes);
      const backup = new Database(backupPath, { readonly: true });
      assert.equal(backup.pragma('integrity_check', { simple: true }), 'ok');
      assert.ok(backup.prepare('SELECT id FROM projects WHERE id=?').get(projectId));
      backup.close();
      const stats = await json('/api/admin/dashboard');
      assert.ok(stats.bytes > 0);
      assert.equal(stats.local_images, 10);
    });
    await t.test('database, sessions and dynamic media survive process restart', async () => {
      await stop();
      await start();
      assert.equal((await json('/api/admin/settings')).meta_title, 'Integration SEO title');
      assert.equal((await json('/api/projects/' + projectId)).images.length, 10);
      assert.equal((await request(uploaded[0].full_url)).status, 200);
    });
    await t.test(
      'deleting one image or album cleans both files; shared image remains until unreferenced',
      async () => {
        const album = await json('/api/projects/' + projectId);
        const first = album.images[0];
        await json('/api/admin/project_images?id=' + first.id, 'DELETE');
        await assert.rejects(access(mediaFile(first.thumb_url)));
        await assert.rejects(access(mediaFile(first.full_url)));
        const shared = album.images[2];
        await json('/api/admin/settings', 'PATCH', { welcome_image_url: shared.full_url });
        await json('/api/admin/projects?id=' + projectId, 'DELETE');
        await stat(mediaFile(shared.thumb_url));
        await stat(mediaFile(shared.full_url));
        for (const img of uploaded.filter(
          (i) => ![first.full_url, shared.full_url].includes(i.full_url),
        )) {
          await assert.rejects(access(mediaFile(img.thumb_url)));
          await assert.rejects(access(mediaFile(img.full_url)));
        }
        await json('/api/admin/settings', 'PATCH', { welcome_image_url: '' });
        await assert.rejects(access(mediaFile(shared.thumb_url)));
        await assert.rejects(access(mediaFile(shared.full_url)));
        assert.equal((await request('/api/projects/' + projectId)).status, 404);
        assert.equal((await json('/api/admin/cleanup', 'POST', {})).removed, 0);
      },
    );
    await t.test(
      'password change invalidates sessions; new password works; logout revokes token',
      async () => {
        const next = randomBytes(24).toString('hex');
        await json('/api/admin/password', 'POST', {
          current_password: password,
          new_password: next,
        });
        assert.equal((await request('/api/admin/settings')).status, 401);
        assert.equal((await request('/api/auth', 'POST', { password })).status, 401);
        await login(next);
        await json('/api/auth', 'DELETE');
        assert.equal((await request('/api/admin/settings')).status, 401);
        for (let i = 0; i < 10; i++)
          assert.equal((await request('/api/auth', 'POST', { password: 'wrong' })).status, 401);
        assert.equal((await request('/api/auth', 'POST', { password: 'wrong' })).status, 429);
      },
    );
  } finally {
    await stop();
    await rm(storage, { recursive: true, force: true });
  }
});
