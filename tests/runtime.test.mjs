import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const VERSION='0.4.0-alpha.9';

test('runtime release exposes uncached versioned main module', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, new RegExp(`main\\.js\\?v=${VERSION.replaceAll('.','\\.')}`));
  assert.match(html, /Scenario Builder/);
  assert.match(html, /runtimeError/);
});

test('runtime release disables stale service worker caching during alpha stabilization', async () => {
  const sw = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(sw, /registration\.unregister/);
  assert.doesNotMatch(sw, /cache\.addAll/);
});

test('main uses base-aware map URL and visible startup completion', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /new URL\(`/);
  assert.match(main, /__BAX_STARTUP_COMPLETE__/);
  assert.match(main, /setupScenarioBuilder/);
  assert.match(main, /setupDeploymentEditor/);
});

test('SVG loader supports namespace-prefixed PowerPoint SVG roots', async () => {
  const loader = await readFile(new URL('../src/modules/mapView.js', import.meta.url), 'utf8');
  assert.match(loader, /parseFromString\(text, 'image\/svg\+xml'\)/);
  assert.match(loader, /root\.localName !== 'svg'/);
  assert.match(loader, /root\.namespaceURI !== SVG_NS/);
  assert.match(loader, /document\.importNode\(parsedRoot, true\)/);
  assert.doesNotMatch(loader, /host\.innerHTML=text/);
});
