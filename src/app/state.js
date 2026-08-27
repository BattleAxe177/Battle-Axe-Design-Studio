import { createBlankScenario } from '../data/scenarioData.js?v=0.6.6.0';
import { ensureTwoSideModel, registerEvidenceSides } from '../modules/scenarioSides.js?v=0.6.6.0';

export const STORAGE_KEY='battle-axe-design-studio-v040a3';

export function createInitialState(){
  const project={
    id:'untitled',
    name:'Untitled Scenario',
    version:'studio-project',
    playSpace:{width:48,height:48,units:'inches',origin:'northwest'},
    historicalContext:'',
    mapNotes:'',
    features:[],
    candidates:[],
    manualFeatures:[],
    mapSource:null,
    battlefieldRevision:null,
    scenario:createBlankScenario()
  };
  return{project,playtestWorkspace:{armyOrders:{},commandOrders:{},cueLevel:'standard'},decisions:{},ignoredCandidates:{},importedCandidateIds:[],selectedFeatureId:null,selectedFeatureIds:[],selectedCandidateId:null,selectedCandidateIds:[]};
}

export function migrateScenario(saved){
  const blank=createBlankScenario(),s={...blank,...(saved||{})};
  s.ruleset={...blank.ruleset,...(saved?.ruleset||{})};
  const legacyBase=Number(saved?.tabletop?.unitBaseMm||blank.tabletop.unitBaseMm||50);
  s.tabletop={...blank.tabletop,...(saved?.tabletop||{})};
  s.tabletop.unitBaseWidthMm=Number(saved?.tabletop?.unitBaseWidthMm||legacyBase);
  s.tabletop.unitBaseDepthMm=Number(saved?.tabletop?.unitBaseDepthMm||legacyBase);
  s.tabletop.unitBaseMm=Number(saved?.tabletop?.unitBaseMm||s.tabletop.unitBaseWidthMm); // legacy compatibility alias
  s.commands={...(saved?.commands||{})};
  // alpha compatibility: move flat rosters into one default command per side.
  if(saved?.rosters){
    for(const faction of Object.keys(saved.rosters||{})){
      if(!(saved.rosters[faction]||[]).length)continue;
      s.commands[faction]=s.commands[faction]||[];
      if(!s.commands[faction].length)s.commands[faction]=[{id:`migrated-${faction.toLowerCase()}`,name:`${faction} Main Command`,commander:'',units:saved.rosters[faction]}];
    }
  }
  registerEvidenceSides(s,s.sourceForces||[],s.sourceCommands||[]);
  ensureTwoSideModel(s);
  s.deployment={...blank.deployment,...(saved?.deployment||{}),placements:{...(saved?.deployment?.placements||{})},commanderPlacements:{...(saved?.deployment?.commanderPlacements||{})},zones:[...(saved?.deployment?.zones||[])]};
  return s;
}

function validateMigratedProject(state){
  const p=state?.project,s=p?.scenario;
  if(!p||!s||typeof s!=='object')throw new Error('Migrated import is missing a scenario.');
  if(!p.playSpace||!Number.isFinite(Number(p.playSpace.width))||Number(p.playSpace.width)<=0||!Number.isFinite(Number(p.playSpace.height))||Number(p.playSpace.height)<=0)throw new Error('Migrated import has an invalid battlefield size.');
  if(!s.commands||typeof s.commands!=='object'||!s.deployment||typeof s.deployment!=='object')throw new Error('Migrated import is missing current command/deployment structures.');
  return true;
}

