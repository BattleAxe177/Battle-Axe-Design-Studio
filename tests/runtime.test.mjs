import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('runtime release exposes uncached versioned main module', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /main\.js\?v=0\.3\.3\.3/);
  assert.match(html, /runtimeError/);
});

test('runtime release disables stale service worker caching', async () => {
  const sw = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(sw, /registration\.unregister/);
  assert.doesNotMatch(sw, /cache\.addAll/);
});

test('main uses base-aware map URL and visible startup completion', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /new URL\(`/);
  assert.match(main, /__BAX_STARTUP_COMPLETE__/);
});
