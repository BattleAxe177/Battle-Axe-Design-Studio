import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createBlankScenario } from '../src/data/scenarioData.js';
import { createProjectExportPayload, createInitialState, migrateScenario } from '../src/app/state.js';
import { classifyScenarioIntake, createScenarioProposalTemplate, importScenarioProposal, validateScenarioProposal } from '../src/modules/scenarioProposal.js';

test('canonical scenario and export use only neutral structural side IDs',()=>{
  const s=createBlankScenario();assert.deepEqual(Object.keys(s.commands),['sideA','sideB']);assert.equal('French' in s.commands,false);assert.equal('Imperial' in s.commands,false);
  const state=createInitialState(),payload=createProjectExportPayload(state,{studioVersion:'test'});assert.deepEqual(Object.keys(payload.project.scenario.commands),['sideA','sideB']);
});

test('legacy French and Imperial projects migrate transparently without exporting legacy keys',()=>{
  const s=migrateScenario({sideLabels:{French:'Union',Imperial:'Confederate'},commands:{French:[{id:'u',name:'Union command',units:[]}],Imperial:[{id:'c',name:'Confederate command',units:[]}]}});
  assert.equal(s.sideLabels.sideA,'Union');assert.equal(s.sideLabels.sideB,'Confederate');assert.equal(s.commands.sideA[0].id,'u');assert.equal(s.commands.sideB[0].id,'c');assert.deepEqual(Object.keys(s.commands),['sideA','sideB']);
});

test('proposal import validates sides and changes proposal state only',()=>{
  const bad=createScenarioProposalTemplate();bad.proposals.forces=[{side:'French',name:'Legacy side'}];assert.equal(validateScenarioProposal(bad).valid,false);
  const good=createScenarioProposalTemplate();good.proposals.forces=[{id:'force-1',side:'sideA',name:'Proposed brigade'}];good.proposals.ruleOpportunities=[{id:'rule-1',title:'Possible fog',text:'Consider limited visibility.'}];const s=createBlankScenario(),before=structuredClone({commands:s.commands,scenarioRules:s.scenarioRules});importScenarioProposal(s,good);assert.deepEqual({commands:s.commands,scenarioRules:s.scenarioRules},before);assert.equal(s.proposals.forces.length,1);assert.equal(s.proposals.ruleOpportunities.length,1);
});

test('proposal import retains publication narrative without overwriting designer prose',()=>{
  const proposal=createScenarioProposalTemplate();proposal.publication.historical.narrative='Imported historical narrative';proposal.publication.battlefield.narrative='Imported battlefield narrative';proposal.publication.sourceDiscussion='Imported source discussion';
  const scenario=createBlankScenario();scenario.publication.historical.narrative='Designer historical narrative';importScenarioProposal(scenario,proposal);
  assert.equal(scenario.publication.historical.narrative,'Designer historical narrative');
  assert.equal(scenario.publication.battlefield.narrative,'Imported battlefield narrative');
  assert.equal(scenario.publication.sourceDiscussion,'Imported source discussion');
});

test('arbitrary narrative is evidence-only while rigid headings route to structured extraction',()=>{
  assert.equal(classifyScenarioIntake('The morning was confused and the ridge may have mattered.').kind,'narrative-evidence');
  assert.equal(classifyScenarioIntake('Historical Situation\nA battle occurred.\n\nSide A Army\n- First Brigade').kind,'structured-source');
});

test('authoring pack documents use the live proposal contract',async()=>{
  const [guide,schema,template,agents]=await Promise.all(['../docs/ai/BATTLE_AXE_SCENARIO_AUTHORING_GUIDE.md','../docs/ai/SCENARIO_PROPOSAL_SCHEMA.json','../docs/ai/SCENARIO_PROPOSAL_TEMPLATE.json','../AGENTS.md'].map(p=>fs.readFile(new URL(p,import.meta.url),'utf8')));
  assert.match(guide,/human-first/i);assert.match(guide,/will not infer commands, forces, or rules from arbitrary narrative prose/i);assert.match(agents,/Keep this file.*authoring guide.*proposal schema/is);assert.equal(JSON.parse(schema).properties.version.const,'1.0');assert.equal(validateScenarioProposal(JSON.parse(template)).valid,true);
});

test('scenario intake names its source before routing every intake branch',async()=>{
  const source=await fs.readFile(new URL('../src/modules/scenarioBuilder.js',import.meta.url),'utf8');
  assert.match(source,/const sourceName=name,route=classifyScenarioIntake\(text\)/);
  assert.match(source,/importScenarioProposal\(scenario\(\),route\.proposal,\{sourceName\}\)/);
  assert.match(source,/x\.status==='applied'\?'<button class="secondary compact" disabled>Applied<\/button>'/);
  assert.match(source,/proposalId:x\.id/);
});

test('playtest worker startup has a bounded deterministic fallback',async()=>{
  const [worker,center]=await Promise.all(['../src/modules/playtestWorker.js','../src/modules/playtestCenter.js'].map(p=>fs.readFile(new URL(p,import.meta.url),'utf8')));
  assert.match(worker,/phase:'started'/);
  assert.match(center,/setTimeout\(fallback,5000\)/);
  assert.match(center,/runTimer=setTimeout\(fallback/);
  assert.match(center,/import\('\.\/playtestEngine690\.js\?v=0\.6\.9\.1'\)/);
});

test('Publisher includes the retained battlefield narrative before the map',async()=>{
  const source=await fs.readFile(new URL('../src/modules/scenarioPublisher.js',import.meta.url),'utf8');
  assert.match(source,/battlefieldNarrative=authoritativeText\(s\.publication\?\.battlefield\?\.narrative/);
  assert.match(source,/battlefieldNarrative\?battlefieldNarrative\.split/);
});
