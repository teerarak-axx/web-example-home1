import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../lib/seed';
import { editableSettingKeys, isImage } from '../lib/cms';
import { imageSettingKeys } from '../lib/content';
import fs from 'node:fs';
import path from 'node:path';

test('every public setting has an admin editor, including all site image slots', () => {
  assert.deepEqual([...editableSettingKeys].sort(), Object.keys(defaults).sort());
  assert.deepEqual(Object.keys(defaults).filter(isImage).sort(), [...imageSettingKeys].sort());
  for (const key of imageSettingKeys) {
    assert.ok(defaults[key]);
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', defaults[key])));
  }
  assert.equal(defaults.phone_primary, '086-571-0005');
  assert.equal(defaults.phone_secondary, '086-329-3277');
  assert.equal(defaults.facebook_url, 'https://www.facebook.com/baanpoogarden/');
  assert.ok(!JSON.stringify(defaults).includes('nayture'));
});
