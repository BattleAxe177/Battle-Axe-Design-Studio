import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createBlankScenario } from '../src/data/scenarioData.js';
import { createInitialState, loadState, saveState, STORAGE_KEY } from '../src/app/state.js';
import { analyzeScenarioText } from '../src/modules/scenarioAnalyzer.js';
import { registerEvidenceSides, sideForFaction, sideLabel } from '../src/modules/scenarioSides.js';
import { scenarioConfigFingerprint } from '../src/modules/playtestEngine.js';

const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
function memoryStorage(initial={}){const m=new Map(Object.entries(initial));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>m};}

test('force model has exactly two working sides and no Garrison/Other roster column',async()=>{
  const s=createBlankScenario(),html=await read('index.html');
  assert.deepEqual(Object.keys(s.commands),['French','Imperial']);
  assert.match(html,/id="rosterFrenchLabel">Side A/);
  assert.match(html,/id="rosterImperialLabel">Side B/);
  assert.doesNotMatch(html,/rosterGarrison|Garrison \/ Other/);
});

test('arbitrary historical armies map to two distinct sides without test-battle assumptions',()=>{
  const s=createBlankScenario();
  registerEvidenceSides(s,[{faction:'French'},{faction:'Spanish'}],[]);
  assert.equal(sideForFaction(s,'French'),'French');
  assert.equal(sideForFaction(s,'Spanish'),'Imperial');
  assert.equal(sideLabel(s,'French'),'French');
  assert.equal(sideLabel(s,'Imperial'),'Spanish');
  const other=createBlankScenario();
  registerEvidenceSides(other,[{faction:'Venetian'},{faction:'Milanese'}],[]);
  assert.notEqual(sideForFaction(other,'Venetian'),sideForFaction(other,'Milanese'));
});

test('garrison is extracted as a role inside its army rather than a third faction',()=>{
  const a=analyzeScenarioText(`Battle of Example\nSpanish Army\n- Garrison Arquebusiers — defenders of the town\nFrench Army\n- Gendarmes — cavalry`);
  const g=a.forces.find(x=>/Garrison Arquebusiers/i.test(x.name));
  assert.ok(g);
  assert.equal(g.faction,'Spanish');
  assert.equal(g.forceRole,'garrison');
});

test('project persistence includes active map, compiled geometry and battlefield revision',()=>{
  const storage=memoryStorage(),state=createInitialState();
  state.project.mapSource={kind:'local-svg',name:'Example.svg',svgText:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',battlefieldRevision:'bf-test'};
  state.project.battlefieldRevision='bf-test';state.project.features=[{id:'f1'}];state.project.candidates=[{id:'c1'}];
  saveState(state,storage);
  const loaded=loadState(storage).state;
  assert.equal(loaded.project.mapSource.name,'Example.svg');
  assert.equal(loaded.project.battlefieldRevision,'bf-test');
  assert.deepEqual(loaded.project.features,[{id:'f1'}]);
  assert.deepEqual(loaded.project.candidates,[{id:'c1'}]);
});

test('legacy third-side data is migrated into two-side model and explicitly flagged for review',()=>{
  const base=createInitialState();
  base.project.scenario.commands={French:[],Imperial:[],Garrison:[{id:'g1',name:'Town defenders',commander:'',units:[]}]};
  const storage=memoryStorage({[STORAGE_KEY]:JSON.stringify(base)}),loaded=loadState(storage).state.project.scenario;
  assert.deepEqual(Object.keys(loaded.commands),['French','Imperial']);
  assert.equal(loaded.commands.Imperial[0].forceRole,'garrison');
  assert.ok(loaded.unresolved.some(x=>/Legacy Garrison \/ Other/i.test(x)));
});

test('Generate Battlefield compiles, clips, revisions and invalidates dependent state before reload',async()=>{
  const main=await read('src/main.js');
  for(const token of ['loadInlineMapText','detectBattlefieldFeatures','applyPlayAreaViewBox','serializeBattlefieldSvg','newBattlefieldRevision','invalidateBattlefieldDependents','battlefieldRevision:revision','window.location.reload()'])assert.ok(main.includes(token),`missing ${token}`);
  assert.match(main,/detectBattlefieldFeatures\(svg,\{mapNotes:state\.project\.mapNotes,playSpace\}/);
});

test('all downstream battlefield views bind to the active project map instead of a Pavia fallback',async()=>{
  const files=['index.html','src/modules/geometryExplorer.js','src/modules/deploymentEditor.js','src/modules/playtestCenter.js','src/modules/scenarioPublisher.js'];
  for(const f of files){const text=await read(f);assert.doesNotMatch(text,/projects\/pavia\/battlefield\.svg/i,`${f} contains stale Pavia map fallback`);}
  const html=await read('index.html'),publisher=await read('src/modules/scenarioPublisher.js');
  for(const id of ['deploymentMapImage','geometryPreviewImage','playReplayMapImage'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(publisher,/battlefieldImageUrl/);
});

test('battlefield revision participates in stale-playtest fingerprint',()=>{
  const a=createInitialState(),b=createInitialState();
  a.project.battlefieldRevision='bf-a';b.project.battlefieldRevision='bf-b';
  assert.notEqual(scenarioConfigFingerprint(a),scenarioConfigFingerprint(b));
});

test('generic detector has play-area clipping and unrecognized-vector candidate fallback',async()=>{
  const d=await read('src/modules/battlefieldDetector.js');
  assert.match(d,/findBoundary\(svg,playSpace/);
  assert.match(d,/clone\.setAttribute\('viewBox'/);
  assert.match(d,/genericVectorCandidates/);
  assert.match(d,/Scenario-independent vector fallback/);
});

test('external AI protocol no longer advertises a third Garrison side',async()=>{
  const ai=await read('src/modules/aiBridge.js');
  assert.doesNotMatch(ai,/target_side":"French\|Imperial\|Garrison/);
  assert.match(ai,/scenario always has exactly two opposing sides/);
});
