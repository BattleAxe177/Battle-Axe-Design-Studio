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

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function unit(overrides={}){
  return {id:'u',kind:'unit',name:'Unit',profile:'Infantry',faction:'French',commandId:'c',x:3,y:10,facing:90,baseWidthMm:50,baseDepthMm:25,baseShape:'rect',move:7,combat:2,armor:5,points:1,traits:[],damage:0,destroyed:false,inactive:false,...overrides};
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
        sideLabels:{French:'Union',Imperial:'Confederate'},
        victoryText:'Confederates seek Willis Church Road.',
        commands:{
          French:[{id:'simmons',name:"Simmons's Brigade",commander:'Simmons',units:[{id:'pa1',name:'Pennsylvania Reserves',profile:'Infantry',traits:['Muskets']}]}],
          Imperial:[{id:'mahone',name:"Mahone's Brigade",commander:'Mahone',units:[{id:'va1',name:'Virginia Infantry',profile:'Infantry',traits:['Muskets']}]}]
        },
        deployment:{placements:{pa1:{x:25,y:50,facing:270},va1:{x:70,y:50,facing:90}},commanderPlacements:{},zones:[]}
      }
    },
    decisions:{'road-willis':{status:'approved',cls:'Road',effects:[]}},
    playtestWorkspace:{armyOrders:{French:{posture:'Auto',text:''},Imperial:{posture:'Auto',text:''}},commandOrders:{},cueLevel:'standard'}
  };
}

test('charge path stops/rejects when another unit lies between charger and declared target',()=>{
  const charger=unit({id:'charger',name:'Charger'});
  const blocker=unit({id:'blocker',name:'Intervening Friendly',x:6,y:10});
  const target=unit({id:'target',name:'Declared Target',faction:'Imperial',commandId:'enemy',x:9,y:10,facing:270});
  const legal=__conformance.canCharge(charger,target,chargeCtx([charger,blocker,target]));
  assert.equal(legal.ok,false);
  assert.equal(legal.reason,'charge path blocked');
  assert.equal(legal.blockerId,'blocker');
});

test('charge path also rejects an unintended enemy formation before the declared target',()=>{
  const charger=unit({id:'charger',name:'Charger'});
  const blocker=unit({id:'blocker',name:'Intervening Enemy',faction:'Imperial',commandId:'enemy2',x:6,y:10,facing:270});
  const target=unit({id:'target',name:'Declared Target',faction:'Imperial',commandId:'enemy',x:9,y:10,facing:270});
  const legal=__conformance.canCharge(charger,target,chargeCtx([charger,blocker,target]));
  assert.equal(legal.ok,false);
  assert.equal(legal.reason,'charge path blocked');
  assert.equal(legal.blockerId,'blocker');
});

test('semantic Tactical Plan understands Confederate left flank as a battlefield relation rather than unknown jargon',()=>{
  const out=interpretSemanticOrder690('Attack the Confederate left flank.',semanticState(),{scope:'command',commandId:'simmons',side:'French'});
  assert.equal(out.action,'Assault');
  assert.equal(out.region,'left');
  assert.equal(out.targetSide?.side,'Imperial');
  assert.equal(out.status,'understood');
  assert.equal(out.unresolved.length,0);
  assert.match(out.meaning.join(' '),/current facing/i);
});

test('semantic Tactical Plan resolves an exact named-terrain release trigger for local execution',()=>{
  const out=interpretSemanticOrder690('Hold in reserve until the Confederates reach Willis Church Road.',semanticState(),{scope:'command',commandId:'simmons',side:'French'});
  assert.equal(out.terrain[0]?.id,'road-willis');
  assert.equal(out.status,'understood');
  assert.equal(out.unresolved.length,0);
  assert.match(out.execution.map(x=>`${x.field}:${x.value}`).join(' '),/releaseTrigger:Confederate reaches Willis Church Road/i);
});

test('combined reserve / terrain / post-release flank order resolves the enemy rather than the named friendly command',()=>{
  const out=interpretSemanticOrder690('Hold Simmons in reserve until the Confederates reach Willis Church Road, then assault their left flank.',semanticState(),{scope:'command',commandId:'simmons',side:'French'});
  assert.equal(out.status,'understood');
  assert.equal(out.action,'Reserve');
  assert.equal(out.postReleaseOrder,'Assault');
  assert.equal(out.targetSide?.side,'Imperial');
  assert.equal(out.targetCommand,null);
  assert.equal(out.region,'left');
  assert.equal(out.terrainReference?.ids[0],'road-willis');
});

test('Auto Tactical Planner creates a command-level plan rather than leaving every command independent',()=>{
  const plan=generateAutoTacticalPlan690(semanticState());
  assert.equal(plan.version,'0.6.9.0');
  assert.ok(plan.armies.French);
  assert.ok(plan.armies.Imperial);
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

test('v0.6.9.0 tactical engine patch applies cleanly to the v0.6.8.1 baseline and installs executable flank/terrain semantics',()=>{
  const baseline=read('src/modules/playtestEngine.js');
  const patched=applyPlaytestEngine690Patch(baseline,{baseUrl:'https://example.invalid/src/modules/playtestEngine.js'});
  assert.match(patched,/function formationFlankAnchor690/);
  assert.match(patched,/releaseTerrainIds/);
  assert.match(patched,/postReleaseOrder/);
  assert.match(patched,/semanticFlankReached/);
  assert.match(patched,/reserve_released/);
  assert.match(patched,/explicitReserveTrigger/);
});

test('v0.6.9.0 overlay contains Scenario Library, fail-closed interpretation, Auto Plan and one-file AI exchange wiring',()=>{
  const nav=read('src/modules/navigation.js'),release=read('src/modules/release690.js'),library=read('src/modules/scenarioLibrary.js'),external=read('src/modules/externalAiExchange.js'),patch=read('src/modules/playtestEngine690Patch.js'),worker=read('src/modules/playtestWorker.js');
  assert.match(nav,/release690\.js\?v=0\.6\.9\.0/);
  assert.match(release,/validateTacticalPlanWorkspace690/);
  assert.match(release,/Playtest not started/);
  assert.match(release,/Preview Auto Plan/);
  assert.match(release,/patchPlaytestWorkerCacheBust/);
  assert.match(patch,/semanticFlankFormationTarget690/);
  assert.match(patch,/formationFlankAnchor690/);
  assert.match(patch,/terrainReleaseState690/);
  assert.match(patch,/releaseTerrainIds/);
  assert.match(patch,/postReleaseOrder/);
  assert.match(patch,/namedCandidate\.id!==command\?\.id/);
  assert.match(worker,/playtestEngine690\.js\?v=0\.6\.9\.0/);
  assert.match(library,/scenarios\/index\.json/);
  assert.match(library,/migrateImportedProject/);
  assert.match(external,/Download AI Package \(\.zip\)/);
  assert.match(external,/Import AI Response \(\.zip\/.json\)/);
  assert.match(external,/Battle_Axe_Tactical_AI_Request\.zip/);
  const catalog=JSON.parse(read('scenarios/index.json'));
  assert.equal(catalog.format,'battle-axe-scenario-library');
});
