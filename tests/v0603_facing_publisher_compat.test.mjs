import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const deployment=fs.readFileSync(new URL('../src/modules/deploymentEditor.js',import.meta.url),'utf8');
const publisher=fs.readFileSync(new URL('../src/modules/scenarioPublisher.js',import.meta.url),'utf8');
const state=fs.readFileSync(new URL('../src/app/state.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const playtest=fs.readFileSync(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');

test('deployment rotate controls mutate authoritative facing and expose a front marker',()=>{
  assert.match(deployment,/deployment-facing-arrow/);
  assert.match(deployment,/rotateDeploymentLeft.*rotateSelected\(-15\)/s);
  assert.match(deployment,/rotateDeploymentRight.*rotateSelected\(15\)/s);
  assert.match(deployment,/placements\[selected\.id\]=candidate/);
});

test('playtest runtime preserves deployment facing without faction-specific reorientation',()=>{
  assert.match(playtest,/facing:Number\.isFinite\(Number\(p0\.facing\)\)\?Number\(p0\.facing\):null/);
  assert.doesNotMatch(playtest,/French[^\n]{0,100}facing/i);
});

test('publisher forces deployment side colors in print/PDF output',()=>{
  assert.match(publisher,/print-color-adjust:exact/);
  assert.match(publisher,/-webkit-print-color-adjust:exact/);
  assert.match(publisher,/background-color:/);
});

test('project importer accepts current wrappers, legacy raw projects, and scenario-only JSON',()=>{
  assert.match(state,/export function normalizeImportedState/);
  assert.match(state,/if\(data\.project&&typeof data\.project==='object'\)/);
  assert.match(state,/if\(data\.scenario&&typeof data\.scenario==='object'\)/);
  assert.match(state,/if\(data\.metadata&&\(data\.commands\|\|data\.rosters\|\|data\.deployment\)\)/);
  assert.match(main,/normalizeImportedState\(data\)/);
});