export function migrateImportedProject(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Project JSON must contain an object.');
  const raw=structuredClone(input),base=createInitialState(),steps=[],warnings=[],sourceVersion=String(raw.version||raw.project?.version||raw.scenario?.version||'legacy/unknown');let projectSource=null,wrapper={};
  if(raw.format==='battle-axe-studio-project'&&raw.project){projectSource=raw.project;wrapper=raw;steps.push('recognized Battle Axe Studio project export');}
  else if(raw.project&&typeof raw.project==='object'){projectSource=raw.project;wrapper=raw;steps.push('accepted legacy project wrapper without current format marker');warnings.push('Legacy export had no current format marker; loaded through migration pipeline.');}
  else if(raw.scenario&&typeof raw.scenario==='object'){projectSource={scenario:raw.scenario,playSpace:raw.playSpace,mapSource:raw.mapSource,features:raw.features,candidates:raw.candidates,manualFeatures:raw.manualFeatures,battlefieldRevision:raw.battlefieldRevision};wrapper=raw;steps.push('wrapped legacy top-level scenario into current project shell');}
  else if(raw.metadata||raw.commands||raw.rosters||raw.deployment){projectSource={scenario:raw};steps.push('wrapped scenario-only JSON into current project shell');warnings.push('Scenario-only import did not include full Studio battlefield/terrain workspace state.');}
  else throw new Error('Unrecognized Battle Axe project/scenario JSON. No recoverable project or scenario structure was found.');

  base.project={...base.project,...(projectSource||{})};
  base.project.playSpace={...createInitialState().project.playSpace,...(projectSource?.playSpace||{})};
  base.project.features=Array.isArray(projectSource?.features)?projectSource.features:[];
  base.project.candidates=Array.isArray(projectSource?.candidates)?projectSource.candidates:[];
  base.project.manualFeatures=Array.isArray(projectSource?.manualFeatures)?projectSource.manualFeatures:[];
  base.project.mapSource=projectSource?.mapSource||null;
  base.project.battlefieldRevision=projectSource?.battlefieldRevision||projectSource?.mapSource?.battlefieldRevision||null;
  base.project.scenario=migrateScenario(projectSource?.scenario||projectSource||{});
  const sm=base.project.scenario?.metadata||{};
  if((!projectSource?.name||projectSource?.name==='Untitled Scenario')&&sm.title)base.project.name=sm.title;
  if((!projectSource?.id||projectSource?.id==='untitled')&&sm.title)base.project.id=String(sm.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'imported-scenario';
  if(!projectSource?.playSpace&&sm.tableSize){const m=String(sm.tableSize).match(/(\d+(?:\.\d+)?)\D+[×xX]\D*(\d+(?:\.\d+)?)/);if(m)base.project.playSpace={...base.project.playSpace,width:Number(m[1]),height:Number(m[2]),units:'inches',origin:'northwest'};}

  base.playtestWorkspace={armyOrders:{},commandOrders:{},cueLevel:'standard',...(wrapper.playtestWorkspace||{})};
  base.playtestWorkspace.armyOrders={...(wrapper.playtestWorkspace?.armyOrders||{})};
  base.playtestWorkspace.commandOrders={...(wrapper.playtestWorkspace?.commandOrders||{})};
  base.decisions=wrapper.decisions&&typeof wrapper.decisions==='object'?wrapper.decisions:{};
  base.ignoredCandidates=wrapper.ignoredCandidates&&typeof wrapper.ignoredCandidates==='object'?wrapper.ignoredCandidates:{};
  base.importedCandidateIds=Array.isArray(wrapper.importedCandidateIds)?wrapper.importedCandidateIds:[];
  base.selectedFeatureIds=Array.isArray(wrapper.selectedFeatureIds)?wrapper.selectedFeatureIds:[];
  steps.push('migrated scenario fields and supplied defaults for current ruleset/deployment/two-side model');
  validateMigratedProject(base);steps.push('validated migrated project against current minimum structural requirements');
  return{state:base,migration:{sourceVersion,steps,warnings}};
}

// Compatibility facade retained for the v0.6.0.3 importer contract. All paths still use the
// newer migration pipeline so legacy files are upgraded in memory before validation.
export function normalizeImportedState(data){
  if(!data||typeof data!=='object')return migrateImportedProject(data).state;
  if(data.project&&typeof data.project==='object')return migrateImportedProject(data).state;
  if(data.scenario&&typeof data.scenario==='object')return migrateImportedProject(data).state;
  if(data.metadata&&(data.commands||data.rosters||data.deployment))return migrateImportedProject(data).state;
  return migrateImportedProject(data).state;
}

export function loadState(storage=window.localStorage){
  const base=createInitialState();
  try{
    const raw=storage.getItem(STORAGE_KEY);if(!raw)return{state:base,storageOkay:true};
    const saved=JSON.parse(raw),migrated=migrateImportedProject(saved),loaded=migrated.state;
    loaded.selectedCandidateIds=[];loaded.selectedFeatureId=null;loaded.selectedCandidateId=null;
    return{state:loaded,storageOkay:true,migration:migrated.migration};
  }catch(error){console.warn('Battle Axe state reset after load error',error);return{state:base,storageOkay:false};}
}

export function saveState(state,storage=window.localStorage){
  storage.setItem(STORAGE_KEY,JSON.stringify({
    project:state.project,
    playtestWorkspace:state.playtestWorkspace||{armyOrders:{},commandOrders:{},cueLevel:'standard'},
    decisions:state.decisions||{},
    ignoredCandidates:state.ignoredCandidates||{},
    importedCandidateIds:state.importedCandidateIds||[],
    selectedFeatureIds:state.selectedFeatureIds||[]
  }));
}
