import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBlankScenario} from '../src/data/scenarioData.js';
import {migrateScenario} from '../src/app/state.js';
import {footprintSpec,footprintsPenetrate,footprintInsideBattlefield,footprintGapDistance} from '../src/modules/footprintGeometry.js';
import {getEffectiveRuleset} from '../src/rules/ruleset.js';
import {AMERICAN_CIVIL_WAR_SUPPLEMENT as ACW} from '../src/rules/supplements/americanCivilWar.js';
import {buildRuntimeFromStudio,runPlaytest,__conformance} from '../src/modules/playtestEngine.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const inch=mm=>mm/25.4;

function acwScenario(){
  const s=createBlankScenario();
  s.ruleset={core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'1'};
  s.sideLabels={French:'Union',Imperial:'Confederate'};
  s.tabletop={...s.tabletop,preset:'acw-regiment',unitBaseMm:50,unitBaseWidthMm:50,unitBaseDepthMm:25,commanderBaseMm:25,measurementMultiplier:1};
  return s;
}

function runtimeState({override=false}={}){
  const s=acwScenario();
  s.commands={
    French:[{id:'u-brig',name:'Union Brigade',commander:'Union Brigadier',commandRating:2,units:[
      {id:'u1',name:'1st Regiment',profile:'Infantry',...(override?{baseWidthMm:40,baseDepthMm:20}:{})},
      {id:'u2',name:'2nd Regiment',profile:'Infantry'}
    ]}],
    Imperial:[{id:'c-brig',name:'Confederate Brigade',commander:'Confederate Brigadier',commandRating:2,units:[{id:'c1',name:'CS Regiment',profile:'Infantry'}]}]
  };
  s.deployment={placements:{u1:{x:25,y:70,facing:0},u2:{x:35,y:70,facing:0},c1:{x:30,y:20,facing:180}},commanderPlacements:{'u-brig':{x:20,y:70,facing:0},'c-brig':{x:25,y:20,facing:180}},zones:[]};
  return {project:{playSpace:{width:20,height:20,units:'inches',origin:'northwest'},features:[],scenario:s},decisions:{}};
}

function rect(overrides={}){
  return {id:'r',kind:'unit',x:5,y:5,facing:0,baseWidthMm:50,baseDepthMm:25,baseShape:'rect',...overrides};
}

test('legacy square basing migrates to explicit width/depth without changing its footprint',()=>{
  const migrated=migrateScenario({tabletop:{unitBaseMm:50}});
  assert.equal(migrated.tabletop.unitBaseWidthMm,50);
  assert.equal(migrated.tabletop.unitBaseDepthMm,50);
  assert.equal(migrated.tabletop.unitBaseMm,50);
  const rectangular=migrateScenario({tabletop:{unitBaseMm:50,unitBaseWidthMm:50,unitBaseDepthMm:25}});
  assert.equal(rectangular.tabletop.unitBaseWidthMm,50);
  assert.equal(rectangular.tabletop.unitBaseDepthMm,25);
});

test('shared geometry treats 50x25 mm as frontage by depth and remains rotation-aware',()=>{
  const spec=footprintSpec({}, {unitBaseWidthMm:50,unitBaseDepthMm:25,unitBaseMm:50});
  assert.ok(Math.abs(spec.width-inch(50))<1e-9);
  assert.ok(Math.abs(spec.depth-inch(25))<1e-9);
  const a=rect({id:'a'}),touch=rect({id:'b',x:5+inch(50)}),penetrating=rect({id:'c',x:5+inch(50)-.01});
  assert.equal(footprintsPenetrate(a,touch),false,'edge touch must be legal');
  assert.equal(footprintsPenetrate(a,penetrating),true,'actual penetration must be illegal');
  const rotated=rect({x:inch(25)/2,y:inch(50)/2,facing:90});
  assert.equal(footprintInsideBattlefield(rotated,20,20),true,'90-degree rotation swaps the physical extents correctly');
  assert.equal(footprintInsideBattlefield({...rotated,y:inch(50)/2-.02},20,20),false,'the full rotated rectangle must remain on table');
});

