import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('simulation runs in a Web Worker',async()=>{
  const center=await fs.readFile(new URL('../src/modules/playtestCenter.js',import.meta.url),'utf8');
  const worker=await fs.readFile(new URL('../src/modules/playtestWorker.js',import.meta.url),'utf8');
  assert.match(center,/new Worker/);
  assert.match(center,/await simulate\('single'/);
  assert.match(center,/await simulate\('batch'/);
  assert.match(worker,/runPlaytest/);
});
test('engine has simulation event safety guard',async()=>{
  const engine=await fs.readFile(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');
  assert.match(engine,/BAX_SIMULATION_GUARD/);
  assert.match(engine,/maxEvents/);
});
test('legal action enumeration is not repeated just to count actions',async()=>{
  const engine=await fs.readFile(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');
  assert.match(engine,/firstLegal=legalActionsForUnit/);
  assert.match(engine,/secondLegal=legalActionsForUnit/);
  assert.doesNotMatch(engine,/legalActionCount:legalActionsForUnit\(/);
});
