import { paviaProject } from '../data/paviaProject.js?v=0.5.0-ui-preview';
import { createBlankScenario } from '../data/scenarioData.js?v=0.5.0-ui-preview';

export const STORAGE_KEY='battle-axe-design-studio-v040a3';

export function createInitialState(){const project=structuredClone(paviaProject);project.scenario=createBlankScenario();project.manualFeatures=[];return{project,decisions:{},ignoredCandidates:{},importedCandidateIds:[],selectedFeatureId:null,selectedFeatureIds:[],selectedCandidateId:null,selectedCandidateIds:[]};}

function migrateScenario(saved){
  const blank=createBlankScenario(),s={...blank,...(saved||{})};s.ruleset={...blank.ruleset,...(saved?.ruleset||{})};
  s.commands={French:[],Imperial:[],Garrison:[],...(saved?.commands||{})};
  s.deployment={...blank.deployment,...(saved?.deployment||{}),placements:{...(saved?.deployment?.placements||{})},commanderPlacements:{...(saved?.deployment?.commanderPlacements||{})},zones:[...(saved?.deployment?.zones||[])]};
  // alpha.1 compatibility: move flat rosters into one default command per side.
  if(saved?.rosters){for(const faction of ['French','Imperial','Garrison']){if((saved.rosters[faction]||[]).length&&!s.commands[faction].length)s.commands[faction]=[{id:`migrated-${faction.toLowerCase()}`,name:`${faction} Main Command`,commander:'',units:saved.rosters[faction]}];}}
  return s;
}
export function loadState(storage=window.localStorage){const base=createInitialState();try{const raw=storage.getItem(STORAGE_KEY);if(!raw)return{state:base,storageOkay:true};const saved=JSON.parse(raw);base.decisions=saved.decisions||{};base.ignoredCandidates=saved.ignoredCandidates||{};base.importedCandidateIds=saved.importedCandidateIds||[];base.selectedFeatureIds=saved.selectedFeatureIds||[];if(saved.project?.playSpace)base.project.playSpace={...base.project.playSpace,...saved.project.playSpace};if(typeof saved.project?.historicalContext==='string')base.project.historicalContext=saved.project.historicalContext;if(typeof saved.project?.mapNotes==='string')base.project.mapNotes=saved.project.mapNotes;if(saved.project?.scenario)base.project.scenario=migrateScenario(saved.project.scenario);if(Array.isArray(saved.project?.manualFeatures))base.project.manualFeatures=saved.project.manualFeatures;return{state:base,storageOkay:true};}catch(error){console.warn('Battle Axe state reset after load error',error);return{state:base,storageOkay:false};}}
export function saveState(state,storage=window.localStorage){storage.setItem(STORAGE_KEY,JSON.stringify({project:{playSpace:state.project.playSpace,historicalContext:state.project.historicalContext,mapNotes:state.project.mapNotes,scenario:state.project.scenario,manualFeatures:state.project.manualFeatures||[]},decisions:state.decisions,ignoredCandidates:state.ignoredCandidates,importedCandidateIds:state.importedCandidateIds,selectedFeatureIds:state.selectedFeatureIds}));}
