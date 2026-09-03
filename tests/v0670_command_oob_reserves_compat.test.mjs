import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeScenarioText } from '../src/modules/scenarioAnalyzer.js';
import { getEffectiveRuleset } from '../src/rules/ruleset.js';
import { commandHasAuthority, parentMapFromScenario } from '../src/modules/commandHierarchy.js';
import { __conformance, buildRuntimeFromStudio, runPlaytest } from '../src/modules/playtestEngine.js';
import { createInitialState, createProjectExportPayload, migrateImportedProject, PROJECT_SCHEMA_VERSION } from '../src/app/state.js';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const fullFixture=fs.readFileSync(path.join(HERE,'fixtures','Glendale_ACW_Full_v0.6.7.1.md'),'utf8');
const acwRuleset=getEffectiveRuleset({ruleset:{core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'0.1'}});

function unit(id,faction,x,y,{commandId='cmd',profile='Infantry',traits=['Muskets'],width=50,depth=25,facing=0}={}){
  return{id,name:id,kind:'unit',profile,faction,commandId,x,y,facing,baseMm:width,baseWidthMm:width,baseDepthMm:depth,baseShape:'rect',move:2,combat:2,armor:5,points:1,traits,damage:0,destroyed:false,inactive:false};
}
function commander(id,faction,x,y,commandId='cmd'){
  return{id,name:id,kind:'commander',faction,commandId,x,y,facing:0,baseMm:25,baseWidthMm:25,baseDepthMm:25,baseShape:'circle',traits:[],destroyed:false,inactive:false,commandRating:2};
}

test('v0.6.7.1 full Glendale OOB parses 82 explicit leaves into the historical hierarchy without prose leakage',()=>{
  const a=analyzeScenarioText(fullFixture,{sourceName:'Glendale v0.6.7 regression fixture',ruleset:acwRuleset});
  assert.equal(a.forces.length,82);
  assert.equal(a.forces.filter(x=>x.faction==='Union').length,30);
  assert.equal(a.forces.filter(x=>x.faction==='Confederate').length,52);
  assert.equal(a.sourceCommands.length,27);
  assert.equal(a.forces.filter(x=>x.profileHint==='Cannons').length,5);
  assert.equal(a.forces.some(x=>/represented twenty-four guns|major later assault/i.test(x.name)),false,'narrative prose must not become a unit');
  assert.equal(a.forces.some(x=>x.profileHint==='Archers'||/^Archers$/i.test(x.name)),false,'James J. Archer must not create an Archers unit');
  const rob=a.sourceCommands.find(x=>x.name==='Robinson’s Brigade');assert.ok(rob);assert.equal(rob.formations.length,0);assert.equal(rob.parentCommandName,'Kearny’s Division');
  const feather=a.sourceCommands.find(x=>x.name==='Featherston’s Brigade');assert.ok(feather);assert.equal(feather.formations.length,0);
  const gorman=a.sourceCommands.find(x=>x.name==='Gorman’s Brigade');assert.ok(gorman);assert.equal(gorman.historicalCommander,'Brig. Gen. Willis Gorman');assert.equal(gorman.scenarioCommander,'Col. Alfred Sully');assert.equal(gorman.commander,'Col. Alfred Sully');
  const pickett=a.sourceCommands.find(x=>x.name==='Pickett’s Brigade');assert.equal(pickett?.commander,'Col. Eppa Hunton');
});

test('generic command authority follows ancestor/descendant relationships and excludes sibling brigades',()=>{
  const scenario={commands:{sideA:[
    {id:'army',name:'Army',parentCommandId:null,units:[]},
    {id:'division',name:'Division',parentCommandId:'army',units:[]},
    {id:'brigade-a',name:'Brigade A',parentCommandId:'division',units:[{id:'a'}]},
    {id:'brigade-b',name:'Brigade B',parentCommandId:'division',units:[{id:'b'}]}
  ],sideB:[]}};
  const parents=parentMapFromScenario(scenario);
  assert.equal(commandHasAuthority('brigade-a','brigade-a',parents),true);
  assert.equal(commandHasAuthority('division','brigade-a',parents),true);
  assert.equal(commandHasAuthority('army','brigade-b',parents),true);
  assert.equal(commandHasAuthority('brigade-a','brigade-b',parents),false);
});

