import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');

test('v0.5.6 keeps local SVG source immutable and crops only at render time',async()=>{
  const main=await read('src/main.js'),state=await read('src/modules/battlefieldState.js');
  assert.match(main,/svgText:sourceSvgText/);
  assert.doesNotMatch(main,/svgText:clippedSvgText/);
  assert.match(state,/renderBattlefieldSvgText/);
  assert.match(state,/stored source SVG is never rewritten/i);
  assert.match(state,/applyPlayAreaViewBox\(clone,source\.playArea/);
});

test('battlefield renderer supplies a reliable intrinsic ratio for cropped SVGs',async()=>{
  const state=await read('src/modules/battlefieldState.js'),css=await read('src/styles/app.css');
  assert.match(state,/setAttribute\('width',String\(boundary\.width\)\)/);
  assert.match(state,/setAttribute\('height',String\(boundary\.height\)\)/);
  assert.match(state,/applyBattlefieldAspect/);
  assert.match(css,/\.map-frame \.map-svg-host\{width:100%;height:100%/);
  assert.match(css,/\.map-svg-host \.battlefield-svg\{display:block;width:100%!important;height:100%!important/);
});

test('suggested force diagrams stack vertically and use larger readable typography',async()=>{
  const css=await read('src/styles/app.css');
  assert.match(css,/\.force-plan\{display:grid!important;grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css,/\.force-sketch figcaption strong\{font-size:19px!important/);
  assert.match(css,/\.force-sketch-command li\{[^}]*font-size:11\.5px!important/s);
});

test('AI review supports accept all remaining and batch undo',async()=>{
  const ai=await read('src/modules/aiBridge.js'),css=await read('src/styles/app.css');
  assert.match(ai,/Accept all remaining/);
  assert.match(ai,/data-ai-accept-all/);
  assert.match(ai,/Undo accepted batch/);
  assert.match(ai,/sourceForceLines/);
  assert.match(ai,/Historical evidence first/);
  assert.match(css,/\.ai-batch-actions/);
});

test('home workspace includes visual module graphics and polished identity hooks',async()=>{
  const html=await read('index.html'),css=await read('src/styles/app.css');
  assert.match(html,/class="module-icon"/);
  assert.match(html,/class="module-card"/);
  assert.match(css,/v0\.5\.6\.0 — visual identity/);
  assert.match(css,/repeating-radial-gradient/);
});
