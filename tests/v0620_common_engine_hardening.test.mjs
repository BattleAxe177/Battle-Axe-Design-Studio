import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {footprintsPenetrate,footprintsTouchOrOverlap,footprintInsideBattlefield,footprintSpec} from '../src/modules/footprintGeometry.js';
import {dragCenterFromGrab} from '../src/modules/deploymentEditor.js';
import {migrateImportedProject} from '../src/app/state.js';
import {createBlankScenario} from '../src/data/scenarioData.js';
import {getEffectiveRuleset} from '../src/rules/ruleset.js';
import {__conformance} from '../src/modules/playtestEngine.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fixture=name=>JSON.parse(fs.readFileSync(path.join(here,'fixtures',name),'utf8'));

function unit(overrides={}){return{id:'u',kind:'unit',name:'Unit',profile:'Infantry',faction:'French',commandId:'c',x:5,y:5,facing:0,baseMm:50,baseWidthMm:50,baseDepthMm:50,baseShape:'rect',move:2,combat:2,armor:5,points:1,traits:[],damage:0,destroyed:false,inactive:false,...overrides};}
function ctx(units,commanders=[]){const s=createBlankScenario();s.ruleset={...s.ruleset,supplement:'american-civil-war'};return{rules:getEffectiveRuleset(s),units,commanders,terrain:[],width:20,height:20,scale:1,tacticalPlan:{commands:{}},commandRelease:{},turn:2,rng:{d6:()=>4,d3:()=>2},event:()=>{}};}

test('authoritative footprint geometry treats edge touch as legal and polygon penetration as illegal for 50 mm bases',()=>{
  const width=footprintSpec(unit()).width;
  const a=unit({id:'a',x:5,y:5});
  const touch=unit({id:'b',x:5+width,y:5});
  assert.equal(footprintsPenetrate(a,touch),false,'exact edge touch must remain legal');
  const overlap={...touch,x:touch.x-.01};
  assert.equal(footprintsPenetrate(a,overlap),true,'visible penetration must be rejected');
  const rotated=unit({id:'r',x:5+width*.7,y:5,facing:45});
  assert.equal(footprintsPenetrate(a,rotated),true,'rotated penetration must use polygon geometry');
  assert.equal(footprintInsideBattlefield(unit({x:width/2,y:width/2}),20,20),true);
  assert.equal(footprintInsideBattlefield(unit({x:width/2-.02,y:width/2}),20,20),false,'entire rotated footprint must remain on table');
});

test('shared charge geometry can carry a 50 x 25 mm rectangular regiment without penetrating at first contact',()=>{
  const charger=unit({id:'rect-a',x:5,y:8,facing:0,baseWidthMm:50,baseDepthMm:25}),target=unit({id:'rect-b',faction:'Imperial',commandId:'enemy',x:5,y:5.1,facing:180,baseWidthMm:50,baseDepthMm:25}),c=ctx([charger,target]);
  const legal=__conformance.canCharge(charger,target,c);assert.equal(legal.ok,true);
  const contact={...charger,x:legal.contactCenter.x,y:legal.contactCenter.y,facing:legal.facing};
  assert.equal(footprintsPenetrate(contact,target),false,'first contact may touch but may not penetrate');
  assert.equal(footprintsTouchOrOverlap(contact,target,{},1e-4),true,'first contact should establish base touch');
});

test('deployment drag helper preserves the exact local grab point through arbitrary pointer movement',()=>{
  const origin={x:40,y:40,facing:37},pointerStart={x:42.7,y:36.2},pointerNow={x:51.3,y:44.8};
  const end=dragCenterFromGrab(origin,pointerStart,pointerNow);
  assert.deepEqual(end,{x:48.599999999999994,y:48.599999999999994,facing:37});
  assert.ok(Math.abs((pointerNow.x-end.x)-(pointerStart.x-origin.x))<1e-9);
  assert.ok(Math.abs((pointerNow.y-end.y)-(pointerStart.y-origin.y))<1e-9);
  const src=read('src/modules/deploymentEditor.js');
  assert.match(src,/pctFromEvent\(e,dragFrameRect,false\)/,'grab coordinates must not be clamped to the frame');
  assert.match(src,/placementClear\(dragPiece\.kind,dragPiece\.id,p\)\?p:dragPiece\.origin/,'illegal drops revert rather than snap/substitute');
});

test('universal post-action assertion rejects overlap and restores previous positional state',()=>{
  const a=unit({id:'a',x:5,y:5}),b=unit({id:'b',x:8,y:5}),events=[],c=ctx([a,b]);c.event=(type,actor,payload)=>events.push({type,actor:actor.id,payload});
  const before={x:a.x,y:a.y,facing:a.facing};a.x=b.x;a.y=b.y;
  const ok=__conformance.postActionAssertion(a,before,c,'test_move');
  assert.equal(ok,false);assert.deepEqual({x:a.x,y:a.y,facing:a.facing},before);
  assert.equal(events.at(-1).type,'state_assertion_revert');assert.equal(events.at(-1).payload.blocker,'b');
});

