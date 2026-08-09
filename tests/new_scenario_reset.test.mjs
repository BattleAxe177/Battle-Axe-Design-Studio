import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createInitialState } from '../src/app/state.js';

test('clean initial project contains no scenario-specific map/source state',()=>{
  const s=createInitialState();
  assert.equal(s.project.name,'Untitled Scenario');
  assert.equal(s.project.historicalContext,'');
  assert.equal(s.project.mapNotes,'');
  assert.deepEqual(s.project.features,[]);
  assert.deepEqual(s.project.candidates,[]);
  assert.deepEqual(s.project.manualFeatures,[]);
  assert.equal(s.project.scenario.ruleset.supplement,'italian-wars');
});

test('New Scenario UI exports first or clears persisted project and reloads',async()=>{
  const main=await fs.readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/id="newScenarioBtn"/);
  assert.match(html,/Export \/ Save Current Scenario First/);
  assert.match(main,/downloadCurrentProject/);
  assert.match(main,/localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(main,/window\.location\.reload\(\)/);
});

test('reset warning identifies major scenario data being cleared',async()=>{
  const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const phrase of ['battlefield map','source imports','forces, commanders','playtest runs','publisher output'])assert.ok(html.includes(phrase));
});
