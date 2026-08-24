import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const mapView=readFileSync(new URL('../src/modules/mapView.js',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('v0601 normalizes width/height-only SVGs to a responsive viewBox before dimensions are removed',()=>{
  assert.match(mapView,/export function ensureSvgViewport\(svg\)/);
  assert.match(mapView,/getAttribute\('width'\)/);
  assert.match(mapView,/getAttribute\('height'\)/);
  assert.match(mapView,/setAttribute\('viewBox',`0 0 \$\{width\} \$\{height\}`\)/);
  const uses=(mapView.match(/ensureSvgViewport\(svg\);/g)||[]).length;
  assert.ok(uses>=2,'both inline-text and fetched SVG loaders must normalize their viewport');
});
test('v0601 keeps current local battlefield state as startup source',()=>{
  assert.match(main,/if\(mapSource\?\.svgText\)/);
  assert.match(main,/loadInlineMapText\(\$\('#battlefieldMapHost'\),mapSource\.svgText\)/);
});
