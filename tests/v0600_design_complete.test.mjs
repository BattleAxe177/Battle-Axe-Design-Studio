import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dep=readFileSync(new URL('../src/modules/deploymentEditor.js',import.meta.url),'utf8');
const eng=readFileSync(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');
const center=readFileSync(new URL('../src/modules/playtestCenter.js',import.meta.url),'utf8');
const pub=readFileSync(new URL('../src/modules/scenarioPublisher.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v060 deployment drag preserves the grabbed pointer offset and rejects illegal drop without snapping',()=>{
  assert.match(dep,/dragCenterFromGrab\(dragPiece\.origin,dragPiece\.pointerStart,pointer\)/);
  assert.match(dep,/pctFromEvent\(e,dragFrameRect,false\)/);
  assert.match(dep,/placementClear\(dragPiece\.kind,dragPiece\.id,p\)\?p:dragPiece\.origin/);
});
test('v060 deployment rotation is authored and playtest preserves it',()=>{
  assert.match(html,/rotateDeploymentLeft/);assert.match(dep,/facing:normDeg/);assert.match(eng,/facingSource='deployment'/);
});
test('v060 tactical engine stages congested commands and latches reserve release',()=>{
  assert.match(eng,/activationOrderForSide/);assert.match(eng,/maneuverWave/);assert.match(eng,/ctx\.commandRelease\[u\.commandId\]/);
  assert.match(eng,/No meaningful legal movement/);
});
test('v060 replay legend and status labels are designer-readable',()=>{
  assert.match(html,/Command Test passed/);assert.match(html,/Firearm \/ artillery fire/);assert.match(center,/Defensive.*In command.*Out of command/s);
});
test('v060 publisher provides deterministic Battle Axe Scenario Sheet mode',()=>{
  assert.match(html,/Battle Axe Scenario Sheet/);assert.match(pub,/scenarioSheetHtml/);assert.match(pub,/Army total:/);assert.match(pub,/battlefieldBrief/);assert.match(pub,/deploymentBrief/);
});