test('explicit legacy or fixed-size baseMm remains square under a rectangular scenario default',()=>{
  const spec=footprintSpec({baseMm:40},{unitBaseMm:50,unitBaseWidthMm:50,unitBaseDepthMm:25});
  assert.ok(Math.abs(spec.width-inch(40))<1e-9);
  assert.ok(Math.abs(spec.depth-inch(40))<1e-9);
});

test('runtime inherits scenario rectangular basing and respects per-unit overrides',()=>{
  const normal=buildRuntimeFromStudio(runtimeState(),{measurementScale:1});
  const u1=normal.units.find(u=>u.id==='u1');
  assert.deepEqual([u1.baseWidthMm,u1.baseDepthMm],[50,25]);
  const mixed=buildRuntimeFromStudio(runtimeState({override:true}),{measurementScale:1});
  const o=mixed.units.find(u=>u.id==='u1'),inherited=mixed.units.find(u=>u.id==='u2');
  assert.deepEqual([o.baseWidthMm,o.baseDepthMm],[40,20]);
  assert.deepEqual([inherited.baseWidthMm,inherited.baseDepthMm],[50,25]);
});

test('base-size changes cannot silently start a playtest with overlapping or off-table footprints',()=>{
  const state=runtimeState();
  state.project.scenario.deployment.placements.u2={...state.project.scenario.deployment.placements.u1};
  const rt=buildRuntimeFromStudio(state,{measurementScale:1});
  assert.ok(rt.deploymentIssues.some(x=>x.kind==='overlap'&&/1st Regiment|2nd Regiment/.test(x.message)));
  assert.throws(()=>runPlaytest(state,{seed:1,turns:1,measurementScale:1}),err=>err?.code==='BAX_INVALID_DEPLOYMENT'&&err?.diagnostic?.issueCount>=1);
});

test('ACW plugin exposes the published four-unit library and a non-RAW 50x25 Studio recommendation',()=>{
  assert.deepEqual(ACW.unitLibrary.map(u=>[u.profile,u.m,u.c,u.a,u.pts,u.traits]),[
    ['Infantry',2,2,5,1,['Muskets']],
    ['Sharpshooters',2,2,5,2,['Rifles']],
    ['Cavalry',4,2,4,1,['Cavalry']],
    ['Cannons',1,1,5,2,['Artillery']]
  ]);
  assert.deepEqual([ACW.recommendedTabletop.unitBaseWidthMm,ACW.recommendedTabletop.unitBaseDepthMm,ACW.recommendedTabletop.commanderBaseMm,ACW.recommendedTabletop.measurementMultiplier],[50,25,25,1]);
  assert.match(ACW.recommendedTabletop.note,/Studio basing preset only/i);
});

test('ACW command influence uses physical edge gap, not center distance',()=>{
  const s=acwScenario(),rules=getEffectiveRuleset(s);
  const unit={id:'u',kind:'unit',name:'Regiment',profile:'Infantry',faction:'French',commandId:'brig',x:5,y:5,facing:0,baseWidthMm:50,baseDepthMm:25,baseShape:'rect',traits:['Muskets']};
  const commander={id:'cmd',kind:'commander',name:'Brigadier',faction:'French',commandId:'brig',x:7.2,y:5,facing:0,baseMm:25,baseWidthMm:25,baseDepthMm:25,baseShape:'circle',commandRating:2,destroyed:false};
  const centerDistance=Math.hypot(unit.x-commander.x,unit.y-commander.y);
  const edgeGap=footprintGapDistance(unit,commander);
  assert.ok(centerDistance>1,'setup must be outside one inch by centers');
  assert.ok(edgeGap<=1,'setup must be within one inch by physical base edges');
  const ctx={rules,sideLabels:s.sideLabels,units:[unit],commanders:[commander],terrain:[],width:20,height:20,scale:1,tacticalPlan:{commands:{}},commandRelease:{},rng:{d6:()=>3,d3:()=>2},event:()=>{}};
  const bonus=__conformance.commandBonus(unit,ctx);
  assert.equal(bonus.commander?.id,'cmd');
  assert.equal(bonus.bonus,2);
});

