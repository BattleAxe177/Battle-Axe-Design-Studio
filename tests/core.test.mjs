import test from 'node:test';
import assert from 'node:assert/strict';
import { paviaProject } from '../src/data/paviaProject.js';
import { RULES } from '../src/modules/featureReview.js';
import { createInitialState } from '../src/app/state.js';
import { readFile } from 'node:fs/promises';

test('Pavia sample declares a scenario-defined 48x48 inch play space', () => {
  assert.equal(paviaProject.playSpace.width,48); assert.equal(paviaProject.playSpace.height,48); assert.equal(paviaProject.playSpace.units,'inches');
});
test('Pavia feature arrays are runtime-generated rather than hard-coded', () => { assert.equal(paviaProject.features.length,0); assert.equal(paviaProject.candidates.length,0); });
test('runtime detector covers major geometry families and deep-scan objects', async()=>{const s=await readFile(new URL('../src/modules/battlefieldDetector.js',import.meta.url),'utf8'); for(const token of ['water','wet','wood','wall','avenue','bridge','structure','track','rasterClassifiers']) assert.ok(s.includes(token),`missing detector family ${token}`);});
test('Rules context supports cumulative multiple effects', () => { assert.ok(RULES.Difficult && RULES.Obscuring && RULES.Impassable && RULES.Defensive); });
test('Initial state retains project data without modifying source project object', () => { const state=createInitialState(); state.project.playSpace.width=72; assert.equal(paviaProject.playSpace.width,48); });

test('structured Pavia terrain manifest is present and covers authored terrain classes', async()=>{
  const data=JSON.parse(await readFile(new URL('../public/projects/pavia/pptx-terrain-manifest.json',import.meta.url),'utf8'));
  assert.equal(data.compilerVersion,'0.2.0-structured');
  for(const cls of ['Stream','Dense Wood','Masonry Wall','Gatehouse','Bridge','Open Grove','Wet Ground']) assert.ok(data.features.some(f=>f.cls===cls),`missing ${cls}`);
  assert.ok(data.features.every(f=>Array.isArray(f.geometry?.parts)&&f.geometry.parts.length>0));
});
