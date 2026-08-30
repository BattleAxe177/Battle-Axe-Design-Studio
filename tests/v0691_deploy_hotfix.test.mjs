import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { injectReleaseVersion, normalizeReleaseVersion } from '../scripts/release-version.mjs';

const read=async p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('v0.6.9.1 build injects VERSION into runtime label, bootstrap messages and main cache key',async()=>{
  const version=normalizeReleaseVersion(await read('VERSION'));
  const source=await read('index.html');
  const built=injectReleaseVersion(source,version);
  assert.equal(version,'0.6.9.1');
  assert.match(built,/id="runtimeVersion">v0\.6\.9\.1<\/span>/);
  assert.match(built,/\.\/src\/main\.js\?v=0\.6\.9\.1/);
  assert.doesNotMatch(built,/Battle Axe v0\.6\.8\.1/);
});

test('v0.6.9.1 build deploys the Scenario Library catalog',async()=>{
  const build=await read('scripts/build.mjs');
  const check=await read('scripts/check.mjs');
  assert.match(build,/cp\(path\.join\(root,'scenarios'\), path\.join\(dist,'scenarios'\)/);
  assert.match(check,/dist\/scenarios\/index\.json/);
});

test('v0.6.9.1 release bootstrap is safe when imported outside a browser',async()=>{
  const release=await read('src/modules/release690.js');
  assert.match(release,/typeof window==='undefined'\|\|typeof document==='undefined'/);
  assert.match(release,/if\(typeof window!=='undefined'&&typeof document!=='undefined'\)setTimeout\(boot,0\)/);
});