test('event-328 regression: a friendly cannon fully masks small-arms LOS and Shoot is not a legal action',()=>{
  const shooter=unit('Union infantry','sideA',5,7),blocker=unit('Union cannon','sideA',5,4.6,{profile:'Cannons',traits:['Artillery']}),target=unit('Confederate infantry','sideB',5,2.2);
  const ctx={units:[shooter,blocker,target],commanders:[],terrain:[],rules:acwRuleset,scale:1,width:12,height:12,commandParentById:new Map(),tacticalPlan:{commands:{}},commandRelease:{}};
  const los=__conformance.lineOfSight(shooter,target,ctx);assert.equal(los.ok,false);assert.equal(los.blockerId,blocker.id);assert.ok(los.checks.length>0);assert.ok(los.checks.every(x=>x.ok===false));
  assert.equal(__conformance.canShoot(shooter,target,ctx).ok,false);
  assert.equal(__conformance.legalActionsForUnit(shooter,ctx).some(a=>a.type==='shoot'&&a.target?.id===target.id),false);
  blocker.x=2;__conformance.markLosSpatialChange(ctx,blocker);
  assert.equal(__conformance.lineOfSight(shooter,target,ctx).ok,true);
  assert.equal(__conformance.legalActionsForUnit(shooter,ctx).some(a=>a.type==='shoot'&&a.target?.id===target.id),true);
});

test('friendly commanders also block LOS',()=>{
  const shooter=unit('Shooter','sideA',5,7,{width:25,depth:25}),target=unit('Target','sideB',5,2.8,{width:25,depth:25}),cmd=commander('Friendly commander','sideA',5,4.9,'other');
  const ctx={units:[shooter,target],commanders:[cmd],terrain:[],rules:acwRuleset,scale:1,width:12,height:12,commandParentById:new Map(),tacticalPlan:{commands:{}},commandRelease:{}};
  const los=__conformance.lineOfSight(shooter,target,ctx);assert.equal(los.ok,false);assert.equal(los.blockerId,cmd.id);
});

test('ACW order doctrine uses wider defensive frontage and deeper assault echelons',()=>{
  const makeCtx=order=>{const us=Array.from({length:5},(_,i)=>unit(`r${i+1}`,'sideA',2+i*.5,8,{commandId:'brig'})),enemy=unit('enemy','sideB',6,2,{commandId:'enemy'});return{units:[...us,enemy],commanders:[],terrain:[],rules:acwRuleset,scale:1,width:20,height:20,commandParentById:new Map(),tacticalPlan:{commands:{brig:{order,modifiers:{}}}},commandRelease:{}};};
  const defend=makeCtx('Defend');const d=__conformance.activationOrderForSide('sideA',defend);assert.equal(d.filter(u=>u.maneuverWave===1).length,4);assert.equal(d.filter(u=>u.maneuverWave===2).length,1);
  const assault=makeCtx('Assault');const a=__conformance.activationOrderForSide('sideA',assault);assert.equal(a.filter(u=>u.maneuverWave===1).length,3);assert.equal(a.filter(u=>u.maneuverWave===2).length,2);
  const enemy=assault.units.find(u=>u.id==='enemy'),dTarget=__conformance.brigadeFormationTarget(defend.units[0],defend,defend.units.at(-1),'Defend'),aTarget=__conformance.brigadeFormationTarget(assault.units[0],assault,enemy,'Assault');
  assert.ok(dTarget.spacing>aTarget.spacing,'Defend should prefer a broader frontage than Assault');
});

test('commander coverage honors command authority instead of proximity to sibling units',()=>{
  const own=unit('own','sideA',5,5,{commandId:'brig-a'}),sibling=unit('sibling','sideA',5.3,5,{commandId:'brig-b'}),c=commander('A commander','sideA',5,5.5,'brig-a'),ctx={units:[own,sibling],commanders:[c],terrain:[],rules:acwRuleset,scale:1,width:12,height:12,commandParentById:new Map([['brig-a','div'],['brig-b','div'],['div','army'],['army',null]])};
  const cov=__conformance.coverageForCommander(c,ctx);assert.deepEqual(cov.candidates.map(x=>x.id),['own']);
});

function minimalStudioState(){
  const st=createInitialState();st.project.playSpace={width:12,height:12,units:'inches',origin:'northwest'};st.project.mapSource={kind:'svg',name:'fixture.svg',svgText:'<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>',battlefieldRevision:'rev-test'};st.project.battlefieldRevision='rev-test';st.project.scenario.ruleset={core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'0.1'};st.project.scenario.tabletop={...st.project.scenario.tabletop,unitBaseMm:50,unitBaseWidthMm:50,unitBaseDepthMm:25,commanderBaseMm:25,measurementMultiplier:1};return st;
}

