import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const detector=fs.readFileSync(new URL('../src/modules/battlefieldDetector.js',import.meta.url),'utf8');
const mapView=fs.readFileSync(new URL('../src/modules/mapView.js',import.meta.url),'utf8');

test('v0.6.0.2 re-detects authoritative tabletop boundary for saved SVG maps',()=>{
  assert.match(main,/findBattlefieldBoundary\(svg,state\.project\.playSpace\)/);
  assert.match(main,/storedLooksRoot/);
  assert.match(main,/mapSource\.playArea=\{\.\.\.detectedPlayArea\}/);
  assert.match(main,/mapSource\.svgText=serializeBattlefieldSvg\(svg,mapSource\.playArea\)/);
});

test('battlefield detector exposes the same boundary resolver used by initial compilation',()=>{
  assert.match(detector,/function findBoundary\(svg,playSpace=null\)/);
  assert.match(detector,/export function findBattlefieldBoundary\(svg,playSpace=null\)\{return findBoundary\(svg,playSpace\);\}/);
  assert.match(detector,/const bound=findBoundary\(svg,playSpace\)/);
});

test('SVG viewport normalization remains before responsive dimensions are removed',()=>{
  assert.match(mapView,/ensureSvgViewport\(svg\);\s*svg\.removeAttribute\('width'\)/s);
});
