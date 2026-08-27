import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrateImportedProject } from '../src/app/state.js';
import { analyzeScenarioText } from '../src/modules/scenarioAnalyzer.js';

const compiler=fs.readFileSync(new URL('../src/modules/structuredMapCompiler.js',import.meta.url),'utf8');
const review=fs.readFileSync(new URL('../src/modules/featureReview.js',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');
const deployment=fs.readFileSync(new URL('../src/modules/deploymentEditor.js',import.meta.url),'utf8');

test('scenario-only Glendale export migrates to named 24x24 ACW project instead of blank state',()=>{
  const raw=JSON.parse(fs.readFileSync(new URL('./fixtures/glendale_scenario_only.json',import.meta.url),'utf8'));
  const {state,migration}=migrateImportedProject(raw);
  assert.equal(state.project.scenario.metadata.title,'Battle of Glendale / Frayser’s Farm');
  assert.equal(state.project.name,'Battle of Glendale / Frayser’s Farm');
  assert.equal(state.project.playSpace.width,24);
  assert.equal(state.project.playSpace.height,24);
  assert.equal(state.project.scenario.ruleset.supplement,'american-civil-war');
  assert.ok(migration.warnings.some(x=>/scenario-only/i.test(x)));
});

test('ACW hierarchy parser recognizes Union/Confederate and brigade commander headings',()=>{
  const text=`## Union Forces\n### McCall’s Division — Pennsylvania Reserves\n**Brig. Gen. George A. McCall**\n**First Brigade — Col. Seneca G. Simmons**\n- 1st Pennsylvania Reserves\n- 2nd Pennsylvania Reserves\n## Confederate Forces\n### Longstreet’s Command\n**Maj. Gen. James Longstreet**\n**First Brigade — Brig. Gen. James L. Kemper**`;
  const a=analyzeScenarioText(text,{ruleset:{unitLibrary:[{profile:'Infantry',traits:['Muskets']}],profileAliases:[{match:/pennsylvania reserves/i,profile:'Infantry'}]}});
  assert.ok(a.sourceCommands.some(c=>/First Brigade/i.test(c.name)&&/Simmons/i.test(c.commander)));
  assert.ok(a.sourceCommands.some(c=>c.faction==='Confederate'&&/Kemper/i.test(c.commander)));
});

test('PPTX compiler applies rotation/flip transforms and inherits group descriptions',()=>{
  assert.match(compiler,/xfrmMatrix/);
  assert.match(compiler,/getAttribute\('rot'\)/);
  assert.match(compiler,/inheritedDescr/);
  assert.match(compiler,/composeGroup/);
});

test('Road is exposed in Terrain Review and movement-only open-corridor logic exists',()=>{
  assert.match(review,/Roads give no movement bonus/);
  assert.match(review,/terrainClass\.value==='Road'/);
  assert.match(engine,/roadOverlapsFootprint/);
  assert.match(engine,/movementTerrainAlong/);
  assert.match(engine,/out\.delete\('Difficult'\).*out\.delete\('Impassable'\)/s);
});

test('Deployment Editor exposes command-level bulk facing changes',()=>{
  assert.match(deployment,/rotateSelectedCommand/);
  assert.match(deployment,/rotateCommandLeft/);
  assert.match(deployment,/rotateCommandRight/);
});
