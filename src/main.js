import { loadState, saveState } from './app/state.js';
import { setupNavigation } from './modules/navigation.js';
import { setupFeatureReview } from './modules/featureReview.js';
import { setupGeometryExplorer } from './modules/geometryExplorer.js';

const {state, storageOkay} = loadState();
const $ = selector => document.querySelector(selector);

function persist() {
  try {
    state.project.playSpace.width = Number($('#width').value);
    state.project.playSpace.height = Number($('#height').value);
    state.project.playSpace.units = $('#units').value;
    state.project.playSpace.origin = $('#origin').value;
    state.project.historicalContext = $('#historicalContext').value;
    state.project.mapNotes = $('#mapNotes').value;
    saveState(state);
    $('#saveStatus').textContent = 'Saved';
    setTimeout(() => $('#saveStatus').textContent = 'Ready', 1200);
  } catch (error) {
    console.error(error); $('#saveStatus').textContent = 'Save failed';
  }
}

function populateProject() {
  const p = state.project;
  $('#width').value = p.playSpace.width; $('#height').value = p.playSpace.height; $('#units').value = p.playSpace.units; $('#origin').value = p.playSpace.origin;
  $('#historicalContext').value = p.historicalContext; $('#mapNotes').value = p.mapNotes;
  $('#sidebarProject').textContent = p.name; $('#sidebarSpace').textContent = `${p.playSpace.width} × ${p.playSpace.height} ${p.playSpace.units}`;
}

function setupFiles() {
  ['pptx','pdf','svg'].forEach(id => $(`#${id}`).addEventListener('change', () => {
    const names = ['pptx','pdf','svg'].map(key => $(`#${key}`).files[0]?.name).filter(Boolean);
    $('#fileSummary').textContent = names.length ? `Selected locally: ${names.join(' · ')}` : 'No local source files selected.';
  }));
}

function setupPwa() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed:', error));
  }
}

function finishDiagnostics(mapOkay, features, candidates) {
  $('#diagApp').textContent = 'Ready';
  $('#diagMap').textContent = mapOkay ? 'Loaded' : 'Failed';
  $('#diagFeatures').textContent = `${features} promoted`;
  $('#diagExplorer').textContent = `${candidates} candidates`;
  $('#diagStorage').textContent = storageOkay ? 'Available' : 'Unavailable';
  $('#mapStatus').textContent = mapOkay ? 'Map loaded' : 'Map failed';
  $('#startupBanner').textContent = mapOkay ? `Pavia loaded: ${features} battlefield features plus ${candidates} Geometry Explorer candidates.` : 'Pavia map failed to load. Check the GitHub Pages asset path.';
  setTimeout(() => $('#startupBanner').classList.add('hidden'), mapOkay ? 2800 : 12000);
}

function startup() {
  setupNavigation(); populateProject(); setupFiles(); setupPwa();
  $('#saveButton').addEventListener('click', persist);
  ['width','height','units','origin','historicalContext','mapNotes'].forEach(id => $(`#${id}`).addEventListener('change', persist));
  const featureReview = setupFeatureReview(state, persist);
  setupGeometryExplorer(state, persist, featureReview);
  const map = $('#battlefieldMap');
  const complete = ok => finishDiagnostics(ok, featureReview.currentFeatures().length, state.project.candidates.filter(c => !state.importedCandidateIds.includes(c.id) && !state.ignoredCandidates[c.id]).length);
  if (map.complete) complete(map.naturalWidth > 0); else { map.addEventListener('load', () => complete(true), {once:true}); map.addEventListener('error', () => complete(false), {once:true}); }
}

document.addEventListener('DOMContentLoaded', startup);