test('reserve command enters at end of owning turn with commander first and receives no action on entry turn',()=>{
  const st=minimalStudioState();st.project.scenario.commands={sideA:[{id:'reserve-brig',name:'Reserve Brigade',commander:'Reserve Commander',echelon:'Brigade',commandRating:2,reserve:{enabled:true,deploymentTurn:1,entry:{type:'edge-segment',edge:'north',startPct:40,endPct:60}},units:[{id:'reserve-regt',name:'Reserve Regiment',profile:'Infantry'}]}],sideB:[{id:'enemy-cmd',name:'Enemy',commander:'',units:[{id:'enemy-regt',name:'Enemy Regiment',profile:'Infantry'}]}]};st.project.scenario.deployment.placements={'enemy-regt':{x:50,y:80,facing:0}};st.project.scenario.structuredRules.turnOneInitiative='sideA';
  const rt=buildRuntimeFromStudio(st,{measurementScale:1});assert.equal(rt.deploymentIssues.length,0);assert.equal(rt.units.find(u=>u.id==='reserve-regt')?.reserveOffTable,true);
  const result=runPlaytest(st,{seed:7,turns:1,measurementScale:1});
  const cmdEvent=result.events.find(e=>e.type==='reserve_commander_deployed'),unitEvent=result.events.find(e=>e.type==='reserve_unit_deployed');assert.ok(cmdEvent);assert.ok(unitEvent);assert.ok(cmdEvent.i<unitEvent.i);assert.equal(cmdEvent.payload.noActionThisTurn,true);assert.equal(unitEvent.payload.noActionThisTurn,true);assert.equal(result.events.some(e=>e.type==='ai_action_choice'&&e.actor==='reserve-regt'),false,'newly deployed reserve must not act on its entry turn');
  const final=result.finalUnits.find(u=>u.id==='reserve-regt'),finalCmd=result.finalCommanders.find(c=>c.commandId==='reserve-brig');assert.equal(final.reserveOffTable,false);assert.equal(finalCmd.reserveOffTable,false);assert.ok(finalCmd.y<1,'commander should enter touching the north edge');assert.ok(unitEvent.payload.withinCommandDistance<=unitEvent.payload.commandRange+1e-6);
});

test('reserve command without commander nominates a temporary command unit only for deployment',()=>{
  const st=minimalStudioState();st.project.scenario.commands={sideA:[{id:'reserve-brig',name:'No Commander Reserve',commander:'',reserve:{enabled:true,deploymentTurn:1,entry:{type:'point',x:50,y:0}},units:[{id:'u1',name:'First',profile:'Infantry'},{id:'u2',name:'Second',profile:'Infantry'}]}],sideB:[{id:'enemy-cmd',name:'Enemy',commander:'',units:[{id:'enemy',name:'Enemy',profile:'Infantry'}]}]};st.project.scenario.deployment.placements={enemy:{x:50,y:80,facing:0}};
  const result=runPlaytest(st,{seed:8,turns:1,measurementScale:1});const temp=result.events.find(e=>e.type==='reserve_command_unit_deployed');assert.ok(temp);assert.equal(temp.payload.temporaryCommandUnit,true);assert.equal(temp.payload.noActionThisTurn,true);assert.equal(result.finalCommanders.some(c=>c.commandId==='reserve-brig'),false,'temporary command unit must not become a Commander actor');
});

test('structured Turn-1 initiative override changes only the opening side order',()=>{
  const st=minimalStudioState();st.project.scenario.commands={sideA:[{id:'f',name:'F',commander:'',units:[{id:'fu',name:'French Unit',profile:'Infantry'}]}],sideB:[{id:'i',name:'I',commander:'',units:[{id:'iu',name:'Imperial Unit',profile:'Infantry'}]}]};st.project.scenario.deployment.placements={fu:{x:20,y:75,facing:0},iu:{x:80,y:25,facing:180}};st.project.scenario.structuredRules.turnOneInitiative='sideA';const r=runPlaytest(st,{seed:3,turns:1,measurementScale:1});const first=r.events.find(e=>e.side);assert.equal(first?.side,'sideA');
});

