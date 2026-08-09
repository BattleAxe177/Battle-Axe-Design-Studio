import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { runPlaytest, __conformance } from '../src/modules/playtestEngine.js';
import { CORE_RULESET } from '../src/rules/coreRules.js';

const read=async()=>fs.readFile(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');

function commanderScenario(){return{project:{playSpace:{width:48,height:48,units:'inches'},features:[],scenario:{ruleset:{core:'battle-axe-core',supplement:'italian-wars',supplementVersion:'1'},metadata:{title:'Commander test',gameLength:1},suggestions:[],sourceCommands:[],sourceForces:[],unresolved:[],victoryText:'',historicalSituation:'',commands:{French:[{id:'cf',name:'French Royal',commander:'Francis I',isGeneral:true,units:[{id:'f1',name:'French Pike',profile:'Pikemen',traits:['Pikes']}]}],Imperial:[{id:'ci',name:'Imperial Cavalry',commander:'Lannoy',isGeneral:true,units:[{id:'i1',name:'Imperial Knights',profile:'Knights',traits:['Shock Cavalry']}]}],Garrison:[]},deployment:{placements:{f1:{x:10,y:50,faction:'French',commandId:'cf',facing:90},i1:{x:58,y:50,faction:'Imperial',commandId:'ci',facing:270}},commanderPlacements:{cf:{x:50,y:50,faction:'French'},ci:{x:90,y:80,faction:'Imperial'}},zones:[]}}},decisions:{}};}

test('Core commander model records no shooting, nearest-visible charge restriction, escape/capture and VP values',async()=>{
  assert.equal(CORE_RULESET.command.cannotBeShot,true);
  assert.equal(CORE_RULESET.command.chargeOnlyIfNearestVisible,true);
  assert.equal(CORE_RULESET.command.commanderVictoryPoints,2);
  assert.equal(CORE_RULESET.command.generalVictoryPoints,3);
  let escape=null,capture=null;
  for(let seed=1;seed<=80&&(!escape||!capture);seed++){
    const r=runPlaytest(commanderScenario(),{seed,turns:1,measurementScale:2});
    escape ||= r.events.find(e=>e.type==='commander_escape');
    capture ||= r.events.find(e=>e.type==='commander_destroyed');
    assert.equal(r.events.some(e=>e.type==='attack'&&e.payload?.target==='cmd-cf'&&e.payload?.shooting),false);
  }
  assert.ok(escape,'at least one deterministic seed should produce commander escape');
  assert.ok(capture,'at least one deterministic seed should produce commander capture/destruction');
  assert.equal(capture.payload.victoryPoints,3,'Francis is marked as the General in this test');
});

test('linear Defensive terrain applies only when the attack crosses the manned feature',()=>{
  const target={id:'t',name:'Defender',faction:'French',x:10,y:10,facing:0,baseMm:50,armor:4,traits:[],destroyed:false,inactive:false};
  const left={id:'a',name:'Attacker west',faction:'Imperial',x:7,y:10,facing:90,baseMm:50,armor:5,traits:[],destroyed:false,inactive:false};
  const right={id:'b',name:'Attacker east',faction:'Imperial',x:13,y:10,facing:270,baseMm:50,armor:5,traits:[],destroyed:false,inactive:false};
  const ctx={units:[target,left,right],terrain:[{id:'wall',name:'Wall',cls:'Masonry Wall',effects:new Set(['Defensive']),parts:[{closed:false,points:[{x:9,y:7},{x:9,y:13}]}]}]};
  const across=__conformance.defenseState(target,ctx,left),openSide=__conformance.defenseState(target,ctx,right);
  assert.equal(across.defensive,true);assert.equal(across.effectiveArmor,6);assert.equal(across.defensiveSource,'Linear Defensive Terrain');
  assert.equal(openSide.defensive,false);assert.equal(openSide.effectiveArmor,4);
});

test('Dangerous terrain is checked from the actual traversed path',()=>{
  const u={id:'u',name:'Unit',faction:'French',x:0,y:0,baseMm:50,traits:[],destroyed:false};
  const events=[];const ctx={terrain:[{id:'stakes',name:'Stakes',effects:new Set(['Dangerous']),parts:[{closed:false,points:[{x:1,y:-2},{x:1,y:2}]}]}],rng:{d6:()=>1},event:(type,actor,payload)=>events.push({type,payload})};
  const survived=__conformance.applyDangerTestForPath(u,{x:0,y:0},{x:2,y:0},ctx,'test move');
  assert.equal(survived,false);assert.equal(u.destroyed,true);assert.ok(events.some(e=>e.type==='danger_test'));assert.ok(events.some(e=>e.type==='unit_destroyed'));
});

test('Phase 3 separates legal action generation from tactical choice and does not invent general recoil/retreat',async()=>{
  const js=await read();
  assert.match(js,/function legalActionsForUnit/);assert.match(js,/function chooseTacticalAction/);assert.match(js,/function executeAction/);assert.match(js,/ai_action_choice/);
  assert.equal(CORE_RULESET.combat.generalRetreatOrRecoil,false);
  assert.doesNotMatch(js,/event\(['\"](?:retreat|recoil)['\"]/i);
});

test('Shock Cavalry counter-charge is a straight-forward D3 supplement move',async()=>{
  const js=await read();
  assert.match(js,/straightForward:true/);
  assert.match(js,/const d3=ctx\.rng\.d3\(\).*dir=forwardVec\(defender\.facing\)/s);
});

test('commander movement occurs after activations but before the close-combat phase',async()=>{
  const js=await read();
  assert.match(js,/activate\(u,ctx,runtime\.unalerted\);moveCommandersForSide\(side,ctx\);resolveCloseCombat\(side,ctx\)/);
});
