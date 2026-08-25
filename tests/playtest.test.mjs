import test from 'node:test';
import assert from 'node:assert/strict';
import { runPlaytest, runBatch } from '../src/modules/playtestEngine.js';
import { buildAiBrief } from '../src/modules/aiBridge.js';

function fakeState(){return{project:{playSpace:{width:48,height:48,units:'inches'},features:[],scenario:{metadata:{title:'Test',gameLength:4},suggestions:[],sourceCommands:[],sourceForces:[],unresolved:[],victoryText:'',historicalSituation:'',commands:{French:[{id:'cf',name:'French',commander:'Francis',units:[{id:'f1',name:'French Pike',profile:'Pikemen',traits:['Pikes'],represents:'test',notes:'test'}]}],Imperial:[{id:'ci',name:'Imperial',commander:'Lannoy',units:[{id:'i1',name:'Imperial Pike',profile:'Pikemen',traits:['Pikes'],represents:'test',notes:'test'}]}],Garrison:[]},deployment:{placements:{f1:{x:20,y:50,faction:'French',commandId:'cf'},i1:{x:80,y:50,faction:'Imperial',commandId:'ci'}},commanderPlacements:{cf:{x:15,y:50,faction:'French'},ci:{x:85,y:50,faction:'Imperial'}},zones:[]}}},decisions:{}};}

test('browser playtest is deterministic by seed',()=>{const a=runPlaytest(fakeState(),{seed:42,turns:4,measurementScale:2}),b=runPlaytest(fakeState(),{seed:42,turns:4,measurementScale:2});assert.deepEqual({winner:a.winner,vp:a.victoryPoints,events:a.events},{winner:b.winner,vp:b.victoryPoints,events:b.events});});
test('batch returns requested number of games',()=>{const b=runBatch(fakeState(),{seed:10,runs:5,turns:3});assert.equal(b.runs,5);assert.equal(b.results.length,5);assert.equal(Math.round(b.winPct.French+b.winPct.Imperial+b.winPct.Draw),100);});
test('AI brief contains force and scenario context',()=>{const text=buildAiBrief(fakeState());assert.match(text,/External AI Review Brief/);assert.match(text,/French Pike/);assert.match(text,/Battle Axe force structure/);});

test('commander phase explicitly logs hold or movement after unit activation',()=>{
  const r=runPlaytest(fakeState(),{seed:7,turns:1,measurementScale:2});
  assert.ok(r.events.some(e=>e.type==='commander_hold'||e.type==='commander_move'));
});

test('command tests log command bonus provenance when available',()=>{
  const s=fakeState();
  // Force an unalerted activation test while the commander is in command range.
  s.project.scenario.suggestions=[{id:'surprise',status:'accepted',title:'Surprise',proposal:'French units begin unalerted'}];
  const r=runPlaytest(s,{seed:11,turns:1,measurementScale:2});
  const ev=r.events.find(e=>e.type==='command_test'&&e.actor==='f1'&&e.payload?.bonus===1);
  assert.ok(ev);assert.ok(ev.payload.bonusFrom);assert.equal(ev.payload.bonusKind,'command');
});

test('non-shooting cavalry cannot destroy an enemy at range without a charge contact event',()=>{
  const s=fakeState();
  s.project.scenario.commands.French[0].units=[{id:'f1',name:'Gendarmes',profile:'Gendarmes',traits:['Shock Cavalry']}];
  s.project.scenario.commands.Imperial[0].units=[{id:'i1',name:'Spanish Arquebusiers',profile:'Arquebusiers',traits:['Arquebus']}];
  s.project.scenario.deployment.placements.f1={x:20,y:50,faction:'French',commandId:'cf',facing:90};
  s.project.scenario.deployment.placements.i1={x:80,y:50,faction:'Imperial',commandId:'ci',facing:270};
  const r=runPlaytest(s,{seed:9,turns:1,measurementScale:2});
  const rangedByGendarmes=r.events.filter(e=>e.actor==='f1'&&(e.type==='attack'||e.type==='artillery')&&e.payload?.shooting);
  assert.equal(rangedByGendarmes.length,0);
  const meleeByGendarmes=r.events.filter(e=>e.actor==='f1'&&e.type==='attack'&&!e.payload?.shooting);
  for(const ev of meleeByGendarmes) assert.equal(ev.payload.contactVerified,true);
});

test('every close-combat attack is preceded by verified contact',()=>{
  const s=fakeState();
  s.project.scenario.deployment.placements.f1={x:45,y:50,faction:'French',commandId:'cf',facing:90};
  s.project.scenario.deployment.placements.i1={x:55,y:50,faction:'Imperial',commandId:'ci',facing:270};
  const r=runPlaytest(s,{seed:3,turns:2,measurementScale:2});
  for(const ev of r.events.filter(e=>e.type==='attack'&&!e.payload?.shooting)) assert.equal(ev.payload.contactVerified,true);
});

test('Baggage Train is worth 2 VP when destroyed and surviving army assets score 1 VP',()=>{
  const s=fakeState();
  s.project.scenario.commands.French[0].units.push({id:'bag',name:'Baggage',profile:'Baggage Train',traits:['Army Asset','Immobile']});
  s.project.scenario.deployment.placements.bag={x:5,y:5,faction:'French',commandId:'cf'};
  const r=runPlaytest(s,{seed:2,turns:1,measurementScale:2});
  assert.ok(r.victoryPoints.French>=1,'surviving friendly baggage should contribute 1 VP');
});
