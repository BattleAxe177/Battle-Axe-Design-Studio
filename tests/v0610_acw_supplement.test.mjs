import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankScenario} from '../src/data/scenarioData.js';
import {getEffectiveRuleset,listSupplements} from '../src/rules/ruleset.js';
import {AMERICAN_CIVIL_WAR_SUPPLEMENT as ACW} from '../src/rules/supplements/americanCivilWar.js';
import {buildRuntimeFromStudio,runPlaytest,__conformance} from '../src/modules/playtestEngine.js';

function acwScenario(){
  const s=createBlankScenario();
  s.ruleset={core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'1'};
  s.sideLabels={sideA:'Union',sideB:'Confederate'};
  s.sideAliases={Union:'sideA',union:'sideA',Confederate:'sideB',confederate:'sideB'};
  return s;
}

function engineUnit(overrides={}){
  return {id:'u',name:'Unit',profile:'Infantry',faction:'sideA',commandId:'c',x:2,y:5,facing:90,baseMm:25,move:2,combat:2,armor:5,points:1,traits:['Muskets'],damage:0,destroyed:false,inactive:false,...overrides};
}

function ctxFor(units,commanders=[]){
  const s=acwScenario(),rules=getEffectiveRuleset(s);
  return {rules,sideLabels:s.sideLabels,units,commanders,terrain:[],width:20,height:20,scale:1,tacticalPlan:{commands:{}},commandRelease:{},rng:{d6:()=>4,d3:()=>2},event:()=>{}};
}

test('ACW supplement is registered in selector architecture with canonical four-unit library',()=>{
  assert.ok(listSupplements().some(x=>x.id==='american-civil-war'));
  const r=getEffectiveRuleset(acwScenario());
  assert.equal(r.supplement.id,'american-civil-war');
  assert.deepEqual(r.unitLibrary.map(x=>x.profile),['Infantry','Sharpshooters','Cavalry','Cannons']);
  assert.deepEqual(r.unitLibrary.map(x=>[x.profile,x.m,x.c,x.a,x.pts]),[
    ['Infantry',2,2,5,1],['Sharpshooters',2,2,5,2],['Cavalry',4,2,4,1],['Cannons',1,1,5,2]
  ]);
});

test('ACW command competency uses 5+ and highest rating within one inch',()=>{
  assert.equal(ACW.commandRules.testThreshold,5);assert.equal(ACW.commandRules.influenceRangeInches,1);
  const u=engineUnit(),near={id:'cmd1',kind:'commander',name:'Brigadier',faction:'sideA',commandId:'c',x:2.5,y:5,commandRating:2,destroyed:false},far={id:'cmd2',kind:'commander',name:'Distant',faction:'sideA',commandId:'x',x:5.5,y:5,commandRating:3,destroyed:false};
  const cb=__conformance.commandBonus(u,ctxFor([u],[near,far]));
  assert.equal(cb.bonus,2);assert.equal(cb.commander.id,'cmd1');
});

test('ACW enfilade adds two shooting dice to musket fire',()=>{
  const a=engineUnit({id:'a',faction:'sideA',x:2,y:5,facing:90});
  const t=engineUnit({id:'t',faction:'sideB',x:6,y:5,facing:0,traits:['Muskets']});
  const legal=__conformance.canShoot(a,t,ctxFor([a,t]));
  assert.equal(legal.ok,true);assert.equal(legal.baseDice,3);assert.equal(legal.enfiladeBonus,2);assert.equal(legal.dice,5);
});

test('Rebel Yell adds one combat value only to charging Confederate Infantry',()=>{
  const conf=engineUnit({id:'csa',faction:'sideB',profile:'Infantry',chargedThisPhase:true});
  const union=engineUnit({id:'usa',faction:'sideA',profile:'Infantry',chargedThisPhase:true});
  const ctx=ctxFor([conf,union]);
  assert.equal(__conformance.effectiveCombatValue(conf,ctx),3);
  assert.equal(__conformance.effectiveCombatValue(union,ctx),2);
});

test('ACW cavalry enters the runtime mounted and the module defines dismounted move/fire behavior',()=>{
  const s=acwScenario();
  s.commands={sideA:[{id:'c',name:'Cavalry Brigade',commander:'Buford',commandRating:3,units:[{id:'cv',name:'1st Cavalry',profile:'Cavalry',traits:['Cavalry']}]}],sideB:[]};
  s.deployment={placements:{cv:{x:50,y:50,facing:0}},commanderPlacements:{c:{x:48,y:50}},zones:[]};
  const state={project:{playSpace:{width:20,height:20,units:'inches'},features:[],scenario:s},decisions:{}};
  const runtime=buildRuntimeFromStudio(state,{measurementScale:1});
  assert.equal(runtime.units[0].mounted,true);assert.equal(runtime.units[0].move,4);
  assert.equal(ACW.capabilities.acwMountedDismounted,true);
});


test('blank ACW command rating is generated from the period table at playtest setup',()=>{
  const s=acwScenario();
  s.commands={sideA:[{id:'c',name:'Infantry Brigade',commander:'Generic Brigadier',commandRating:null,units:[{id:'i',name:'Regiment',profile:'Infantry',traits:['Muskets']}]}],sideB:[]};
  s.deployment={placements:{i:{x:50,y:50,facing:0}},commanderPlacements:{c:{x:50,y:35}},zones:[]};
  const state={project:{playSpace:{width:20,height:20,units:'inches'},features:[],scenario:s},decisions:{}};
  const pre=buildRuntimeFromStudio(state,{measurementScale:1});assert.equal(pre.commanders[0].commandRating,null);
  const result=runPlaytest(state,{seed:17,turns:1,measurementScale:1});
  assert.match(result.finalCommanders[0].commandRatingSource,/generic Union D6 table/);
  assert.ok([0,1,2,3].includes(result.finalCommanders[0].commandRating));
});

test('ACW brigade composition and generic commander tables are encoded in the plugin',()=>{
  const infantry=ACW.forceStructure.brigadeTypes.find(x=>x.id==='infantry-brigade');
  const cavalry=ACW.forceStructure.brigadeTypes.find(x=>x.id==='cavalry-brigade');
  assert.deepEqual([infantry.primaryMin,infantry.primaryMax,infantry.optionalMax.Sharpshooters,infantry.optionalMax.Cannons],[2,8,1,2]);
  assert.deepEqual([cavalry.primaryMin,cavalry.primaryMax],[1,4]);
  assert.equal(ACW.forceStructure.armyMax.Sharpshooters,2);assert.equal(ACW.forceStructure.commanderPointCost,1);
  assert.deepEqual(ACW.commandRules.genericRatingTables.Union,{1:0,2:0,3:1,4:1,5:2,6:3});
  assert.deepEqual(ACW.commandRules.genericRatingTables.Confederate,{1:1,2:2,3:2,4:2,5:2,6:3});
});

test('ACW tactical doctrine is brigade-centric and fire-before-charge',()=>{
  assert.equal(ACW.aiDoctrine.brigadeCentric,true);assert.equal(ACW.aiDoctrine.fireBeforeCharge,true);
  assert.equal(ACW.aiDoctrine.skirmisherScreen,true);assert.equal(ACW.aiDoctrine.artilleryPreservation,true);assert.equal(ACW.aiDoctrine.cavalryDismount,true);
});
