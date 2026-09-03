import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {__conformance} from '../src/modules/playtestEngine.js';
import {getEffectiveRuleset} from '../src/rules/ruleset.js';
import {createBlankScenario} from '../src/data/scenarioData.js';
import {interpretSemanticOrder690,generateAutoTacticalPlan690} from '../src/modules/tacticalPlanner690.js';
import {storedZip,readExchangeFile} from '../src/modules/zipExchange.js';
import {applyPlaytestEngine690Patch} from '../src/modules/playtestEngine690Patch.js';
import {compileTacticalIntent,normalizeExternalTacticalIntent,validateTacticalIntent} from '../src/modules/tacticalIntent.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function unit(overrides={}){
  return {id:'u',kind:'unit',name:'Unit',profile:'Infantry',faction:'sideA',commandId:'c',x:3,y:10,facing:90,baseWidthMm:50,baseDepthMm:25,baseShape:'rect',move:7,combat:2,armor:5,points:1,traits:[],damage:0,destroyed:false,inactive:false,...overrides};
}
function chargeCtx(units){
  const s=createBlankScenario();s.ruleset={...s.ruleset,supplement:'american-civil-war'};
  return {rules:getEffectiveRuleset(s),units,commanders:[],terrain:[],width:20,height:20,scale:1,tacticalPlan:{commands:{}},commandRelease:{},turn:2,rng:{d6:()=>4,d3:()=>2},event:()=>{}};
}
function semanticState(){
  return {
    project:{
      name:'Glendale fixture',
      features:[{id:'road-willis',name:'Willis Church Road',box:[40,20,20,2]}],
      scenario:{
        metadata:{title:'Battle of Glendale / Frayser’s Farm'},
        ruleset:{core:'battle-axe-core',supplement:'american-civil-war'},
        sideLabels:{sideA:'Union',sideB:'Confederate'},
        victoryText:'Confederates seek Willis Church Road.',
        commands:{
          sideA:[{id:'simmons',name:"Simmons's Brigade",commander:'Simmons',units:[{id:'pa1',name:'Pennsylvania Reserves',profile:'Infantry',traits:['Muskets']}]}],
          sideB:[{id:'mahone',name:"Mahone's Brigade",commander:'Mahone',units:[{id:'va1',name:'Virginia Infantry',profile:'Infantry',traits:['Muskets']}]}]
        },
        deployment:{placements:{pa1:{x:25,y:50,facing:270},va1:{x:70,y:50,facing:90}},commanderPlacements:{},zones:[]}
      }
    },
    decisions:{'road-willis':{status:'approved',cls:'Road',effects:[]}},
    playtestWorkspace:{armyOrders:{sideA:{posture:'Auto',text:''},sideB:{posture:'Auto',text:''}},commandOrders:{},cueLevel:'standard'}
  };
}

test('charge path stops/rejects when another unit lies between charger and declared target',()=>{
  const charger=unit({id:'charger',name:'Charger'});
  const blocker=unit({id:'blocker',name:'Intervening Friendly',x:6,y:10});
  const target=unit({id:'target',name:'Declared Target',faction:'sideB',commandId:'enemy',x:9,y:10,facing:270});
  const legal=__conformance.canCharge(charger,target,chargeCtx([charger,blocker,target]));
  assert.equal(legal.ok,false);
  assert.equal(legal.reason,'charge path blocked');
  assert.equal(legal.blockerId,'blocker');
});

test('charge path also rejects an unintended enemy formation before the declared target',()=>{
  const charger=unit({id:'charger',name:'Charger'});
  const blocker=unit({id:'blocker',name:'Intervening Enemy',faction:'sideB',commandId:'enemy2',x:6,y:10,facing:270});
  const target=unit({id:'target',name:'Declared Target',faction:'sideB',commandId:'enemy',x:9,y:10,facing:270});
  const legal=__conformance.canCharge(charger,target,chargeCtx([charger,blocker,target]));
  assert.equal(legal.ok,false);
  assert.equal(legal.reason,'charge path blocked');
  assert.equal(legal.blockerId,'blocker');
});

