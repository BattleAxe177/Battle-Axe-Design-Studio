import { paviaProject } from '../data/paviaProject.js';

export const STORAGE_KEY = 'battle-axe-design-studio-v033';

export function createInitialState() {
  return {
    project: structuredClone(paviaProject),
    decisions: {},
    ignoredCandidates: {},
    importedCandidateIds: [],
    selectedFeatureId: null,
    selectedCandidateId: null
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
    if (saved.project?.playSpace) base.project.playSpace = {...base.project.playSpace, ...saved.project.playSpace};
    if (typeof saved.project?.historicalContext === 'string') base.project.historicalContext = saved.project.historicalContext;
    if (typeof saved.project?.mapNotes === 'string') base.project.mapNotes = saved.project.mapNotes;
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
      mapNotes: state.project.mapNotes
    },
    decisions: state.decisions,
    ignoredCandidates: state.ignoredCandidates,
    importedCandidateIds: state.importedCandidateIds
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