test('reserve release latches at command level for all subordinate units',()=>{
  const a=unit({id:'a',commandId:'brig'}),b=unit({id:'b',commandId:'brig',x:6}),c=ctx([a,b]);
  assert.equal(__conformance.reserveReleased(a,c,{},1),true);
  assert.equal(c.commandRelease.brig.latched,true);
  assert.equal(__conformance.reserveReleased(b,c,{},99),true,'release may not flicker off for another unit in same command');
});

test('screen orders create distinct frontage destinations rather than a single shared point',()=>{
  const a=unit({id:'a',commandId:'brig',x:4,y:8,role:'skirmisher'}),b=unit({id:'b',commandId:'brig',x:5,y:8,role:'skirmisher'}),line=unit({id:'line',commandId:'brig',x:5,y:10}),enemy=unit({id:'e',faction:'Imperial',commandId:'enemy',x:5,y:2});
  const c=ctx([a,b,line,enemy]);
  const ta=__conformance.screenFrontageTarget(a,c,enemy,{skirmishersOnly:true}),tb=__conformance.screenFrontageTarget(b,c,enemy,{skirmishersOnly:true});
  assert.notDeepEqual(ta,tb);assert.notEqual(ta.x,tb.x);
});

test('offensive activation order assigns waves and moves a friendly lane blocker ahead of the blocked regiment',()=>{
  const rear=unit({id:'rear',commandId:'brig',x:5,y:10,facing:0}),front=unit({id:'front',commandId:'brig',x:5,y:7,facing:0}),enemy=unit({id:'enemy',faction:'Imperial',commandId:'enemy',x:5,y:1});
  const c=ctx([rear,front,enemy]);c.tacticalPlan.commands.brig={commandId:'brig',order:'Advance',modifiers:{}};
  const ordered=__conformance.activationOrderForSide('French',c);
  assert.equal(ordered[0].id,'front');assert.equal(front.maneuverWave,1);assert.match(front.maneuverRole,/first wave/);
  assert.ok(rear.maneuverWave>=1);
});

test('legacy scenario-only JSON is migrated before validation with defaults and unknown scenario fields preserved',()=>{
  const old=fixture('legacy_alpha_rosters.json'),m=migrateImportedProject(old);
  assert.equal(m.state.project.scenario.metadata.title,'Legacy Alpha Scenario');
  assert.equal(m.state.project.scenario.commands.French[0].units[0].id,'f1');
  assert.equal(m.state.project.scenario.legacyMysteryField.preserve,true);
  assert.ok(m.migration.steps.some(x=>/validated migrated project/.test(x)));
  assert.ok(m.migration.warnings.length>0);
});

test('legacy wrapped project is migrated in memory without discarding battlefield dimensions or scenario extensions',()=>{
  const old=fixture('legacy_053_project.json'),m=migrateImportedProject(old);
  assert.deepEqual([m.state.project.playSpace.width,m.state.project.playSpace.height],[24,12]);
  assert.equal(m.state.project.scenario.legacyScenarioNote,'keep me');
  assert.equal(m.state.decisions['legacy-feature'].status,'approved');
  assert.equal(m.migration.sourceVersion,'0.5.3.0');
});

test('Deployment, Playtest replay, and Publisher all consume shared footprint rendering/collision geometry',()=>{
  const dep=read('src/modules/deploymentEditor.js'),engine=read('src/modules/playtestEngine.js'),replay=read('src/modules/playtestCenter.js'),publisher=read('src/modules/scenarioPublisher.js');
  assert.match(dep,/footprintsPenetrate/);assert.match(dep,/footprintInsideBattlefield/);assert.match(dep,/footprintPercentFromSpec/);
  assert.match(engine,/footprintsPenetrate/);assert.match(engine,/footprintInsideBattlefield/);
  assert.match(replay,/footprintPercentFromSpec/);assert.match(publisher,/footprintPercentFromSpec/);
});

test('shared engine diagnostics contain conform translation and reason-code fields',()=>{
  const src=read('src/modules/playtestEngine.js');
  assert.match(src,/conformTranslation:0/);
  assert.match(src,/ruleReasonCodes/);
  assert.match(src,/attackCountDerivation/);
  assert.match(src,/state_assertion_revert/);
});

test('deployment modal tools have explicit Cancel and Escape exit paths',()=>{
  const src=read('src/modules/deploymentEditor.js');
  assert.match(src,/cancelDeploymentTool/);assert.match(src,/e\.key==='Escape'&&zoneMode/);
});
