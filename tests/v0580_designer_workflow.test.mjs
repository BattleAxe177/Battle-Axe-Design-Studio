import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeScenarioText } from '../src/modules/scenarioAnalyzer.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('structured army headings preserve commands, commanders, formations and uncertainty',()=>{
  const text=`# Battle of Example\n## Spanish Army\n**Commander-in-Chief: Gonzalo Example**\n### Reserve\n**Commander: Gonzalo Example**\nLikely components:\n- Spanish men-at-arms.\n### German Centre\n**Commander: Fabricio Example**\nLikely components:\n- German Landsknechts.\n### Cavalry\n**Commander: provisional**\nLikely components:\n- Jinetes/light cavalry.\n## French Army\n**Commander-in-Chief: Louis Example**\n### Swiss Battle\n**Commander: Chandieu**\nLikely components:\n- Swiss pikemen.`;
  const a=analyzeScenarioText(text);
  const reserve=a.sourceCommands.find(c=>c.name==='Reserve'),centre=a.sourceCommands.find(c=>c.name==='German Centre'),cavalry=a.sourceCommands.find(c=>c.name==='Cavalry'),swiss=a.sourceCommands.find(c=>c.name==='Swiss Battle');
  assert.equal(reserve?.commander,'Gonzalo Example');assert.equal(reserve?.armyCommander,'Gonzalo Example');assert.ok(reserve?.formations.length);
  assert.equal(centre?.commander,'Fabricio Example');assert.equal(cavalry?.commanderStatus,'provisional');assert.equal(cavalry?.commander,'');
  assert.equal(swiss?.faction,'French');assert.equal(swiss?.commander,'Chandieu');assert.ok(swiss?.formations.length);
  assert.ok(a.forces.some(f=>f.commandName==='Swiss Battle'&&f.profileHint==='Swiss Pikemen'&&f.faction==='French'));
});

test('scenario rule parser rejects Studio meta-instructions but keeps actual mechanisms',()=>{
  const text=`# Battle of Example\n## Historical Events / Special-Rule Candidates\nThe following should be considered by the Scenario Builder as candidates for scenario-specific rules, not automatically imposed rules:\n**Prepared Position:** The ditch hinders assault movement and provides defensive benefit.\n**Delayed Artillery:** French artillery should initially be unavailable.`;
  const a=analyzeScenarioText(text);const titles=a.suggestions.map(x=>x.title);
  assert.ok(titles.includes('Prepared Position'));assert.ok(titles.includes('Delayed Artillery'));assert.ok(!titles.some(x=>/following should be considered|scenario builder/i.test(x)));
});

test('feature review supports designer names and regroups classified Geometry Explorer imports',()=>{
  const html=read('index.html'),feature=read('src/modules/featureReview.js');
  assert.match(html,/id="featureDisplayName"/);assert.match(feature,/categoryForClass/);assert.match(feature,/Topography/);assert.match(feature,/isGenericName/);assert.match(feature,/defaultNameFor/);
});

test('deployment exposes explicit Select Move and cancellable zone tools',()=>{
  const html=read('index.html'),deploy=read('src/modules/deploymentEditor.js');
  assert.match(html,/id="deploymentSelectMode"/);assert.match(html,/id="cancelDeploymentZone"/);assert.match(deploy,/beginZoneMode/);assert.match(deploy,/e\.key==='Escape'/);assert.match(deploy,/if\(zoneMode\)stopZoneMode\(\)/);
  assert.match(deploy,/dragPiece\.width\/2/);assert.match(deploy,/dragPiece\.height\/2/);
});

test('map authoring page warns when battlefield and authored map proportions disagree',()=>{
  const html=read('index.html'),main=read('src/main.js'),deploy=read('src/modules/deploymentEditor.js');
  assert.match(html,/aspectMismatchNotice/);assert.match(html,/matchMapAspect/);assert.match(main,/renderAspectNotice/);assert.match(main,/mapRatio/);assert.match(deploy,/Map proportions/);
});

test('suggested force composition renders unresolved formations as status, not fake command branches',()=>{
  const builder=read('src/modules/scenarioBuilder.js');
  assert.match(builder,/Command assignment uncertain/);assert.match(builder,/force-sketch-unassigned/);assert.match(builder,/Some formations still need a command assignment/);assert.doesNotMatch(builder,/name:'Command organization unresolved'/);
});
