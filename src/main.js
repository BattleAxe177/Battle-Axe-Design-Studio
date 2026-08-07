import { loadState, saveState } from './app/state.js?v=0.3.3.5';
import { setupNavigation } from './modules/navigation.js?v=0.3.3.5';
import { setupFeatureReview } from './modules/featureReview.js?v=0.3.3.5';
import { setupGeometryExplorer } from './modules/geometryExplorer.js?v=0.3.3.5';
import { loadInlineMap } from './modules/mapView.js?v=0.3.3.5';
import { detectBattlefieldFeatures } from './modules/battlefieldDetector.js?v=0.3.3.5';

const VERSION = '0.3.3.5';
window.__BAX_MAIN_STARTED__ = true;
window.__BAX_VERSION__ = VERSION;

const {state, storageOkay} = loadState();
const $ = selector => document.querySelector(selector);

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function showRuntimeError(error, stage='startup') {
  console.error(`[Battle Axe ${stage}]`, error);
  const message = error?.stack || error?.message || String(error);
  setText('#diagApp', 'Runtime error');
  setText('#mapStatus', 'Initialization failed');
  const banner = $('#startupBanner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.textContent = `Battle Axe ${VERSION} ${stage} failed: ${error?.message || String(error)}`;
  }
  const box = $('#runtimeError');
  if (box) {
    box.hidden = false;
    box.textContent = message;
  }
}

window.addEventListener('error', event => showRuntimeError(event.error || new Error(event.message), 'browser'));
window.addEventListener('unhandledrejection', event => showRuntimeError(event.reason, 'promise'));

function persist() {
  try {
    state.project.playSpace.width = Number($('#width').value);
    state.project.playSpace.height = Number($('#height').value);
    state.project.playSpace.units = $('#units').value;
    state.project.playSpace.origin = $('#origin').value;
    state.project.historicalContext = $('#historicalContext').value;
    state.project.mapNotes = $('#mapNotes').value;
    saveState(state);
    setText('#saveStatus', 'Saved');
    setTimeout(() => setText('#saveStatus', 'Ready'), 1200);
  } catch (error) {
    console.error(error);
    setText('#saveStatus', 'Save failed');
  }
}

function populateProject() {
  const p = state.project;
  $('#width').value = p.playSpace.width;
  $('#height').value = p.playSpace.height;
  $('#units').value = p.playSpace.units;
  $('#origin').value = p.playSpace.origin;
  $('#historicalContext').value = p.historicalContext;
  $('#mapNotes').value = p.mapNotes;
  setText('#sidebarProject', p.name);
  setText('#sidebarSpace', `${p.playSpace.width} × ${p.playSpace.height} ${p.playSpace.units}`);
  setText('#runtimeVersion', `v${VERSION}`);
}

function setupFiles() {
  ['pptx','pdf','svg'].forEach(id => $(`#${id}`)?.addEventListener('change', () => {
    const names = ['pptx','pdf','svg'].map(key => $(`#${key}`)?.files?.[0]?.name).filter(Boolean);
    setText('#fileSummary', names.length ? `Selected locally: ${names.join(' · ')}` : 'No local source files selected.');
  }));
}

async function disableDevelopmentCaches() {
  // v0.3.3.5 deliberately disables the PWA service worker while the runtime is stabilised.
  // This prevents an older cached application shell from masking new GitHub deployments.
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('battle-axe-design-studio-')).map(key => caches.delete(key)));
    }
  } catch (error) {
    console.warn('Cache cleanup warning:', error);
  }
}

function finishDiagnostics(mapOkay, features, candidates, stats={}) {
  setText('#diagApp', `Ready · v${VERSION}`);
  setText('#diagMap', mapOkay ? 'Loaded' : 'Failed');
  setText('#diagFeatures', `${features} promoted`);
  setText('#diagExplorer', `${candidates} candidates`);
  setText('#diagStorage', storageOkay ? 'Available' : 'Unavailable');
  setText('#mapStatus', mapOkay ? `Geometry pipeline · ${stats.raw||0} raw · ${stats.classified||0} classified · ${stats.promoted||0} promoted · ${stats.explorer||0} explorer` : 'Map failed');
  const banner = $('#startupBanner');
  if (banner) {
    banner.textContent = mapOkay
      ? `v${VERSION}: geometry-first scan complete — ${features} battlefield features and ${candidates} Geometry Explorer candidates.`
      : `v${VERSION}: Pavia map failed to load.`;
    if (mapOkay) setTimeout(() => banner.classList.add('hidden'), 4800);
  }
}

async function startup() {
  window.__BAX_STARTUP_ENTERED__ = true;
  try {
    setText('#diagApp', `Initializing · v${VERSION}`);
    setupNavigation();
    populateProject();
    setupFiles();
    $('#saveButton')?.addEventListener('click', persist);
    ['width','height','units','origin','historicalContext','mapNotes'].forEach(id => $(`#${id}`)?.addEventListener('change', persist));

    await disableDevelopmentCaches();
    setText('#diagMap', 'Fetching SVG');

    const mapUrl = new URL(`./projects/pavia/battlefield.svg?v=${VERSION}`, document.baseURI).href;
    const svg = await loadInlineMap($('#battlefieldMapHost'), mapUrl);
    setText('#diagMap', 'Scanning geometry');

    const detected = detectBattlefieldFeatures(svg, {mapNotes: state.project.mapNotes});
    state.project.features = detected.features;
    state.project.candidates = detected.candidates;

    const featureReview = setupFeatureReview(state, persist, svg);
    setupGeometryExplorer(state, persist, featureReview);
    const candidateCount = state.project.candidates.filter(c => !state.importedCandidateIds.includes(c.id) && !state.ignoredCandidates[c.id]).length;
    finishDiagnostics(true, featureReview.currentFeatures().length, candidateCount, detected.stats);
    window.__BAX_STARTUP_COMPLETE__ = true;
  } catch (error) {
    state.project.features = [];
    state.project.candidates = [];
    try {
      const featureReview = setupFeatureReview(state, persist, null);
      setupGeometryExplorer(state, persist, featureReview);
    } catch (secondary) {
      console.error('Fallback UI initialization failed:', secondary);
    }
    finishDiagnostics(false, 0, 0, {});
    showRuntimeError(error, 'initialization');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startup, {once:true});
} else {
  startup();
}
