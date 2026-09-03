import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { detectForceHierarchy } from '../src/modules/scenarioAnalyzer.js';
import { buildAutoTacticalPlan, interpretOrderText, runPlaytest, scenarioConfigFingerprint } from '../src/modules/playtestEngine.js';

const read=async p=>fs.readFile(new URL(p,import.meta.url),'utf8');

function defensiveState(){return{project:{playSpace:{width:48,height:48,units:'inches'},features:[{id:'works',name:'Prepared Works',cls:'Fortification',box:[72,40,18,20]}],scenario:{metadata:{title:'Generic prepared-position test',gameLength:1},tabletop:{unitBaseMm:50,commanderBaseMm:25,measurementMultiplier:2},suggestions:[],sourceCommands:[],sourceForces:[],unresolved:[],victoryText:'',historicalSituation:'',commands:{sideA:[{id:'cf',name:'Attackers',commander:'',units:[{id:'f',name:'Attacking Pike',profile:'Pikemen',traits:['Pikes']}]}],sideB:[{id:'ci',name:'Defenders',commander:'',units:[{id:'i',name:'Defending Shot',profile:'Arquebusiers',traits:['Arquebus']}]}]},deployment:{placements:{f:{x:20,y:50,faction:'sideA',commandId:'cf',facing:90},i:{x:80,y:50,faction:'sideB',commandId:'ci',facing:270}},commanderPlacements:{},zones:[]}}},decisions:{works:{status:'approved',cls:'Fortification',effects:['Defensive']}}};}

test('hierarchy parser preserves commander-in-chief and subordinate command relationships',()=>{
  const text=`# Battle of Test\n## Spanish Army\nCommander-in-Chief: Gonzalo Fernández de Córdoba\n### Córdoba's Reserve\nCommander: Gonzalo Fernández de Córdoba\n- Spanish men-at-arms\n### Zamudio's German Centre\nCommander: Zamudio\n- Approximately 2,500 German Landsknechts\n## French Army\nCommander-in-Chief: Louis d'Armagnac, Duke of Nemours\n### Rearguard\nCommander: Yves d'Alègre\n- French gendarmes`;
  const h=detectForceHierarchy(text);
  assert.equal(h.armyCommanders.Spanish,'Gonzalo Fernández de Córdoba');
  assert.equal(h.armyCommanders.French,'Louis d\'Armagnac, Duke of Nemours');
  const zam=h.commands.find(c=>/Zamudio/.test(c.name));assert.ok(zam);assert.equal(zam.commander,'Zamudio');assert.equal(zam.armyCommander,'Gonzalo Fernández de Córdoba');
  const land=h.forces.find(f=>f.profileHint==='Landsknechts');assert.equal(land.commandId,zam.id);assert.equal(land.commander,'Zamudio');
  const rear=h.commands.find(c=>c.name==='Rearguard');assert.equal(rear.commander,"Yves d'Alègre");assert.equal(rear.armyCommander,"Louis d'Armagnac, Duke of Nemours");
});

test('free-text tactical intent becomes bounded structured modifiers',()=>{
  const x=interpretOrderText('Remain behind the earthworks, fire, and counterattack after the enemy crosses the ditch. Do not pursue.');
  assert.equal(x.preservePosition,2);assert.equal(x.preferShoot,2);assert.equal(x.counterattack,true);assert.equal(x.holdUntilEnemyClose,true);assert.equal(x.noPursuit,true);assert.ok(x.summary.length>=4);
});

test('zero-input Auto plan recognizes a prepared defense and holds it',()=>{
  const s=defensiveState(),plan=buildAutoTacticalPlan(s,{measurementScale:2});
  assert.equal(plan.armies.sideB.autoPosture,'Defensive');assert.equal(plan.armies.sideA.autoPosture,'Offensive');assert.equal(plan.commands.ci.autoOrder,'Hold');
  const r=runPlaytest(s,{seed:1,turns:1,measurementScale:2});
  const firstDefenderChoice=r.events.find(e=>e.type==='ai_action_choice'&&e.actor==='i');assert.equal(firstDefenderChoice.payload.action,'hold');assert.ok(r.events.some(e=>e.type==='ai_hold'&&e.actor==='i'));
  assert.equal(r.events.some(e=>e.type==='move'&&e.actor==='i'),false);
});

test('playtest orders are workspace preferences and do not change scenario fingerprint',()=>{
  const s=defensiveState(),a=scenarioConfigFingerprint(s);s.playtestWorkspace={armyOrders:{sideB:{posture:'Defensive',text:'hold position'}},commandOrders:{ci:{order:'Hold',text:'do not pursue'}},cueLevel:'detailed'};const b=scenarioConfigFingerprint(s);assert.equal(a,b);
});

test('decision scoring does not consume the rules RNG merely to break AI ties',async()=>{
  const js=await read('../src/modules/playtestEngine.js');assert.doesNotMatch(js,/score\+=ctx\.rng\.float\(\)\*3/);assert.match(js,/Decision tie-breaking must not consume the combat\/command-test RNG stream/);
});

test('deployment repositioning preserves the pickup offset instead of snapping center to pointer',async()=>{
  const js=await read('../src/modules/deploymentEditor.js');assert.match(js,/pointerStart/);assert.match(js,/origin:/);assert.match(js,/dragPiece\.last/);assert.match(js,/clampPiecePoint/);assert.match(js,/pointercancel/);
});

test('terrain bulk-action controls stay sticky while feature rows scroll',async()=>{
  const css=await read('../src/styles/app.css');assert.match(css,/\.feature-list>\.panel-heading\{position:sticky/);assert.match(css,/\.feature-list>\.bulk-bar\{position:sticky/);
});

test('playtest UI exposes optional Auto orders and replay visual-cue controls',async()=>{
  const [html,center,css]=await Promise.all([read('../index.html'),read('../src/modules/playtestCenter.js'),read('../src/styles/app.css')]);
  assert.match(html,/id="tacticalPlanEditor"/);assert.match(html,/id="replayCueLevel"/);assert.match(html,/id="playReplayEvents"/);
  assert.match(center,/ARMY_POSTURES=\['Auto'/);assert.match(center,/COMMAND_ORDERS=\['Auto'/);assert.match(center,/command-flag/);assert.match(center,/smoke/);assert.match(center,/replay-cue-arrow/);assert.match(center,/melee/);assert.match(center,/destroyed-cue/);assert.match(center,/active-event/);
  assert.match(css,/\.command-flag\.pass:after\{background:#35c86f\}/);assert.match(css,/\.command-flag\.fail:after\{background:#df4349\}/);assert.match(css,/\.play-replay-events\{position:absolute/);
});