test('full scenario JSON round-trip preserves compiled map, approved terrain, hierarchy, deployment, reserves and unknown extension data',()=>{
  const st=minimalStudioState();st.project.customFutureProjectField={keep:'project-extension'};st.futureEnvelope={keep:'not exported directly'};st.project.features=[{id:'feat-1',name:'Woods',cls:'Woods',geometry:{parts:[{closed:true,points:[[10,10],[20,10],[20,20],[10,20]]}]},terrainOverride:null}];st.decisions={'feat-1':{status:'approved',cls:'Woods',effects:['Difficult','Obscuring']}};st.project.scenario.commands={sideA:[{id:'army',name:'Army',commander:'General',echelon:'Army',units:[]},{id:'brig',name:'Brigade',commander:'Brigadier',echelon:'Brigade',parentCommandId:'army',commandRating:2,reserve:{enabled:true,deploymentTurn:3,entry:{type:'zone',zoneId:'zone-r'}},units:[{id:'regt',name:'Regiment',profile:'Infantry'}]}],sideB:[]};st.project.scenario.deployment={placements:{regt:{x:35,y:40,facing:123}},commanderPlacements:{brig:{x:34,y:42}},zones:[{id:'zone-r',name:'Reserve Entry',points:[{x:10,y:5},{x:20,y:5},{x:20,y:15},{x:10,y:15}]}],battlefieldRevision:'rev-test',futureDeploymentField:'keep-me'};st.project.scenario.structuredRules={turnOneInitiative:'sideA',futureRule:'keep'};st.project.scenario.futureScenarioField={plugin:'keep'};
  const payload=createProjectExportPayload(st,{studioVersion:'0.6.7.1',exportedAt:'2026-08-27T12:00:00Z'});assert.equal(payload.schemaVersion,PROJECT_SCHEMA_VERSION);assert.equal(payload.project.mapSource.svgText,st.project.mapSource.svgText);const migrated=migrateImportedProject(payload);const out=migrated.state;assert.equal(out.project.mapSource.svgText,st.project.mapSource.svgText);assert.deepEqual(out.decisions,st.decisions);assert.equal(out.project.scenario.commands.sideA[1].parentCommandId,'army');assert.equal(out.project.scenario.commands.sideA[1].reserve.entry.zoneId,'zone-r');assert.equal(out.project.scenario.deployment.placements.regt.facing,123);assert.equal(out.project.scenario.deployment.futureDeploymentField,'keep-me');assert.deepEqual(out.project.scenario.futureScenarioField,{plugin:'keep'});assert.deepEqual(out.project.customFutureProjectField,{keep:'project-extension'});assert.ok(migrated.migration.steps.some(x=>/validated migrated project/i.test(x)));
});

test('legacy scenario-only JSON migrates forward with safe defaults instead of being rejected',()=>{
  const legacy={metadata:{title:'Old Scenario'},rosters:{sideA:[{id:'old-u',name:'Old Unit',profile:'Infantry'}]},deployment:{placements:{'old-u':{x:20,y:30,facing:90}}},legacyCustom:{keep:true}};const {state,migration}=migrateImportedProject(legacy);assert.equal(state.project.scenario.metadata.title,'Old Scenario');assert.equal(state.project.schemaVersion,PROJECT_SCHEMA_VERSION);assert.equal(state.project.scenario.commands.sideA[0].units[0].id,'old-u');assert.deepEqual(state.project.scenario.legacyCustom,{keep:true});assert.ok(migration.warnings.length>0);
});

test('legacy scenario-only import can retain the current authoritative battlefield and same-scenario deployment',async()=>{
  const {mergeImportedScenarioWithCurrentBattlefield}=await import('../src/app/state.js');
  const current=minimalStudioState();
  current.project.scenario.metadata.title='Battle of Glendale / Frayser’s Farm';
  current.project.features=[{id:'woods',name:'Woods',cls:'Woods'}];
  current.decisions={woods:{status:'approved',cls:'Woods',effects:['Difficult']}};
  current.project.scenario.deployment={placements:{u1:{x:20,y:30,facing:90}},commanderPlacements:{},zones:[],battlefieldRevision:'rev-test'};
  const legacy={metadata:{title:'Battle of Glendale / Frayser’s Farm'},commands:{sideA:[],sideB:[]},deployment:{placements:{},commanderPlacements:{},zones:[],battlefieldRevision:'old-rev'}};
  const migrated=migrateImportedProject(legacy);
  assert.equal(migrated.migration.capabilities.containsBattlefield,false);
  const merged=mergeImportedScenarioWithCurrentBattlefield(migrated.state,current);
  assert.equal(merged.project.mapSource.svgText,current.project.mapSource.svgText);
  assert.deepEqual(merged.project.features,current.project.features);
  assert.deepEqual(merged.decisions,current.decisions);
  assert.deepEqual(merged.project.playSpace,current.project.playSpace);
  assert.deepEqual(merged.project.scenario.deployment,current.project.scenario.deployment,'same-scenario current deployment is recoverable when legacy file has none');
});

test('legacy import battlefield retention does not copy deployment from a different scenario',async()=>{
  const {mergeImportedScenarioWithCurrentBattlefield}=await import('../src/app/state.js');
  const current=minimalStudioState();current.project.scenario.metadata.title='Scenario A';current.project.scenario.deployment={placements:{a:{x:10,y:10,facing:0}},commanderPlacements:{},zones:[],battlefieldRevision:'rev-test'};
  const legacy={metadata:{title:'Scenario B'},commands:{sideA:[],sideB:[]},deployment:{placements:{},commanderPlacements:{},zones:[]}};
  const merged=mergeImportedScenarioWithCurrentBattlefield(migrateImportedProject(legacy).state,current);
  assert.equal(merged.project.mapSource.svgText,current.project.mapSource.svgText,'designer explicitly chose to keep the current map');
  assert.equal(Object.keys(merged.project.scenario.deployment.placements).length,0,'deployment from another scenario must not leak across');
  assert.equal(merged.project.scenario.deployment.battlefieldRevision,'rev-test');
});