test('ACW brigade-line AI assigns separate frontage slots and successive-wave depth using real base dimensions',()=>{
  const s=acwScenario(),rules=getEffectiveRuleset(s);
  const common={kind:'unit',profile:'Infantry',faction:'French',commandId:'brig',facing:0,baseWidthMm:50,baseDepthMm:25,baseShape:'rect',traits:['Muskets'],damage:0,destroyed:false,inactive:false,role:'infantry'};
  const a={...common,id:'a',name:'A',x:4,y:12,maneuverWave:1},b={...common,id:'b',name:'B',x:6,y:12,maneuverWave:1},reserve={...common,id:'r',name:'R',x:5,y:14,maneuverWave:2};
  const enemy={...common,id:'e',name:'Enemy',faction:'Imperial',commandId:'enemy',x:5,y:3,facing:180};
  const ctx={rules,sideLabels:s.sideLabels,units:[a,b,reserve,enemy],commanders:[],terrain:[],width:20,height:20,scale:1,tacticalPlan:{commands:{}},commandRelease:{}};
  const ta=__conformance.brigadeFormationTarget(a,ctx,enemy),tb=__conformance.brigadeFormationTarget(b,ctx,enemy),tr=__conformance.brigadeFormationTarget(reserve,ctx,enemy);
  assert.notEqual(ta.x,tb.x,'front-line regiments need distinct lateral slots');
  assert.ok(ta.spacing>=inch(50),'slot spacing should be driven by actual frontage');
  assert.ok(tr.y>ta.y,'follow-up wave should remain deeper than first wave when advancing north');
});

test('authoring, deployment, replay and publisher expose and consume rectangular footprint controls',()=>{
  const html=read('index.html'),builder=read('src/modules/scenarioBuilder.js'),dep=read('src/modules/deploymentEditor.js'),engine=read('src/modules/playtestEngine.js'),replay=read('src/modules/playtestCenter.js'),publisher=read('src/modules/scenarioPublisher.js');
  assert.match(html,/value="acw-regiment"/);assert.match(html,/id="unitBaseWidthMm"/);assert.match(html,/id="unitBaseDepthMm"/);assert.match(html,/id="unitBaseWidthOverride"/);assert.match(html,/id="unitBaseDepthOverride"/);
  assert.match(builder,/unitBaseWidthMm/);assert.match(builder,/unitBaseDepthMm/);assert.match(builder,/baseWidthMm/);assert.match(builder,/baseDepthMm/);
  assert.match(dep,/footprintPercentFromSpec/);assert.match(dep,/baseWidthMm/);assert.match(dep,/baseDepthMm/);assert.match(dep,/illegal-placement/);assert.match(dep,/deploymentGeometryIssues/);assert.match(dep,/rotateSelected\(-15\)/);assert.match(dep,/rotateSelected\(15\)/);
  assert.match(engine,/baseFrontage/);assert.match(engine,/brigadeFormationTarget/);assert.match(engine,/baseGapDistance/);assert.match(engine,/frontCornersAt/);
  assert.match(replay,/baseWidthMm/);assert.match(replay,/baseDepthMm/);
  assert.match(publisher,/baseWidthMm/);assert.match(publisher,/baseDepthMm/);assert.match(publisher,/basingSummary/);assert.match(publisher,/\|\$\{fp\.width\}x\$\{fp\.depth\}/);assert.match(publisher,/-webkit-print-color-adjust:exact/);assert.match(publisher,/print-color-adjust:exact/);
});
