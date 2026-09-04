import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('playtest counter rotates while its label remains screen-upright',async()=>{
  const js=await read('src/modules/playtestCenter.js');
  const css=await read('src/styles/app.css');
  assert.match(js,/rotate\(\$\{facing\}deg\)/);
  assert.match(js,/--label-counter-rotation/);
  assert.match(css,/rotate\(var\(--label-counter-rotation,0deg\)\)!important/);
});

test('deployment labels are continuously visible rather than selection-only',async()=>{
  const css=await read('src/styles/app.css');
  assert.ok(css.includes('.deployment-piece .piece-label{display:block'));
  assert.ok(!css.includes('.deployment-piece .piece-label{display:none}'));
});

test('publisher deployment labels use counter-style white-on-side-color treatment',async()=>{
  const js=await read('src/modules/scenarioPublisher.js');
  assert.ok(js.includes('color:#fff'));
  assert.ok(js.includes('text-shadow:0 1px 2px #000'));
  assert.ok(!js.includes('background:rgba(255,255,255,.90)'));
});

test('command palettes use visibly separated shades within side families',async()=>{
  const dep=await read('src/modules/deploymentEditor.js'),sides=await read('src/modules/scenarioSides.js');
  assert.ok(dep.includes('sideCommandColor'));
  assert.ok(sides.includes("'#164A7A','#2376BD','#49A0D8'"));
  assert.ok(sides.includes("'#7E2727','#A93A32','#D45A4D'"));
});
