import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reparentCommand, removeCommand, wouldCreateCommandCycle, validateCommandHierarchy } from '../src/modules/commandHierarchy.js';
import { applyAiChangesetToScenario, buildAiBrief } from '../src/modules/aiBridge.js';
import { nearestBattlefieldEdge, edgeEntryLine } from '../src/modules/deploymentEditor.js';
import { createInitialState, migrateScenario, PROJECT_SCHEMA_VERSION } from '../src/app/state.js';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');

function baseScenario(){
  return {
    metadata:{title:'Hierarchy fixture'},
    ruleset:{core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'0.1'},
    commands:{sideA:[],sideB:[]},
    deployment:{placements:{},commanderPlacements:{},zones:[]},
    suggestions:[],
    structuredRules:{turnOneInitiative:''}
  };
}

function change(target_type,action,target_id,target_side,proposed_value={}){
  return {id:`${target_type}-${target_id||action}`,target_type,action,target_id,target_side,proposed_value,rationale:'fixture',confidence:.9};
}

test('command tree supports drag/drop semantics: reparent, reject cycles, and promote children on safe delete',()=>{
  const s=baseScenario();
  s.commands.sideA=[
    {id:'army',name:'Army',commandType:'Army',units:[]},
    {id:'div',name:'Division',commandType:'Division',units:[]},
    {id:'brig',name:'Brigade',commandType:'Brigade',units:[{id:'u1'}]}
  ];
  reparentCommand(s,'sideA','div','army');
  reparentCommand(s,'sideA','brig','div');
  assert.equal(s.commands.sideA.find(c=>c.id==='brig').parentCommandId,'div');
  assert.equal(wouldCreateCommandCycle(s,'army','brig'),true);
  assert.throws(()=>reparentCommand(s,'sideA','army','brig'),/descendants|cycle|cannot/i);
  const removed=removeCommand(s,'sideA','div',{mode:'promote'});
  assert.deepEqual(removed.removedCommandIds,['div']);
  assert.equal(s.commands.sideA.find(c=>c.id==='brig').parentCommandId,'army');
  assert.deepEqual(validateCommandHierarchy(s),[]);
});

test('external AI Bridge applies hierarchical commands and unit assignment as one validated changeset',()=>{
  const s=baseScenario();
  const changeset={format:'battle-axe-studio-changeset',version:'1.2',changes:[
    change('command','add','army','Side A',{commandId:'army',name:'Union Army',commandType:'Army',commanderName:'Army Commander',commandRating:2}),
    change('command','add','div','Side A',{commandId:'div',name:'McCall’s Division',commandType:'Division',parentCommandId:'army',commanderName:'McCall',commandRating:1}),
    change('command','add','brig','Side A',{commandId:'brig',name:'Meade’s Second Brigade',commandType:'Brigade',parentCommandId:'div',commanderName:'Meade',commandRating:2}),
    change('unit','add','regt','Side A',{unitId:'regt',name:'3rd Pennsylvania Reserves',profile:'Infantry',command_id:'brig'})
  ]};
  const out=applyAiChangesetToScenario(s,changeset);
  assert.equal(out.commands.sideA.find(c=>c.id==='div').parentCommandId,'army');
  assert.equal(out.commands.sideA.find(c=>c.id==='brig').parentCommandId,'div');
  assert.equal(out.commands.sideA.find(c=>c.id==='brig').commandType,'Brigade');
  assert.equal(out.commands.sideA.find(c=>c.id==='brig').units[0].id,'regt');
  assert.deepEqual(validateCommandHierarchy(out),[]);
  assert.equal(s.commands.sideA.length,0,'Apply All must leave the input scenario untouched and commit only the validated clone');
});

test('external AI Bridge rejects a circular hierarchy atomically',()=>{
  const s=baseScenario();
  s.commands.sideA=[
    {id:'a',name:'A',commandType:'Division',parentCommandId:null,units:[]},
    {id:'b',name:'B',commandType:'Brigade',parentCommandId:'a',units:[]}
  ];
  const before=structuredClone(s);
  const changeset={format:'battle-axe-studio-changeset',version:'1.2',changes:[
    change('command','modify','a','Side A',{parentCommandId:'b'})
  ]};
  assert.throws(()=>applyAiChangesetToScenario(s,changeset),/cycle|circular/i);
  assert.deepEqual(s,before);
});

test('AI brief advertises generic command hierarchy and Apply All rather than line-by-line approval',()=>{
  const st=createInitialState();
  const brief=buildAiBrief(st,'Review command structure');
  assert.match(brief,/commandType/);
  assert.match(brief,/parentCommandId/);
  assert.match(brief,/Apply All Changes/);
  assert.doesNotMatch(brief,/Accept \/ Reject/i);
});

test('reserve entry geometry helpers support click-to-edge and visual edge portions',()=>{
  assert.equal(nearestBattlefieldEdge({x:3,y:40}),'west');
  assert.equal(nearestBattlefieldEdge({x:60,y:97}),'south');
  assert.deepEqual(edgeEntryLine('north',20,60),{x1:20,y1:0,x2:60,y2:0});
  assert.deepEqual(edgeEntryLine('west',80,30),{x1:0,y1:30,x2:0,y2:80});
});

test('v0.6.8.0 authoring UI exposes hierarchy drag/drop, delete, undo/redo, visual reserve tools, and Apply All',()=>{
  const html=read('index.html'),forces=read('src/modules/scenarioBuilder.js'),deployment=read('src/modules/deploymentEditor.js'),bridge=read('src/modules/aiBridge.js');
  for(const id of ['forceUndo','forceRedo','deploymentUndo','deploymentRedo','deploymentToolStatus','applyAllAiChanges','cancelAiChanges','undoAiApply'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(forces,/application\/x-bax-command/);
  assert.match(forces,/data-delete-command/);
  assert.match(forces,/unit-card-delete/);
  assert.match(forces,/command-root-dropzone/);
  assert.match(deployment,/data-reserve-entry="point"/);
  assert.match(deployment,/data-reserve-entry="edge"/);
  assert.match(deployment,/data-reserve-entry="edge-segment"/);
  assert.match(deployment,/data-reserve-entry="zone"/);
  assert.match(deployment,/Escape|key==='Escape'/);
  assert.match(bridge,/Apply All Changes/);
  assert.doesNotMatch(html,/explicit Accept \/ Reject review/i);
});

test('schema 1.2 migrates legacy echelon into commandType while preserving parent command IDs',()=>{
  assert.equal(PROJECT_SCHEMA_VERSION,'1.2.0');
  const migrated=migrateScenario({commands:{sideA:[
    {id:'div',name:'Division',echelon:'Division',units:[]},
    {id:'brig',name:'Brigade',echelon:'Brigade',parentCommandId:'div',units:[]}
  ],sideB:[]},deployment:{placements:{},commanderPlacements:{},zones:[]}});
  assert.equal(migrated.commands.sideA.find(c=>c.id==='brig').commandType,'Brigade');
  assert.equal(migrated.commands.sideA.find(c=>c.id==='brig').parentCommandId,'div');
});