test('ACW charge adjudication logs named Charge and Receive Charge tests before contact',()=>{
  const charger=unit({id:'charger',name:'Charger',x:3,y:10}),target=unit({id:'target',name:'Receiver',faction:'sideB',commandId:'enemy',x:7,y:10,facing:270}),events=[],ctx=chargeCtx([charger,target]);ctx.rng={d6:()=>6,d3:()=>2};ctx.commandParentById=new Map();ctx.event=(type,actor,payload)=>events.push({type,actor:actor.id,payload});
  assert.equal(__conformance.charge(charger,target,ctx),true);
  assert.deepEqual(events.filter(e=>e.type==='command_test').map(e=>e.payload.testType),['Charge Test','Receive Charge Test']);
  assert.ok(events.findIndex(e=>e.type==='command_test')<events.findIndex(e=>e.type==='charge_contact'));
});

test('semantic Tactical Plan understands Confederate left flank as a battlefield relation rather than unknown jargon',()=>{
  const out=interpretSemanticOrder690('Attack the Confederate left flank.',semanticState(),{scope:'command',commandId:'simmons',side:'sideA'});
  assert.equal(out.action,'Assault');
  assert.equal(out.region,'left');
  assert.equal(out.targetSide?.side,'sideB');
  assert.equal(out.status,'understood');
  assert.equal(out.unresolved.length,0);
  assert.match(out.meaning.join(' '),/current facing/i);
});

test('semantic Tactical Plan resolves an exact named-terrain release trigger for local execution',()=>{
  const out=interpretSemanticOrder690('Hold in reserve until the Confederates reach Willis Church Road.',semanticState(),{scope:'command',commandId:'simmons',side:'sideA'});
  assert.equal(out.terrain[0]?.id,'road-willis');
  assert.equal(out.status,'understood');
  assert.equal(out.unresolved.length,0);
  assert.match(out.execution.map(x=>`${x.field}:${x.value}`).join(' '),/releaseTrigger:Confederate reaches Willis Church Road/i);
});

test('combined reserve / terrain / post-release flank order resolves the enemy rather than the named friendly command',()=>{
  const out=interpretSemanticOrder690('Hold Simmons in reserve until the Confederates reach Willis Church Road, then assault their left flank.',semanticState(),{scope:'command',commandId:'simmons',side:'sideA'});
  assert.equal(out.status,'understood');
  assert.equal(out.action,'Reserve');
  assert.equal(out.postReleaseOrder,'Assault');
  assert.equal(out.targetSide?.side,'sideB');
  assert.equal(out.targetCommand,null);
  assert.equal(out.region,'left');
  assert.equal(out.terrainReference?.ids[0],'road-willis');
});

test('offensive geographic southern flank remains an Assault and never becomes flank security',()=>{
  const out=interpretSemanticOrder690('Attack the southern flank of the Union line.',semanticState(),{scope:'command',commandId:'mahone',side:'sideB'});
  assert.equal(out.action,'Assault');
  assert.equal(out.tacticalIntent.target.frame,'geographic');
  assert.equal(out.tacticalIntent.target.region,'south');
  assert.equal(out.tacticalIntent.target.purpose,'offensive');
  assert.notEqual(out.tacticalIntent.mission,'flank-security');
  assert.equal(out.legacy.screenFlank,true,'legacy keyword parser may still recognize flank, but canonical intent must remain authoritative');
});

