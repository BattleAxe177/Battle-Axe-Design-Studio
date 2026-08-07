import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIT_LIBRARY, PAVIA_DRAFT_SAMPLE, WARGAMERS_GUIDE_SAMPLE, createBlankScenario } from '../src/data/scenarioData.js';
import { analyzeScenarioText, proposedRosterUnits } from '../src/modules/scenarioAnalyzer.js';
import { readFile } from 'node:fs/promises';

test('scenario analyzer extracts Pavia draft metadata, forces and design suggestions',()=>{
  const a=analyzeScenarioText(PAVIA_DRAFT_SAMPLE,{sourceName:'Pavia draft'});
  assert.match(a.metadata.title,/Pavia/i);
  assert.equal(a.metadata.gameLength,'8');
  assert.ok(a.forces.length>=10);
  assert.ok(a.suggestions.some(x=>/Surprise/i.test(x.title)));
});

test('scanned-guide example generates optional fog and sortie suggestions',()=>{
  const a=analyzeScenarioText(WARGAMERS_GUIDE_SAMPLE,{sourceName:'Guide'});
  assert.ok(a.suggestions.some(x=>/visibility/i.test(x.title)));
  assert.ok(a.suggestions.some(x=>/sortie/i.test(x.title)));
  assert.ok(a.forces.length>=8);
});

test('Battle Axe unit library has canonical stats and can seed roster proposals',()=>{
  const g=UNIT_LIBRARY.find(x=>x.profile==='Gendarmes');
  const swiss=UNIT_LIBRARY.find(x=>x.profile==='Swiss Pikemen');
  assert.deepEqual([g.m,g.c,g.a,g.pts],[3,4,6,3]);
  assert.deepEqual([swiss.m,swiss.c,swiss.a,swiss.pts],[2,4,5,2]);
  const a=analyzeScenarioText(PAVIA_DRAFT_SAMPLE);
  const proposed=proposedRosterUnits(a.forces);
  assert.ok(proposed.French.length>0 && proposed.Imperial.length>0);
});

test('blank scenario distinguishes source evidence, suggestions and accepted rosters',()=>{
  const s=createBlankScenario();
  assert.deepEqual(s.sources,[]);assert.deepEqual(s.suggestions,[]);assert.deepEqual(s.rosters,{French:[],Imperial:[],Garrison:[]});
});

test('Scenario Builder UI contains source intake, suggestion tray, drag/drop roster and unit editor',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const token of ['scenarioFiles','suggestionTray','rosterFrench','unitLibrary','unitEditorDialog','exportScenarioJson'])assert.ok(html.includes(token),`missing ${token}`);
});
