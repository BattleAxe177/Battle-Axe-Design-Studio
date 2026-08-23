import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=async p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('v0590 Detailed replay exposes scenario-analysis overlays',async()=>{
  const html=await read('index.html'),center=await read('src/modules/playtestCenter.js'),css=await read('src/styles/app.css');
  assert.match(html,/playReplayAnalysis/);
  assert.match(html,/playAnalysisLegend/);
  assert.match(center,/analysis-defensive/);
  assert.match(center,/commandRange/);
  assert.match(center,/weaponRange/);
  assert.match(center,/move_blocked/);
  assert.match(css,/analysis-bubble\.command/);
});

test('v0590 movement searches alternate wheels and fallback movement modes',async()=>{
  const src=await read('src/modules/playtestEngine.js');
  assert.match(src,/legalWheelCandidates/);
  assert.match(src,/forward-no-wheel/);
  assert.match(src,/sideways-right/);
  assert.match(src,/sideways-left/);
  assert.match(src,/fallbackCandidate:true/);
});

test('v0590 defensive positioning supports nearby prepared terrain and explicit reserve reasons',async()=>{
  const src=await read('src/modules/playtestEngine.js');
  assert.match(src,/defensiveProximity/);
  assert.match(src,/fixedAdjacency=\.55/);
  assert.match(src,/moves toward nearby approved Defensive terrain/);
  assert.match(src,/explicit release condition has not been met/);
});

test('v0590 deployment drag uses cached transform, animation frame and live legality preview',async()=>{
  const src=await read('src/modules/deploymentEditor.js'),css=await read('src/styles/app.css');
  assert.match(src,/dragFrameRect=frame\.getBoundingClientRect/);
  assert.match(src,/requestAnimationFrame/);
  assert.match(src,/drag-valid/);
  assert.match(src,/drag-invalid/);
  assert.match(css,/will-change:left,top,transform/);
});
