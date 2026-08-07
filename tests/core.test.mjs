import test from 'node:test';
import assert from 'node:assert/strict';
import { paviaProject } from '../src/data/paviaProject.js';
import { RULES } from '../src/modules/featureReview.js';
import { createInitialState } from '../src/app/state.js';

test('Pavia sample declares a scenario-defined 48x48 inch play space', () => {
  assert.equal(paviaProject.playSpace.width,48); assert.equal(paviaProject.playSpace.height,48); assert.equal(paviaProject.playSpace.units,'inches');
});
test('Pavia promoted features include key functional terrain families', () => {
  const classes = new Set(paviaProject.features.map(f=>f.cls));
  for (const expected of ['Stream','Masonry Wall','Gatehouse','Bridge','Road','Dense Wood']) assert.ok(classes.has(expected), `missing ${expected}`);
  assert.ok(paviaProject.features.length >= 15);
});
test('Geometry Explorer has additional lower-confidence candidates', () => { assert.ok(paviaProject.candidates.length >= 5); });
test('Rules context supports cumulative multiple effects', () => { assert.ok(RULES.Difficult && RULES.Obscuring && RULES.Impassable && RULES.Defensive); });
test('Initial state retains project data without modifying source project object', () => { const state=createInitialState(); state.project.playSpace.width=72; assert.equal(paviaProject.playSpace.width,48); });
