import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createBlankScenario } from '../src/data/scenarioData.js';
import { setSideDisplayName, sideCommandColor, sideLabel } from '../src/modules/scenarioSides.js';
import { createScenarioProposalTemplate, importScenarioProposal, proposalReviewDefaults } from '../src/modules/scenarioProposal.js';
import { compileTacticalIntent, validateTacticalIntent } from '../src/modules/tacticalIntent.js';

const read=path=>fs.readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('display names remain separate from structural side IDs and drive shared colors',()=>{
  const s=createBlankScenario();setSideDisplayName(s,'sideA','Union');setSideDisplayName(s,'sideB','Confederate');
  assert.deepEqual(Object.keys(s.commands),['sideA','sideB']);assert.equal(sideLabel(s,'sideA'),'Union');assert.equal(sideLabel(s,'sideB'),'Confederate');
  assert.notEqual(sideCommandColor(s,'sideA',0),sideCommandColor(s,'sideB',0));assert.notEqual(sideCommandColor(s,'sideA',0),sideCommandColor(s,'sideA',1));
});

test('proposal metadata prefills review safely without becoming canonical',()=>{
  const s=createBlankScenario(),p=createScenarioProposalTemplate();p.metadata={title:'Glendale',date:'June 30, 1862',location:'Virginia',gameLength:'unresolved',tableSize:'TBD',status:'Review'};p.sideLabels={sideA:'Union',sideB:'Confederate'};p.publication.historical.conciseSummary='A concise scenario overview.';
  importScenarioProposal(s,p,{sourceName:'AI proposal'});const review=proposalReviewDefaults(s);
  assert.equal(s.metadata.title,'');assert.equal(s.metadata.gameLength,'');assert.equal(s.historicalSituation,'');
  assert.equal(review.metadata.title,'Glendale');assert.equal(review.metadata.gameLength,'');assert.equal(review.metadata.tableSize,'');assert.equal(review.sideLabels.sideA,'Union');assert.equal(review.publication.historical.conciseSummary,'A concise scenario overview.');
});

test('turn transition keeps the initial order and compiles its release',()=>{
  const intent=compileTacticalIntent('Defend until Turn 4, then Assault.',{ownSide:'sideA'});
  assert.equal(intent.status,'understood');assert.equal(intent.order,'Defend');assert.deepEqual(intent.releaseCondition,{type:'turn_reached',turn:4});assert.equal(intent.postReleaseOrder,'Assault');
});

test('negative while clause is retained as NOT and releases on named terrain crossing',()=>{
  const context={ownSide:'sideA',sideLabels:{sideA:'Union',sideB:'Confederate'},terrain:[{id:'willis-road',name:'Willis Church Road'}]};
  const intent=compileTacticalIntent('Hold while no enemy unit has crossed Willis Church Road, then Assault.',context);
  assert.equal(intent.status,'understood');assert.equal(intent.order,'Hold');assert.equal(intent.guardCondition.op,'NOT');assert.equal(intent.releaseCondition.type,'terrain_occupied');assert.deepEqual(intent.releaseCondition.terrainIds,['willis-road']);assert.equal(intent.releaseCondition.side,'sideB');assert.equal(intent.postReleaseOrder,'Assault');assert.deepEqual(validateTacticalIntent(intent,context),[]);
});

test('unsupported meaningful condition fails closed',()=>{
  const intent=compileTacticalIntent('Hold until the commander feels the moment is right, then Assault.',{ownSide:'sideA'});
  assert.equal(intent.status,'blocked');assert.ok(intent.unresolved.length);
});

test('Force Builder avoids empty duplicate source trees and requires proposal destinations',async()=>{
  const source=await read('src/modules/scenarioBuilder.js');
  assert.match(source,/host\.innerHTML=hasAny\?/);assert.match(source,/AI proposed forces —/);assert.match(source,/data-proposal-destination/);assert.match(source,/Select the destination command/);assert.match(source,/data-proposal-parent/);assert.match(source,/data-proposal-commander-target/);
});

test('Deployment, replay, Publisher, and reports resolve display labels and shared colors',async()=>{
  const [deployment,playtest,publisher]=await Promise.all(['src/modules/deploymentEditor.js','src/modules/playtestCenter.js','src/modules/scenarioPublisher.js'].map(read));
  assert.match(deployment,/sideCommandColor\(scenario\(\),faction,index\)/);assert.match(playtest,/sideCommandColor\(scenario\(\),faction,i\)/);assert.match(publisher,/sideCommandColor\(scenario,side,i\)/);
  assert.match(playtest,/sideLabel\(scenario\(\),'sideA'\)/);assert.match(playtest,/currentRun\.replayActors,currentRun\.snapshots,replayIndex/);
});

test('review UI exposes editable side names and a concise Scenario overview',async()=>{
  const html=await read('index.html');assert.match(html,/id="scenarioSideALabel"/);assert.match(html,/id="scenarioSideBLabel"/);assert.match(html,/>Scenario overview</);assert.doesNotMatch(html,/Canonical historical situation/);
});
