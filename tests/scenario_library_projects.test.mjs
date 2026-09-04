import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { migrateImportedProject, PROJECT_FORMAT, PROJECT_SCHEMA_VERSION } from '../src/app/state.js';

const root=new URL('../',import.meta.url);
const readJson=async path=>JSON.parse(await fs.readFile(new URL(path,root),'utf8'));

const expected={
  'glendale-1862':{supplement:'american-civil-war',labels:['Union','Confederate'],reserve:true,rules:false},
  'cerignola-1503':{supplement:'italian-wars',labels:['Side A','Side B'],reserve:false,rules:false},
  'pavia-1525':{supplement:'italian-wars',labels:['Side A','Side B'],reserve:true,rules:true}
};

function inspectProject(entry,raw){
  const {state,migration}=migrateImportedProject(raw),project=state.project,scenario=project.scenario;
  const sideA=scenario.commands.sideA||[],sideB=scenario.commands.sideB||[],commands=[...sideA,...sideB];
  const commandIds=new Set(commands.map(command=>command.id)),units=commands.flatMap(command=>command.units||[]),unitIds=new Set(units.map(unit=>unit.id));
  return{state,migration,project,scenario,commands,commandIds,units,unitIds,placements:Object.entries(scenario.deployment?.placements||{}),commanderPlacements:Object.keys(scenario.deployment?.commanderPlacements||{})};
}

test('every Scenario Library record resolves, parses, migrates, and initializes as a valid project',async()=>{
  const catalog=await readJson('scenarios/index.json');
  assert.equal(catalog.format,'battle-axe-scenario-library');
  assert.deepEqual(catalog.scenarios.map(entry=>entry.id),Object.keys(expected));
  for(const entry of catalog.scenarios){
    assert.equal(entry.status,'Development');
    assert.match(entry.path,/^\.\/scenarios\//);
    const raw=await readJson(entry.path.replace(/^\.\//,'')),result=inspectProject(entry,raw),{project,scenario,migration}=result;
    assert.equal(raw.format,PROJECT_FORMAT,`${entry.id} should be a complete Studio project`);
    assert.equal(project.schemaVersion,PROJECT_SCHEMA_VERSION);
    assert.equal(migration.capabilities.scenarioOnly,false);
    assert.equal(migration.capabilities.containsBattlefield,true);
    assert.equal(migration.capabilities.containsDeployment,true);
    assert.equal(scenario.metadata.title,entry.title);
    assert.equal(scenario.ruleset.supplement,entry.supplement);
    assert.deepEqual(Object.keys(scenario.commands).sort(),['sideA','sideB']);
  }
});

test('library projects preserve battlefield, terrain, forces, deployment, facing, rules, and tactical workspace state',async()=>{
  const catalog=await readJson('scenarios/index.json');
  for(const entry of catalog.scenarios){
    const raw=await readJson(entry.path.replace(/^\.\//,'')),{state,project,scenario,commands,commandIds,units,unitIds,placements,commanderPlacements}=inspectProject(entry,raw),contract=expected[entry.id];
    assert.ok(project.mapSource?.svgText,`${entry.id} battlefield is missing`);
    assert.ok(project.features.length>0,`${entry.id} terrain is missing`);
    assert.ok(Object.keys(state.decisions||{}).length>0,`${entry.id} approved terrain decisions are missing`);
    assert.ok(commands.length>0&&units.length>0,`${entry.id} force structure is missing`);
    assert.ok(commands.some(command=>String(command.commander||'').trim()),`${entry.id} commander assignments are missing`);
    assert.equal(commandIds.size,commands.length,`${entry.id} contains duplicate command IDs`);
    assert.equal(unitIds.size,units.length,`${entry.id} contains duplicate unit IDs`);
    for(const command of commands)if(command.parentCommandId)assert.ok(commandIds.has(command.parentCommandId),`${entry.id} command ${command.id} has an invalid parent`);
    assert.ok(placements.length>0,`${entry.id} unit deployment is missing`);
    for(const [unitId,placement] of placements){assert.ok(unitIds.has(unitId),`${entry.id} placement references unknown unit ${unitId}`);assert.ok(Number.isFinite(Number(placement.facing)),`${entry.id} unit ${unitId} lost its facing`);}
    for(const commandId of commanderPlacements)assert.ok(commandIds.has(commandId),`${entry.id} commander placement references unknown command ${commandId}`);
    assert.deepEqual([scenario.sideLabels.sideA,scenario.sideLabels.sideB],contract.labels);
    assert.ok(scenario.sides?.sideA?.color&&scenario.sides?.sideB?.color,`${entry.id} side colors are missing`);
    assert.equal(commands.some(command=>!!command.reserve||!!command.reinforcement||command.status==='reserve'),contract.reserve);
    assert.equal((scenario.scenarioRules||[]).length>0,contract.rules);
    assert.ok(String(scenario.victoryText||'').trim(),`${entry.id} victory conditions are missing`);
    assert.equal(Object.keys(state.playtestWorkspace?.commandOrders||{}).length,Object.keys(raw.playtestWorkspace?.commandOrders||{}).length,`${entry.id} tactical command plans changed during load`);
  }
});

test('Glendale is stored as a current neutral-side project after normal migration',async()=>{
  const raw=await readJson('scenarios/acw/glendale-1862.json');
  assert.equal(raw.schemaVersion,PROJECT_SCHEMA_VERSION);
  assert.deepEqual(Object.keys(raw.project.scenario.commands).sort(),['sideA','sideB']);
  assert.deepEqual(Object.keys(raw.playtestWorkspace.armyOrders).sort(),['sideA','sideB']);
  assert.equal(raw.project.scenario.sideLabels.sideA,'Union');
  assert.equal(raw.project.scenario.sideLabels.sideB,'Confederate');
});
