import test from 'node:test';
import assert from 'node:assert/strict';
import { PAVIA_DRAFT_SAMPLE, WARGAMERS_GUIDE_SAMPLE, createBlankScenario } from '../src/data/scenarioData.js';
import { getEffectiveRuleset } from '../src/rules/ruleset.js';
import { analyzeScenarioText, proposedRosterUnits } from '../src/modules/scenarioAnalyzer.js';
import { readFile } from 'node:fs/promises';

test('scenario analyzer preserves multi-paragraph historical situation',()=>{
  const a=analyzeScenarioText(PAVIA_DRAFT_SAMPLE,{sourceName:'Pavia draft'});
  assert.match(a.historicalSituation,/By February 1525/);
  assert.match(a.historicalSituation,/Before dawn on 24 February/);
  assert.ok(a.historicalSituation.length>250);
});

test('scenario analyzer extracts Pavia metadata, formations and historical commands',()=>{
  const a=analyzeScenarioText(PAVIA_DRAFT_SAMPLE,{sourceName:'Pavia draft'});
  assert.match(a.metadata.title,/Pavia/i);assert.equal(a.metadata.gameLength,'8');assert.ok(a.forces.length>=10);assert.ok(a.sourceCommands.length>=5);assert.ok(a.sourceCommands.some(x=>/Swiss Command/.test(x.name)));assert.ok(a.suggestions.some(x=>/Surprise/i.test(x.title)));
});

test('scanned-guide example generates optional fog and sortie suggestions',()=>{
  const a=analyzeScenarioText(WARGAMERS_GUIDE_SAMPLE,{sourceName:'Guide'});
  assert.ok(a.suggestions.some(x=>/visibility/i.test(x.title)));assert.ok(a.suggestions.some(x=>/sortie/i.test(x.title)));assert.ok(a.forces.length>=8);
});

test('canonical Italian Wars library includes Archers and corrected Forlorn Hope',()=>{
  const UNIT_LIBRARY=getEffectiveRuleset(createBlankScenario()).unitLibrary;const archers=UNIT_LIBRARY.find(x=>x.profile==='Archers'),hope=UNIT_LIBRARY.find(x=>x.profile==='Forlorn Hope');
  assert.ok(archers);assert.deepEqual([archers.m,archers.c,archers.a,archers.pts],[2,2,4,1]);assert.ok(hope);assert.equal(UNIT_LIBRARY.some(x=>x.profile==='Verlorne Hope'),false);
});

test('Battle Axe unit library seeds command-aware roster proposals',()=>{
  const a=analyzeScenarioText(PAVIA_DRAFT_SAMPLE),proposed=proposedRosterUnits(a.forces);assert.ok(proposed.French.length>0&&proposed.Imperial.length>0);assert.ok(proposed.French.some(x=>x.commandName));
});

test('blank scenario distinguishes source commands, working commands and deployment',()=>{
  const s=createBlankScenario();assert.deepEqual(s.sourceCommands,[]);assert.deepEqual(s.commands,{French:[],Imperial:[],Garrison:[]});assert.deepEqual(s.deployment,{placements:{},commanderPlacements:{},zones:[]});assert.equal(s.ruleset.supplement,'italian-wars');
});

test('Scenario Builder and Deployment UI expose command hierarchy and rule editor',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const token of ['sourceForceList','data-add-command="French"','ruleEditorDialog','ruleEditorText','deploymentTree','deploymentMapFrame','addDeploymentZone'])assert.ok(html.includes(token),`missing ${token}`);
});
