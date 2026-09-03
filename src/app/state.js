import { createBlankScenario } from '../data/scenarioData.js?v=0.6.9.1';
import { ensureTwoSideModel, registerEvidenceSides } from '../modules/scenarioSides.js?v=0.6.9.1';
import { normalizeCommandHierarchy } from '../modules/commandHierarchy.js?v=0.6.9.1';

export const STORAGE_KEY='battle-axe-design-studio-v040a3';
export const IMPORT_BACKUP_KEY='battle-axe-design-studio-pre-import-backup';
export const PROJECT_FORMAT='battle-axe-studio-project';
export const PROJECT_SCHEMA_VERSION='1.2.0';

export function createInitialState(){
  const project={
    id:'untitled',
    name:'Untitled Scenario',
    version:'studio-project',
    schemaVersion:PROJECT_SCHEMA_VERSION,
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
  s.structuredRules={...blank.structuredRules,...(saved?.structuredRules||{})};
  s.publication={...blank.publication,...(saved?.publication||{}),historical:{...blank.publication.historical,...(saved?.publication?.historical||{})},battlefield:{...blank.publication.battlefield,...(saved?.publication?.battlefield||{})}};
  s.proposals={...blank.proposals,...(saved?.proposals||{})};for(const key of Object.keys(blank.proposals))s.proposals[key]=Array.isArray(saved?.proposals?.[key])?[...saved.proposals[key]]:[];
  s.scenarioRules=Array.isArray(saved?.scenarioRules)?[...saved.scenarioRules]:(saved?.suggestions||[]).filter(x=>x.status==='accepted').map(x=>({id:x.id,title:x.title||'Scenario rule',text:x.proposal||'',engineStatus:x.engineStatus||'tabletop',engineText:x.engineText||'',overrides:x.overrides||'',status:'active',provenance:x.provenance||'legacy',evidence:x.evidence||''}));
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
  normalizeCommandHierarchy(s);
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
  const raw=structuredClone(input),base=createInitialState(),steps=[],warnings=[],sourceVersion=String(raw.schemaVersion||raw.version||raw.project?.schemaVersion||raw.project?.version||raw.scenario?.version||'legacy/unknown');let projectSource=null,wrapper={};
  if(raw.format===PROJECT_FORMAT&&raw.project){projectSource=raw.project;wrapper=raw;steps.push(`recognized Battle Axe Studio project export schema ${raw.schemaVersion||'legacy'}`);}
  else if(raw.project&&typeof raw.project==='object'){projectSource=raw.project;wrapper=raw;steps.push('accepted legacy project wrapper without current format marker');warnings.push('Legacy export had no current format marker; loaded through migration pipeline.');}
  else if(raw.scenario&&typeof raw.scenario==='object'){projectSource={scenario:raw.scenario,playSpace:raw.playSpace,mapSource:raw.mapSource,features:raw.features,candidates:raw.candidates,manualFeatures:raw.manualFeatures,battlefieldRevision:raw.battlefieldRevision};wrapper=raw;steps.push('wrapped legacy top-level scenario into current project shell');}
  else if(raw.metadata||raw.commands||raw.rosters||raw.deployment){projectSource={scenario:raw};steps.push('wrapped scenario-only JSON into current project shell');warnings.push('Scenario-only import did not include full Studio battlefield/terrain workspace state.');}
  else throw new Error('Unrecognized Battle Axe project/scenario JSON. No recoverable project or scenario structure was found.');

  base.project={...base.project,...(projectSource||{}),schemaVersion:PROJECT_SCHEMA_VERSION};
  base.project.playSpace={...createInitialState().project.playSpace,...(projectSource?.playSpace||{})};
  base.project.features=Array.isArray(projectSource?.features)?projectSource.features:[];
  base.project.candidates=Array.isArray(projectSource?.candidates)?projectSource.candidates:[];
  base.project.manualFeatures=Array.isArray(projectSource?.manualFeatures)?projectSource.manualFeatures:[];
  base.project.mapSource=projectSource?.mapSource||null;
  base.project.battlefieldRevision=projectSource?.battlefieldRevision||projectSource?.mapSource?.battlefieldRevision||null;
  base.project.scenario=migrateScenario(projectSource?.scenario||projectSource||{});
  base.playtestWorkspace={armyOrders:{},commandOrders:{},cueLevel:'standard',...(wrapper.playtestWorkspace||{})};
  const legacyArmyOrders=wrapper.playtestWorkspace?.armyOrders||{};
  base.playtestWorkspace.armyOrders={...(legacyArmyOrders.sideA?{sideA:legacyArmyOrders.sideA}:legacyArmyOrders.French?{sideA:legacyArmyOrders.French}:{}),...(legacyArmyOrders.sideB?{sideB:legacyArmyOrders.sideB}:legacyArmyOrders.Imperial?{sideB:legacyArmyOrders.Imperial}:{})};
  base.playtestWorkspace.commandOrders={...(wrapper.playtestWorkspace?.commandOrders||{})};
  base.decisions=wrapper.decisions&&typeof wrapper.decisions==='object'?wrapper.decisions:{};
  base.ignoredCandidates=wrapper.ignoredCandidates&&typeof wrapper.ignoredCandidates==='object'?wrapper.ignoredCandidates:{};
  base.importedCandidateIds=Array.isArray(wrapper.importedCandidateIds)?wrapper.importedCandidateIds:[];
  base.selectedFeatureIds=Array.isArray(wrapper.selectedFeatureIds)?wrapper.selectedFeatureIds:[];
  // Preserve unrecognized wrapper fields so a load/save cycle does not silently destroy
  // extension/plugin data from another Studio generation.
  const knownWrapper=new Set(['format','schemaVersion','studioVersion','version','exportedAt','project','playtestWorkspace','decisions','ignoredCandidates','importedCandidateIds','selectedFeatureIds']);
  const unknownWrapper=Object.fromEntries(Object.entries(wrapper||{}).filter(([k])=>!knownWrapper.has(k)));
  if(Object.keys(unknownWrapper).length)base.compatibility={...(base.compatibility||{}),preservedEnvelope:unknownWrapper};
  if(sourceVersion!==PROJECT_SCHEMA_VERSION)steps.push(`migrated project schema ${sourceVersion} → ${PROJECT_SCHEMA_VERSION}`);
  steps.push('migrated scenario fields and supplied defaults for current ruleset/deployment/two-side model');
  validateMigratedProject(base);steps.push('validated migrated project against current minimum structural requirements');
  const capabilities={
    containsBattlefield:!!projectSource?.mapSource,
    containsCompiledTerrain:Array.isArray(projectSource?.features)&&projectSource.features.length>0,
    containsDeployment:!!projectSource?.scenario?.deployment||!!raw?.deployment,
    scenarioOnly:!(raw.format===PROJECT_FORMAT&&raw.project)&&!(raw.project&&typeof raw.project==='object')
  };
  return{state:base,migration:{sourceVersion,steps,warnings,capabilities}};
}

function titleKey(state){return String(state?.project?.scenario?.metadata?.title||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');}
function deploymentHasPlacements(deployment){return Object.keys(deployment?.placements||{}).length>0||Object.keys(deployment?.commanderPlacements||{}).length>0||(deployment?.zones||[]).length>0;}

// Legacy scenario-only exports from older Studio releases did not contain the compiled battlefield.
// If the designer elects to keep the current battlefield, preserve the entire authoritative battlefield
// workspace rather than silently replacing it with an empty 48x48 shell. When the imported scenario
// has the same title and contains no placements, preserve the current deployment as well: it is the only
// recoverable copy and is already tied to the retained battlefield revision.
export function mergeImportedScenarioWithCurrentBattlefield(imported,current,{preserveDeploymentWhenSafe=true}={}){
  if(!imported?.project||!current?.project?.mapSource)return imported;
  const out=structuredClone(imported),cur=current;
  out.project.playSpace=structuredClone(cur.project.playSpace);
  out.project.mapSource=structuredClone(cur.project.mapSource);
  out.project.battlefieldRevision=cur.project.battlefieldRevision||cur.project.mapSource?.battlefieldRevision||null;
  out.project.features=structuredClone(cur.project.features||[]);
  out.project.candidates=structuredClone(cur.project.candidates||[]);
  out.project.manualFeatures=structuredClone(cur.project.manualFeatures||[]);
  out.project.mapNotes=cur.project.mapNotes||out.project.mapNotes||'';
  out.decisions=structuredClone(cur.decisions||{});
  out.ignoredCandidates=structuredClone(cur.ignoredCandidates||{});
  out.importedCandidateIds=[...(cur.importedCandidateIds||[])];
  out.selectedFeatureIds=[];
  const sameScenario=!!titleKey(out)&&titleKey(out)===titleKey(cur);
  const importedDeployment=out.project.scenario?.deployment;
  const currentDeployment=cur.project.scenario?.deployment;
  if(preserveDeploymentWhenSafe&&sameScenario&&!deploymentHasPlacements(importedDeployment)&&deploymentHasPlacements(currentDeployment)){
    out.project.scenario.deployment=structuredClone(currentDeployment);
  }else if(out.project.scenario?.deployment){
    out.project.scenario.deployment.battlefieldRevision=out.project.battlefieldRevision;
  }
  return out;
}

export function savePreImportBackup(state,storage=window.localStorage,{studioVersion='unknown'}={}){
  if(!state?.project)return false;
  storage.setItem(IMPORT_BACKUP_KEY,JSON.stringify(createProjectExportPayload(state,{studioVersion})));
  return true;
}

export function loadPreImportBackup(storage=window.localStorage){
  const raw=storage.getItem(IMPORT_BACKUP_KEY);
  if(!raw)return null;
  return migrateImportedProject(JSON.parse(raw)).state;
}

export function createProjectExportPayload(state,{studioVersion='unknown',exportedAt=new Date().toISOString()}={}){
  const preserved=state?.compatibility?.preservedEnvelope&&typeof state.compatibility.preservedEnvelope==='object'?state.compatibility.preservedEnvelope:{};
  return{
    ...structuredClone(preserved),
    format:PROJECT_FORMAT,
    schemaVersion:PROJECT_SCHEMA_VERSION,
    studioVersion,
    version:studioVersion, // legacy readers used version
    exportedAt,
    project:structuredClone(state.project),
    playtestWorkspace:structuredClone(state.playtestWorkspace||{armyOrders:{},commandOrders:{},cueLevel:'standard'}),
    decisions:structuredClone(state.decisions||{}),
    ignoredCandidates:structuredClone(state.ignoredCandidates||{}),
    importedCandidateIds:[...(state.importedCandidateIds||[])],
    selectedFeatureIds:[...(state.selectedFeatureIds||[])]
  };
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
  const payload=createProjectExportPayload(state,{studioVersion:'local-storage'});
  delete payload.exportedAt;
  storage.setItem(STORAGE_KEY,JSON.stringify(payload));
}
