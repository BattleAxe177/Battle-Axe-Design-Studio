import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compactUnitLabel, compactCommandLabel } from '../src/modules/displayLabels.js';
import { edgeEntryLine, edgeEntryLabelPosition } from '../src/modules/deploymentEditor.js';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');

test('historical unit labels are compact without changing authoritative names',()=>{
  assert.equal(compactUnitLabel('7th Pennsylvania Reserves'),'7th PA Res.');
  assert.equal(compactUnitLabel('20th Massachusetts Infantry'),'20th MA');
  assert.equal(compactUnitLabel('Randol’s Battery'),'Randol’s Bty.');
  assert.equal(compactUnitLabel('2nd New York State Militia Infantry'),'2nd NYSM');
});

test('reserve command labels omit parent-formation clutter',()=>{
  assert.equal(compactCommandLabel('Dana’s Brigade — Sedgwick’s Division'),'Dana’s Bde.');
  assert.equal(compactCommandLabel('Gorman/Sully Reinforcement Brigade'),'Gorman/Sully Bde.');
});

test('edge reserve labels are anchored inside every battlefield edge',()=>{
  const west=edgeEntryLabelPosition('west',edgeEntryLine('west',20,70));
  const east=edgeEntryLabelPosition('east',edgeEntryLine('east',20,70));
  const north=edgeEntryLabelPosition('north',edgeEntryLine('north',20,70));
  const south=edgeEntryLabelPosition('south',edgeEntryLine('south',20,70));
  assert.deepEqual(west,{x:1.5,y:45,anchor:'start'});
  assert.deepEqual(east,{x:98.5,y:45,anchor:'end'});
  assert.deepEqual(north,{x:45,y:2.4,anchor:'middle'});
  assert.deepEqual(south,{x:45,y:97.6,anchor:'middle'});
});

test('deployment polygon drawing exposes obvious finish, undo and cancel routes',()=>{
  const html=read('index.html'),js=read('src/modules/deploymentEditor.js'),css=read('src/styles/app.css');
  assert.match(html,/id="finishPolygonZone"/);
  assert.match(html,/id="undoPolygonVertex"/);
  assert.match(html,/id="cancelDeploymentTool"/);
  assert.match(js,/e\.key==='Enter'/);
  assert.match(js,/e\.key==='Backspace'/);
  assert.match(js,/dblclick/);
  assert.match(js,/<=14/,'clicking close to the first vertex should finish the polygon');
  assert.match(css,/\.zone-preview-point\.first/);
});

test('deployment and replay labels use compact labels outside unit tokens',()=>{
  const deploy=read('src/modules/deploymentEditor.js'),replay=read('src/modules/playtestCenter.js'),css=read('src/styles/app.css');
  assert.match(deploy,/compactUnitLabel\(meta\.name\)/);
  assert.match(replay,/compactUnitLabel\(u\.name\)/);
  assert.match(css,/top:calc\(100% \+ 2px\)!important/);
  assert.match(css,/max-width:82px!important/);
  assert.match(css,/reserve-entry-label-map\{font-size:1\.45px!important/);
});
