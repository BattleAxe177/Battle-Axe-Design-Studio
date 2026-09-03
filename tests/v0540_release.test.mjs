import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { footprintPercent, battlefieldAspect } from '../src/modules/battlefieldScale.js';
import { genericAppearanceComponents } from '../src/modules/battlefieldDetector.js';
import { describeAiChange } from '../src/modules/aiBridge.js';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');

test('physical square bases convert to axis percentages using battlefield dimensions',()=>{
  const f=footprintPercent(50,{width:72,height:48,units:'inches'});
  assert.ok(Math.abs(f.width-2.734033)<.001);
  assert.ok(Math.abs(f.height-4.10105)<.001);
  assert.equal(battlefieldAspect({width:72,height:48,units:'inches'}),1.5);
  // On a 1.5:1 rendered battlefield these unequal percentages produce equal pixel dimensions.
  assert.ok(Math.abs(f.width*1.5-f.height)<.001);
});

test('generic raster fallback finds coherent regions without Pavia palette constants',()=>{
  const n=24,data=new Uint8ClampedArray(n*n*4);for(let i=0;i<n*n;i++){data[i*4]=250;data[i*4+1]=250;data[i*4+2]=250;data[i*4+3]=255;}
  for(let y=3;y<6;y++)for(let x=2;x<18;x++){const i=(y*n+x)*4;data[i]=35;data[i+1]=95;data[i+2]=190;}
  for(let y=12;y<18;y++)for(let x=14;x<20;x++){const i=(y*n+x)*4;data[i]=60;data[i+1]=145;data[i+2]=55;}
  const parts=genericAppearanceComponents(data,n);
  assert.ok(parts.some(x=>x.kind==='blue'));
  assert.ok(parts.some(x=>x.kind==='green'));
});

test('zero-feature raster SVG retains an explicit Geometry Explorer diagnostic instead of silent success',async()=>{
  const d=await read('src/modules/battlefieldDetector.js');
  assert.match(d,/visual-source-unresolved/);
  assert.match(d,/genericRasterReviewCandidates/);
  assert.match(d,/Scenario-independent appearance fallback/);
});

test('deployment and playtest share calibrated footprint helpers and dynamic battlefield aspect',async()=>{
  const dep=await read('src/modules/deploymentEditor.js'),play=await read('src/modules/playtestCenter.js'),css=await read('src/styles/app.css');
  assert.match(dep,/footprintPercent/);assert.match(play,/footprintPercent/);
  assert.match(dep,/unitBaseWidthMm/);assert.match(dep,/unitBaseDepthMm/);assert.match(play,/unitBaseWidthMm/);assert.match(play,/unitBaseDepthMm/);
  assert.match(css,/max-width:240%/);assert.match(css,/--battlefield-width/);
});

test('stale playtest run is cleared from the current-scenario preview',async()=>{
  const play=await read('src/modules/playtestCenter.js');
  assert.match(play,/stale&&\(currentRun\|\|currentBatch\)/);
  assert.match(play,/old replay has been cleared from the current-scenario preview/);
});

test('force builder exposes visual suggested composition without auto-populating proposals',async()=>{
  const html=await read('index.html'),builder=await read('src/modules/scenarioBuilder.js');
  assert.match(html,/id="suggestedForcePlan"/);assert.match(html,/Proposed force composition/);
  assert.doesNotMatch(html,/id="addProposedForces"/);
  assert.match(builder,/data-find-profile/);assert.match(builder,/forcePlanGroups/);
});

test('AI change review has plain-English descriptions with technical JSON collapsed',async()=>{
  assert.match(describeAiChange({action:'add',target_type:'unit',target_side:'Side A',proposed_value:{name:'Swiss Main',profile:'Swiss Pikemen',command_name:'Vanguard'}}),/Add Swiss Main.*Swiss Pikemen.*Vanguard/);
  const ai=await read('src/modules/aiBridge.js');assert.match(ai,/Show technical detail/);assert.match(ai,/AI review summary/);
});
