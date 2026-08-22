import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { runPlaytest } from '../src/modules/playtestEngine.js';

const read=async()=>fs.readFile(new URL('../src/modules/playtestEngine.js',import.meta.url),'utf8');
function chargeState(){return{project:{playSpace:{width:48,height:48,units:'inches'},features:[],scenario:{metadata:{title:'Charge',gameLength:1},suggestions:[],sourceCommands:[],sourceForces:[],unresolved:[],victoryText:'',historicalSituation:'',commands:{French:[{id:'cf',name:'French',commander:'',units:[{id:'f',name:'Gendarmes',profile:'Gendarmes',traits:['Shock Cavalry']}]}],Imperial:[{id:'ci',name:'Imperial',commander:'',units:[{id:'i',name:'Spanish Arquebusiers',profile:'Arquebusiers',traits:['Arquebus']}]}],Garrison:[]},deployment:{placements:{f:{x:40,y:50,faction:'French',commandId:'cf',facing:90},i:{x:52,y:53,faction:'Imperial',commandId:'ci',facing:270}},commanderPlacements:{},zones:[]}}},decisions:{}};}

test('charge establishes contact then conforms flush to defender edge as a free post-contact move',()=>{
  const r=runPlaytest(chargeState(),{seed:1,turns:1,measurementScale:2});
  const contact=r.events.find(e=>e.type==='charge_contact'&&e.actor==='f');
  const conform=r.events.find(e=>e.type==='charge_conform'&&e.actor==='f');
  const charge=r.events.find(e=>e.type==='charge'&&e.actor==='f');
  assert.ok(contact); assert.ok(conform); assert.ok(charge);
  assert.equal(conform.payload.conformIsFree,true);
  assert.equal(conform.payload.mayExceedMovementAllowance,true);
  assert.ok(conform.payload.defenderEdge);
  assert.equal(charge.payload.contactEstablished,true);
});

test('movement and LOS rules expose core-rule geometry constraints',async()=>{
  const js=await read();
  assert.match(js,/wheelLegality/);
  assert.match(js,/wheelAroundFrontCorner/);
  assert.match(js,/sideways-right|sideways-left/);
  assert.match(js,/halfSpeed/);
  assert.match(js,/straightAfterWheel:geometryMode==='forward'/);
  assert.match(js,/enemy 1-inch exclusion/);
  assert.match(js,/front-edge line/);
  assert.match(js,/tallEndpoint/);
});

test('Italian Wars period rules are represented in the browser engine',async()=>{
  const js=await read();
  assert.match(js,/pikeShotTransitAllowed/);
  assert.match(js,/Swiss units may not charge other Swiss units/);
  assert.match(js,/specialAction:'Skirmish'/);
  assert.match(js,/pikesActive/);
  assert.doesNotMatch(js,/if\(pike&&r===1\)/);
  assert.match(js,/Pistols before charge contact/);
  assert.match(js,/counterCharge/);
  assert.match(js,/artillery_destroyed_on_contact/);
  assert.match(js,/Spanish Tercio/);
});

test('unsupported Big Battles second-move shortcut is removed',async()=>{
  const js=await read();
  assert.doesNotMatch(js,/big_battle_second_move/);
});
