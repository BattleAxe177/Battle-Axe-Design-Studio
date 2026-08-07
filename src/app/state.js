import { paviaProject } from '../data/paviaProject.js?v=0.4.0-alpha.1';
import { createBlankScenario } from '../data/scenarioData.js?v=0.4.0-alpha.1';

export const STORAGE_KEY = 'battle-axe-design-studio-v040a1';

export function createInitialState() {
  const project=structuredClone(paviaProject);
  project.scenario=createBlankScenario();
  return {
    project,
    decisions: {},
    ignoredCandidates: {},
    importedCandidateIds: [],
    selectedFeatureId: null,
    selectedFeatureIds: [],
    selectedCandidateId: null,
    selectedCandidateIds: []
  };
}

export function loadState(storage = window.localStorage) {
  const base = createInitialState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: base, storageOkay: true };
    const saved = JSON.parse(raw);
    base.decisions = saved.decisions || {};
    base.ignoredCandidates = saved.ignoredCandidates || {};
    base.importedCandidateIds = saved.importedCandidateIds || [];
    base.selectedFeatureIds = saved.selectedFeatureIds || [];
    if (saved.project?.playSpace) base.project.playSpace = {...base.project.playSpace, ...saved.project.playSpace};
    if (typeof saved.project?.historicalContext === 'string') base.project.historicalContext = saved.project.historicalContext;
    if (typeof saved.project?.mapNotes === 'string') base.project.mapNotes = saved.project.mapNotes;
    if (saved.project?.scenario) base.project.scenario = {...createBlankScenario(), ...saved.project.scenario, rosters:{...createBlankScenario().rosters,...(saved.project.scenario.rosters||{})}};
    return { state: base, storageOkay: true };
  } catch (error) {
    console.warn('Unable to load local Studio state:', error);
    return { state: base, storageOkay: false };
  }
}

export function saveState(state, storage = window.localStorage) {
  const payload = {
    project: {
      playSpace: state.project.playSpace,
      historicalContext: state.project.historicalContext,
      mapNotes: state.project.mapNotes,
      scenario: state.project.scenario
    },
    decisions: state.decisions,
    ignoredCandidates: state.ignoredCandidates,
    importedCandidateIds: state.importedCandidateIds,
    selectedFeatureIds: state.selectedFeatureIds
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
