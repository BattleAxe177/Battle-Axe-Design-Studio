import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createBlankScenario } from '../src/data/scenarioData.js';
import { createProjectExportPayload, createInitialState, migrateScenario } from '../src/app/state.js';
import { classifyScenarioIntake, createScenarioProposalTemplate, importScenarioProposal, proposalReviewDefaults, validateScenarioProposal } from '../src/modules/scenarioProposal.js';
import { applySetupRuleImplementations, renderRuleEngineInterpretation, validateRuleImplementation } from '../src/modules/scenarioRuleAutomation.js';
import { __conformance } from '../src/modules/playtestEngine.js';
import { getEffectiveRuleset } from '../src/rules/ruleset.js';
import { validateTacticalResponse } from '../src/modules/externalAiExchange.js';
import { tacticalRequestContext690 } from '../src/modules/tacticalPlanner690.js';
import { compileTacticalIntent } from '../src/modules/tacticalIntent.js';

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

test('proposal import preserves narrative as review material without changing canonical prose',()=>{
  const proposal=createScenarioProposalTemplate();proposal.publication.historical.narrative='Imported historical narrative';proposal.publication.battlefield.narrative='Imported battlefield narrative';proposal.publication.sourceDiscussion='Imported source discussion';
  const scenario=createBlankScenario();scenario.publication.historical.narrative='Designer historical narrative';importScenarioProposal(scenario,proposal);
  assert.equal(scenario.publication.historical.narrative,'Designer historical narrative');
  assert.equal(scenario.publication.battlefield.narrative,'');
  assert.equal(scenario.publication.sourceDiscussion,'');
  assert.equal(proposalReviewDefaults(scenario).publication.battlefield.narrative,'Imported battlefield narrative');
  assert.equal(proposalReviewDefaults(scenario).publication.sourceDiscussion,'Imported source discussion');
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
  assert.match(source,/if\(done\)return `<div class="extraction-row">/);
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

test('one structured Rule Opportunity remains one noncanonical opportunity',()=>{
  const proposal=createScenarioProposalTemplate();proposal.proposals.ruleOpportunities=[{id:'fog',title:'Morning fog',historicalCondition:'Fog covered the field.',whyItMatters:'Visibility may be reduced.',suggestedMechanic:'Limit visibility during Turn 1.',normalRulesAlternative:'Use normal LOS.',confidence:70,sourceReferences:['Source A'],notes:'Review duration.'}];
  const scenario=createBlankScenario();importScenarioProposal(scenario,proposal);assert.equal(scenario.proposals.ruleOpportunities.length,1);assert.equal(scenario.scenarioRules.length,0);assert.equal(scenario.proposals.ruleOpportunities[0].suggestedMechanic,'Limit visibility during Turn 1.');
});

test('prose alone cannot become automated and valid structure generates interpretation',()=>{
  assert.ok(validateRuleImplementation(null,{}).length);
  const implementation={version:'1.0',timing:'setup',affectedSideId:'sideA',condition:null,actions:[{type:'set-turn-one-initiative',sideId:'sideA'}],persistence:'once'};
  assert.deepEqual(validateRuleImplementation(implementation,{}),[]);assert.match(renderRuleEngineInterpretation(implementation,{}),/Action: Set Turn 1 initiative to sideA/);assert.equal(applySetupRuleImplementations({},[{implementation}]).turnOneInitiative,'sideA');
  assert.ok(validateRuleImplementation({...implementation,actions:[{type:'execute-javascript',code:'x'}]},{}).length);
});

test('commanderless commands survive migration and export as intentional canonical commands',()=>{
  const s=migrateScenario({commands:{sideA:[{id:'body',name:'Commanderless body',commander:'',commanderStatus:'none',units:[]}],sideB:[]}});assert.equal(s.commands.sideA[0].commander,'');assert.equal(s.commands.sideA[0].commanderStatus,'none');const state=createInitialState();state.project.scenario=s;const payload=createProjectExportPayload(state,{studioVersion:'test'});assert.equal(payload.project.scenario.commands.sideA[0].commanderStatus,'none');
});

test('Italian Wars Army Commander authority is side-wide but ranged, Subcommander authority is local, and ACW remains hierarchical',()=>{
  const italian=createBlankScenario(),army={id:'army',kind:'commander',faction:'sideA',commandId:'body-a',commanderRole:'army-commander',destroyed:false,inactive:false},sub={id:'sub',kind:'commander',faction:'sideA',commandId:'body-a',commanderRole:'subcommander',destroyed:false,inactive:false},other={id:'u',faction:'sideA',commandId:'body-b'};italian.ruleset.supplement='italian-wars';const iw={rules:getEffectiveRuleset(italian),commandParentById:new Map([['body-a',null],['body-b',null]])};assert.equal(__conformance.commanderHasAuthority(army,other,iw),true);assert.equal(__conformance.commanderHasAuthority(sub,other,iw),false);
  const acw=createBlankScenario();acw.ruleset.supplement='american-civil-war';const acwCtx={rules:getEffectiveRuleset(acw),commandParentById:new Map([['corps',null],['brigade','corps'],['sibling',null]])},corps={...army,commandId:'corps',commanderRole:'subcommander'};assert.equal(__conformance.commanderHasAuthority(corps,{...other,commandId:'brigade'},acwCtx),true);assert.equal(__conformance.commanderHasAuthority(corps,{...other,commandId:'sibling'},acwCtx),false);
});

test('terrain crossing history requires a strict boundary transition and latches by actor and feature',()=>{
  const feature={id:'line',name:'Named line',parts:[{closed:false,points:[{x:5,y:0},{x:5,y:10}]}]},actor={id:'u',name:'Unit',faction:'sideB',commandId:'enemy'},ctx={terrain:[feature],terrainCrossings:{},turn:2,commandParentById:new Map()};assert.equal(__conformance.recordTerrainTransitions(actor,{from:{x:2,y:4},to:{x:4.9,y:4}},ctx).length,0);assert.equal(__conformance.recordTerrainTransitions(actor,{from:{x:4,y:4},to:{x:6,y:4}},ctx)[0].relation,'crossed');assert.equal(__conformance.recordTerrainTransitions(actor,{from:{x:6,y:4},to:{x:4,y:4}},ctx).length,0,'historical crossing stays latched');
});

test('tactical response requires exact version, revision, side IDs, and command IDs',()=>{
  const state=createInitialState();state.project.scenario.commands.sideA=[{id:'a',name:'A',commander:'',units:[]}];const revision=tacticalRequestContext690(state).configuration,base={format:'battle-axe-ai-response',version:'1.0',response_type:'tactical-plan',scenario_revision:revision,tactical_plan:{armies:{sideA:{posture:'Defensive'}},commands:{a:{order:'Reserve',tactical_intent:{version:'1.0',scope:'command',commandId:'a',side:'sideA',order:'Reserve',releaseCondition:{type:'turn_reached',turn:2},postReleaseOrder:'Assault',warnings:[],unresolved:[],status:'understood'}}}},warnings:[],unresolved_questions:[]};assert.equal(validateTacticalResponse(structuredClone(base),state).plan.commands.a.tacticalIntent.postReleaseOrder,'Assault');assert.throws(()=>validateTacticalResponse({...structuredClone(base),version:'2.0'},state),/version/);assert.throws(()=>validateTacticalResponse({...structuredClone(base),scenario_revision:'stale'},state),/fresh package/);const bad=structuredClone(base);bad.tactical_plan.commands.unknown=bad.tactical_plan.commands.a;delete bad.tactical_plan.commands.a;assert.throws(()=>validateTacticalResponse(bad,state),/Unknown command ID/);
});

test('native authoring editors and downloadable versioned contract are wired into the product',async()=>{
  const [html,builder,features,deployment,external,build,agents]=await Promise.all(['../index.html','../src/modules/scenarioBuilder.js','../src/modules/featureReview.js','../src/modules/deploymentEditor.js','../src/modules/externalAiExchange.js','../scripts/build.mjs','../AGENTS.md'].map(p=>fs.readFile(new URL(p,import.meta.url),'utf8')));assert.match(html,/id="commandEditorDialog"/);assert.match(html,/id="manualFeatureDialog"/);assert.match(html,/id="reserveTurnDialog"/);assert.match(html,/id="deploymentZoneDialog"/);assert.match(external,/Paste AI response JSON \(fallback\)/);assert.doesNotMatch(builder,/\bprompt\s*\(/);assert.doesNotMatch(features,/\bprompt\s*\(/);assert.doesNotMatch(deployment,/\bprompt\s*\(/);assert.match(build,/RULE_AUTOMATION_SCHEMA\.json/);assert.match(agents,/one versioned external-AI contract/i);
});

test('tactical review renders structured values and the explicit otherwise branch',async()=>{
  const release=await fs.readFile(new URL('../src/modules/release690.js',import.meta.url),'utf8'),intent=compileTacticalIntent('hold until turn 4, then assault',{scope:'command',commandId:'reserve',ownSide:'sideA',sides:[{id:'sideA',label:'Blue'},{id:'sideB',label:'Red'}]});assert.match(release,/JSON\.stringify\(value\)/);assert.ok(intent.meaning.includes('Otherwise: remain Hold.'));
});