test('reserve artillery-loss OR Turn 3 compiles to an executable ANY condition tree',()=>{
  const out=interpretSemanticOrder690('Release once a Union artillery unit is destroyed, or by Turn 3, whichever happens first.',semanticState(),{scope:'command',commandId:'mahone',side:'sideB'});
  assert.equal(out.status,'understood');
  assert.equal(out.releaseCondition.op,'ANY');
  assert.deepEqual(out.releaseCondition.conditions.map(x=>x.type),['unit_destroyed','turn_reached']);
  assert.deepEqual(out.releaseCondition.conditions[0],{type:'unit_destroyed',side:'sideA',role:'artillery',commandId:null,quantity:1});
  assert.equal(out.releaseCondition.conditions[1].turn,3);
  assert.equal(out.legacy.preferShoot,2,'legacy parser sees artillery language, but canonical condition prevents it becoming a fire preference');
});

test('parser distinguishes friendly flank security from offensive formation-relative and geographic targets',()=>{
  const secure=compileTacticalIntent('Protect my southern flank.',{ownSide:'sideA',sideLabels:{sideA:'Union',sideB:'Confederate'},supplementId:'american-civil-war',commands:[],terrain:[]});
  assert.equal(secure.order,'Defend');assert.equal(secure.mission,'flank-security');assert.equal(secure.target.frame,'geographic');assert.equal(secure.target.region,'south');assert.equal(secure.target.side,'sideA');
  const attack=compileTacticalIntent("Attack Mahone's left flank.",{ownSide:'sideA',sideLabels:{sideA:'Union',sideB:'Confederate'},supplementId:'american-civil-war',commands:[{id:'mahone',name:"Mahone's Brigade",commander:'Mahone',side:'sideB'}],terrain:[]});
  assert.equal(attack.order,'Assault');assert.equal(attack.target.frame,'formation-relative');assert.equal(attack.target.region,'left');assert.equal(attack.target.commandId,'mahone');
});

test('unsupported meaningful conditional clauses fail closed',()=>{
  const out=compileTacticalIntent('Hold in reserve until the moon turns green.',{ownSide:'sideA',sideLabels:{sideA:'Union',sideB:'Confederate'},supplementId:'american-civil-war',commands:[],terrain:[]});
  assert.equal(out.status,'blocked');assert.ok(out.unresolved.length);assert.equal(out.releaseCondition,null);
});

test('External AI rich fields validate as canonical TacticalIntent without prose round-trip',()=>{
  const context={commandId:'simmons',ownSide:'sideA',commands:[{id:'simmons'},{id:'mahone'}],terrain:[{id:'road-willis'}]};
  const intent=normalizeExternalTacticalIntent({order:'Reserve',text:'this prose is audit-only',target:{type:'formation',id:'mahone',region:'left'},release_condition:{op:'ANY',conditions:[{type:'terrain_occupied',terrainIds:['road-willis'],terrainName:'Willis Church Road',side:'sideB'},{type:'turn_reached',turn:3}]}},context);
  assert.equal(intent.source,'external-ai');assert.equal(intent.target.commandId,'mahone');assert.equal(intent.target.frame,'formation-relative');assert.deepEqual(validateTacticalIntent(intent,context),[]);
});

test('Auto Tactical Planner creates a command-level plan rather than leaving every command independent',()=>{
  const plan=generateAutoTacticalPlan690(semanticState());
  assert.equal(plan.version,'0.6.9.1');
  assert.ok(plan.armies.sideA);
  assert.ok(plan.armies.sideB);
  assert.ok(plan.commands.simmons);
  assert.ok(plan.commands.mahone);
  assert.match(plan.commands.simmons.mission,/main effort|support|defensive|screen|reserve/i);
});

test('AI exchange ZIP is one user-facing package containing one JSON payload',async()=>{
  const payload={format:'battle-axe-ai-response',version:'1.0',response_type:'tactical-plan',tactical_plan:{commands:{}}};
  const zip=storedZip({'response.json':JSON.stringify(payload)});
  const file={name:'Battle_Axe_AI_Response.zip',arrayBuffer:()=>zip.arrayBuffer()};
  const out=await readExchangeFile(file,{preferred:['response.json']});
  assert.equal(out.kind,'zip');
  assert.deepEqual(out.entries,['response.json']);
  assert.equal(out.json.format,'battle-axe-ai-response');
});

