import { createBlankScenario } from '../data/scenarioData.js?v=0.6.0.3';
import { ensureTwoSideModel, registerEvidenceSides } from '../modules/scenarioSides.js?v=0.6.0.3';

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

function migrateScenario(saved){
  const blank=createBlankScenario(),s={...blank,...(saved||{})};
  s.ruleset={...blank.ruleset,...(saved?.ruleset||{})};
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

export function loadState(storage=window.localStorage){
  const base=createInitialState();
  try{
    const raw=storage.getItem(STORAGE_KEY);if(!raw)return{state:base,storageOkay:true};
    const saved=JSON.parse(raw),p=saved.project||{};
    base.project={...base.project,...p};
    base.project.playSpace={...createInitialState().project.playSpace,...(p.playSpace||{})};
    base.project.historicalContext=typeof p.historicalContext==='string'?p.historicalContext:'';
    base.project.mapNotes=typeof p.mapNotes==='string'?p.mapNotes:'';
    base.project.features=Array.isArray(p.features)?p.features:[];
    base.project.candidates=Array.isArray(p.candidates)?p.candidates:[];
    base.project.manualFeatures=Array.isArray(p.manualFeatures)?p.manualFeatures:[];
    base.project.mapSource=p.mapSource||null;
    base.project.battlefieldRevision=p.battlefieldRevision||p.mapSource?.battlefieldRevision||null;
    base.project.scenario=migrateScenario(p.scenario);
    base.playtestWorkspace={armyOrders:{},commandOrders:{},cueLevel:'standard',...(saved.playtestWorkspace||{})};
    base.playtestWorkspace.armyOrders={...(saved.playtestWorkspace?.armyOrders||{})};
    base.playtestWorkspace.commandOrders={...(saved.playtestWorkspace?.commandOrders||{})};
    base.decisions=saved.decisions||{};
    base.ignoredCandidates=saved.ignoredCandidates||{};
    base.importedCandidateIds=saved.importedCandidateIds||[];
    base.selectedFeatureIds=saved.selectedFeatureIds||[];
    base.selectedCandidateIds=[];
    base.selectedFeatureId=null;
    base.selectedCandidateId=null;
    return{state:base,storageOkay:true};
  }catch(error){console.warn('Battle Axe state reset after load error',error);return{state:base,storageOkay:false};}
}

export function normalizeImportedState(data){
  const base=createInitialState();
  if(!data||typeof data!=='object')throw new Error('Project JSON is empty or invalid');
  // Current and older full-project exports. Older files may not have the format wrapper.
  if(data.project&&typeof data.project==='object'){
    const project={...base.project,...data.project};
    project.playSpace={...base.project.playSpace,...(data.project.playSpace||{})};
    project.scenario=migrateScenario(data.project.scenario);
    return{...base,...data,project,playtestWorkspace:{...base.playtestWorkspace,...(data.playtestWorkspace||{})}};
  }
  // Legacy raw project object.
  if(data.scenario&&typeof data.scenario==='object'){
    const project={...base.project,...data,scenario:migrateScenario(data.scenario)};
    project.playSpace={...base.project.playSpace,...(data.playSpace||{})};
    return{...base,project};
  }
  // Legacy scenario-only JSON.
  if(data.metadata&&(data.commands||data.rosters||data.deployment)){
    base.project.name=data.metadata?.title||base.project.name;
    base.project.scenario=migrateScenario(data);
    return base;
  }
  throw new Error('Not a recognized Battle Axe Studio project or scenario JSON');
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
