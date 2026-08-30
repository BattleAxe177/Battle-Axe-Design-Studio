import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { injectReleaseVersion } from '../scripts/release-version.mjs';

const VERSION=(await readFile(new URL('../VERSION', import.meta.url),'utf8')).trim().match(/^\d+\.\d+\.\d+\.\d+/)?.[0];

test('runtime release exposes an uncached versioned main module in the deployed build', async () => {
  const sourceHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const html=injectReleaseVersion(sourceHtml,VERSION);
  assert.ok(VERSION);
  assert.match(html, new RegExp(`main\\.js\\?v=${VERSION.replaceAll('.','\\.')}`));
  assert.match(html, new RegExp(`id="runtimeVersion">v${VERSION.replaceAll('.','\\.')}`));
  assert.match(html, /Scenario Workspace/);
  assert.match(html, /runtimeError/);
});

test('build derives deployed release markers from VERSION instead of requiring hand-edited index version strings', async()=>{
  const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(build,/release-version\.mjs/);
  assert.match(build,/injectReleaseVersion/);
  assert.match(build,/path\.join\(root,'VERSION'\)/);
  assert.match(build,/path\.join\(root,'scenarios'\)/);
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