test('v0.6.9.1 tactical engine patch applies cleanly to the v0.6.8.1 baseline and installs executable flank/terrain semantics',()=>{
  const baseline=read('src/modules/playtestEngine.js');
  const patched=applyPlaytestEngine690Patch(baseline,{baseUrl:'https://example.invalid/src/modules/playtestEngine.js'});
  assert.match(patched,/function formationFlankAnchor690/);
  assert.match(patched,/releaseTerrainIds/);
  assert.match(patched,/postReleaseOrder/);
  assert.match(patched,/semanticFlankReached/);
  assert.match(patched,/reserve_released/);
  assert.match(patched,/explicitReserveTrigger/);
});

test('patched deterministic engine evaluates canonical ANY reserve predicates against live state',async()=>{
  const baseline=read('src/modules/playtestEngine.js'),baseUrl=new URL('../src/modules/playtestEngine.js',import.meta.url),patched=applyPlaytestEngine690Patch(baseline,{baseUrl}),engine=await import(`data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`);
  const reserve={id:'reserve',name:'Reserve',faction:'sideB',commandId:'simmons',traits:[],profile:'Infantry'},destroyedBattery={id:'battery',name:'Union Battery',faction:'sideA',commandId:'union-artillery',traits:['Artillery'],profile:'Cannon',role:'artillery',destroyed:true,inactive:false};
  const condition={op:'ANY',conditions:[{type:'unit_destroyed',side:'sideA',role:'artillery',quantity:1},{type:'turn_reached',turn:3}]},ctx={turn:1,units:[reserve,destroyedBattery],commanders:[],terrain:[],commandParentById:new Map(),scale:1};
  const result=engine.__conformance.evaluateCondition690(condition,reserve,ctx);
  assert.equal(result.satisfied,true);assert.equal(result.actor.id,'battery');assert.match(result.reason,/destroyed/i);
  ctx.units=[reserve];assert.equal(engine.__conformance.evaluateCondition690(condition,reserve,ctx).satisfied,false);ctx.turn=3;assert.equal(engine.__conformance.evaluateCondition690(condition,reserve,ctx).satisfied,true);
});

test('v0.6.9.1 overlay contains Scenario Library, fail-closed interpretation, Auto Plan and one-file AI exchange wiring',()=>{
  const nav=read('src/modules/navigation.js'),release=read('src/modules/release690.js'),library=read('src/modules/scenarioLibrary.js'),external=read('src/modules/externalAiExchange.js'),patch=read('src/modules/playtestEngine690Patch.js'),worker=read('src/modules/playtestWorker.js');
  assert.match(nav,/release690\.js\?v=0\.6\.9\.1/);
  assert.match(release,/validateTacticalPlanWorkspace690/);
  assert.match(release,/Playtest not started/);
  assert.match(release,/Preview Auto Plan/);
  assert.match(release,/patchPlaytestWorkerCacheBust/);
  assert.match(patch,/semanticFlankFormationTarget690/);
  assert.match(patch,/formationFlankAnchor690/);
  assert.match(patch,/terrainReleaseState690/);
  assert.match(patch,/releaseTerrainIds/);
  assert.match(patch,/postReleaseOrder/);
  assert.match(patch,/compileTacticalIntent/);
  assert.match(patch,/evaluateCondition690/);
  assert.match(patch,/targetGeographicRegion/);
  assert.match(worker,/playtestEngine690\.js\?v=0\.6\.9\.1/);
  assert.match(library,/scenarios\/index\.json/);
  assert.match(library,/migrateImportedProject/);
  assert.match(external,/Download AI Package \(\.zip\)/);
  assert.match(external,/Import AI Response \(\.zip\/.json\)/);
  assert.match(external,/Battle_Axe_Tactical_AI_Request\.zip/);
  const catalog=JSON.parse(read('scenarios/index.json'));
  assert.equal(catalog.format,'battle-axe-scenario-library');
});
