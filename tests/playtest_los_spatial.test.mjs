import test from 'node:test';
import assert from 'node:assert/strict';
import { __conformance } from '../src/modules/playtestEngine.js';

let serial=0;
function actor(name,x,y,extra={}){return{id:extra.id||`los-${++serial}`,name,x,y,facing:extra.facing??0,baseMm:extra.baseMm??null,baseWidthMm:extra.baseWidthMm??25,baseDepthMm:extra.baseDepthMm??25,baseShape:extra.baseShape||'rect',kind:extra.kind||'unit',faction:extra.faction||'sideA',traits:[],destroyed:!!extra.destroyed,inactive:!!extra.inactive};}
function scene(extraUnits=[],commanders=[]){const shooter=actor('Shooter',5,7,{baseWidthMm:25,baseDepthMm:25}),target=actor('Target',5,2.2,{baseWidthMm:25,baseDepthMm:25,faction:'sideB'});return{shooter,target,ctx:{units:[shooter,...extraUnits,target],commanders,terrain:[],width:48,height:48}};}
function losPair(s){return{broad:__conformance.lineOfSight(s.shooter,s.target,s.ctx),exhaustive:__conformance.lineOfSightExhaustive(s.shooter,s.target,s.ctx)};}

test('LOS spatial broad phase preserves blocking and non-blocking unit results',()=>{
  const blocker=actor('Blocker',5,4.6,{baseWidthMm:50,baseDepthMm:50}),nearby=actor('Nearby but clear',7,4.6,{baseWidthMm:50,baseDepthMm:50}),s=scene([blocker,nearby]),result=losPair(s);
  assert.equal(result.broad.ok,false);assert.equal(result.broad.blockerId,blocker.id);assert.deepEqual({ok:result.broad.ok,blockerId:result.broad.blockerId},{ok:result.exhaustive.ok,blockerId:result.exhaustive.blockerId});
  blocker.x=8;const clear=losPair(s);assert.equal(clear.broad.ok,true);assert.equal(clear.exhaustive.ok,true);
});

test('LOS spatial query excludes a clearly distant actor and keeps relevant candidates',()=>{
  const blocker=actor('Blocker',5,4.6,{baseWidthMm:50,baseDepthMm:50}),distant=actor('Distant',35,35,{baseWidthMm:50,baseDepthMm:50}),s=scene([blocker,distant]),ids=__conformance.losBlockingCandidates({x:5,y:7},{x:5,y:2.2},s.ctx,new Set([s.shooter.id,s.target.id])).map(x=>x.actor.id);
  assert.ok(ids.includes(blocker.id));assert.ok(!ids.includes(distant.id));
});

test('LOS spatial index invalidates when a blocker moves into and out of the path',()=>{
  const mover=actor('Mover',9,4.6,{baseWidthMm:50,baseDepthMm:50}),s=scene([mover]);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);
  mover.x=5;__conformance.markLosSpatialChange(s.ctx,mover);let los=__conformance.lineOfSight(s.shooter,s.target,s.ctx);assert.equal(los.ok,false);assert.equal(los.blockerId,mover.id);
  mover.x=9;__conformance.markLosSpatialChange(s.ctx,mover);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);
});

test('LOS spatial index invalidates rectangular footprint facing changes',()=>{
  const rectangle=actor('Rectangular blocker',5.05,4.6,{baseWidthMm:40,baseDepthMm:5,facing:0}),s=scene([rectangle]);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,false);
  rectangle.facing=90;__conformance.markLosSpatialChange(s.ctx,rectangle);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);
});

test('destroyed and inactive actors leave and re-enter LOS participation correctly',()=>{
  const blocker=actor('Stateful blocker',5,4.6,{baseWidthMm:50,baseDepthMm:50}),s=scene([blocker]);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,false);
  blocker.destroyed=true;__conformance.markLosSpatialChange(s.ctx,blocker);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);
  blocker.destroyed=false;blocker.inactive=true;__conformance.markLosSpatialChange(s.ctx,blocker);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);
  blocker.inactive=false;__conformance.markLosSpatialChange(s.ctx,blocker);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,false);
});

test('commander blocking follows the same spatial invalidation rules',()=>{
  const commander=actor('Commander',5,4.6,{kind:'commander',baseShape:'circle',baseWidthMm:25,baseDepthMm:25}),s=scene([], [commander]);let los=__conformance.lineOfSight(s.shooter,s.target,s.ctx);assert.equal(los.ok,false);assert.equal(los.blockerId,commander.id);
  commander.x=9;__conformance.markLosSpatialChange(s.ctx,commander);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);commander.x=5;commander.destroyed=true;__conformance.markLosSpatialChange(s.ctx,commander);assert.equal(__conformance.lineOfSight(s.shooter,s.target,s.ctx).ok,true);
});

test('inactive reserve commanders are neither LOS blockers nor visible tactical targets',()=>{
  const reserve=actor('Reserve commander',-999,-999,{kind:'commander',baseShape:'circle',faction:'sideB',inactive:true}),s=scene([], [reserve]);assert.equal(__conformance.nearestVisibleEnemyActor(s.shooter,s.ctx).id,s.target.id);assert.ok(!__conformance.losBlockingCandidates({x:5,y:7},{x:-999,y:-999},s.ctx).some(x=>x.actor.id===reserve.id));
});

test('broad-phase and exhaustive LOS remain identical across deterministic actor arrangements',()=>{
  let seed=0x6a09e667;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let layout=0;layout<80;layout++){
    const actors=[];for(let i=0;i<30;i++)actors.push(actor(`Actor ${layout}-${i}`,random()*40+4,random()*40+4,{facing:random()*360,baseWidthMm:10+random()*90,baseDepthMm:10+random()*90,destroyed:random()<.08,inactive:random()<.08}));
    const s=scene(actors),b=__conformance.lineOfSight(s.shooter,s.target,s.ctx),e=__conformance.lineOfSightExhaustive(s.shooter,s.target,s.ctx);assert.deepEqual({ok:b.ok,reason:b.reason||null,blockerId:b.blockerId||null},{ok:e.ok,reason:e.reason||null,blockerId:e.blockerId||null},`layout ${layout}`);
  }
});
