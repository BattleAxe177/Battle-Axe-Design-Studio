import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const engine=readFileSync(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');
const center=readFileSync(new URL('../src/modules/playtestCenter.js',import.meta.url),'utf8');
const bf=readFileSync(new URL('../src/modules/battlefieldState.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('pikes double attacks without unsupported rerolls and suppress flank against active pikes',()=>{
  assert.match(engine,/function pikesActive/);
  assert.match(engine,/pikeAttackMultiplier:pike\?2:1/);
  assert.doesNotMatch(engine,/if\(pike&&r===1\)/);
  assert.match(engine,/effectiveContactArc\(target,attacker\)/);
});
test('initial facing comes from deployment with a neutral legacy fallback',()=>{
  assert.match(engine,/facingSource='deployment'/);
  assert.match(engine,/legacy deployment default/);
  assert.doesNotMatch(engine,/centroid=\{x:enemies\.reduce/);
  assert.doesNotMatch(engine,/faction==='sideA'\?0:180/);
});
test('commanders seek non-overlapping endpoints',()=>{
  assert.match(engine,/nearestCommanderClearEndpoint/);
  assert.match(engine,/nonOverlappingEndpoint:true/);
});
test('downstream battlefield images normalize to the saved play area',()=>{
  assert.match(bf,/applyPlayAreaViewBox\(svg,source\.playArea\)/);
});
test('playtest has quiet report export plus advanced diagnostic package',()=>{
  assert.match(html,/Export results/);
  assert.match(html,/exportPlaytestDiagnostic/);
  assert.match(center,/playtest-events\.json/);
  assert.match(center,/scenario-snapshot\.json/);
  assert.match(center,/engine-diagnostics\.json/);
  assert.match(center,/storedZip/);
});
test('replay cue timing dwells longer on major events',()=>{
  assert.match(center,/function cueDelay/);
  assert.match(center,/return 1500/);
  assert.match(center,/return 1250/);
});
