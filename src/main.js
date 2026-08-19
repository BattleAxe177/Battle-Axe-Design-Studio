import { loadState, saveState, createInitialState, STORAGE_KEY } from './app/state.js?v=0.5.1.3';
import { setupNavigation, setupBattlefieldSubnav } from './modules/navigation.js?v=0.5.2.1';
import { setupFeatureReview } from './modules/featureReview.js?v=0.5.0-ui-preview';
import { setupGeometryExplorer } from './modules/geometryExplorer.js?v=0.5.0-ui-preview';
import { loadInlineMap } from './modules/mapView.js?v=0.5.0-ui-preview';
import { detectBattlefieldFeatures } from './modules/battlefieldDetector.js?v=0.5.0-ui-preview';
import { loadStructuredTerrainManifest, inspectPptxAuthoring, manifestStats, classSummary } from './modules/structuredMapCompiler.js?v=0.5.0-ui-preview';
import { setupScenarioBuilder } from './modules/scenarioBuilder.js?v=0.5.0-ui-preview';
import { setupDeploymentEditor } from './modules/deploymentEditor.js?v=0.5.0-ui-preview';
import { setupPlaytestCenter } from './modules/playtestCenter.js?v=0.5.0-ui-preview';
import { setupAiBridge } from './modules/aiBridge.js?v=0.5.0-ui-preview';
import { setupScenarioPublisher } from './modules/scenarioPublisher.js?v=0.5.0-ui-preview';

const VERSION = '0.5.2.1';
window.__BAX_MAIN_STARTED__ = true;
window.__BAX_VERSION__ = VERSION;

const hadSavedProject=(()=>{try{return !!window.localStorage.getItem(STORAGE_KEY);}catch{return false;}})();
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
    setText('#statusSave', 'Saved locally');
    setTimeout(() => setText('#saveStatus', 'Ready'), 1200);
  } catch (error) {
    console.error(error);
    setText('#saveStatus', 'Save failed');
    setText('#statusSave', 'Save failed');
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
  setText('#sidebarProjectTop', p.name);
  setText('#statusProject', p.name);
  setText('#sidebarSpace', `${p.playSpace.width} × ${p.playSpace.height} ${p.playSpace.units}`);
  setText('#runtimeVersion', `v${VERSION}`);
}

function setupFiles() {
  const refreshNames=()=>{
    const names = ['pptx','pdf','svg'].map(key => $(`#${key}`)?.files?.[0]?.name).filter(Boolean);
    setText('#fileSummary', names.length ? `Selected locally: ${names.join(' · ')}` : 'No map source selected.');
  };
  ['pdf','svg'].forEach(id => $(`#${id}`)?.addEventListener('change', refreshNames));
  $('#pptx')?.addEventListener('change', async e => {
    refreshNames(); const file=e.target.files?.[0]; if(!file)return;
    try{
      setText('#fileSummary', `Inspecting ${file.name} locally…`);
      const info=await inspectPptxAuthoring(file);
      setText('#fileSummary', `${file.name}: structured PowerPoint metadata found — ${info.summary||'no recognized Battle Axe terrain groups yet'}. File remains local in your browser.`);
    }catch(error){setText('#fileSummary', `${file.name}: PPTX inventory failed — ${error.message}`);}
  });
}

async function disableDevelopmentCaches() {
  // v0.4.0-alpha.4 deliberately disables the PWA service worker while the runtime is stabilised.
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
  setText('#mapStatus', mapOkay ? (stats.structured ? `Structured PPTX compiler · ${stats.promoted||0} features · ${stats.summary||''} · explorer ${stats.explorer||0}` : `Fallback detector · ${stats.promoted||0} promoted · explorer ${stats.explorer||0}`) : 'Map failed');
  const banner = $('#startupBanner');
  if (banner) {
    banner.textContent = mapOkay
      ? `v${VERSION}: ${stats.structured?'structured PPTX compilation':'fallback scan'} complete — ${features} battlefield features and ${candidates} Geometry Explorer candidates.`
      : `v${VERSION}: map failed to load.`;
    if (mapOkay) setTimeout(() => banner.classList.add('hidden'), 4800);
  }
}


function downloadCurrentProject(){
  // Save the editable scenario plus the map/terrain decisions that define the current Studio project.
  const payload={
    format:'battle-axe-studio-project',
    version:VERSION,
    exportedAt:new Date().toISOString(),
    project:state.project,
    decisions:state.decisions,
    ignoredCandidates:state.ignoredCandidates,
    importedCandidateIds:state.importedCandidateIds,
    selectedFeatureIds:state.selectedFeatureIds
  };
  const title=state.project?.scenario?.metadata?.title||state.project?.name||'battle-axe-scenario';
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${String(title).replace(/[^a-z0-9]+/gi,'_')}_Studio_Project.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}



function setupSampleProjectLoader(){
  $('#loadPaviaSample')?.addEventListener('click',async()=>{
    try{
      const mod=await import('./samples/paviaSample.js?v=0.5.2.1');
      const sampleState=createInitialState();sampleState.project=mod.createPaviaSampleProject();saveState(sampleState);
      window.location.reload();
    }catch(error){alert(`Could not load Pavia sample: ${error.message}`);}
  });
}

function setupHelpAndProjectImport(){
  const help=$('#helpDialog');$('#openHelpBtn')?.addEventListener('click',()=>help?.showModal());$('#closeHelpBtn')?.addEventListener('click',()=>help?.close());
  $('#openProjectBtn')?.addEventListener('click',()=>$('#openProjectFile')?.click());
  $('#openProjectFile')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='battle-axe-studio-project'||!data.project)throw new Error('Not a Battle Axe Studio project export');const restored={...createInitialState(),...data,project:data.project};saveState(restored);window.location.reload();}catch(error){alert(`Could not open project: ${error.message}`);}finally{e.target.value='';}});
}

function setupNewScenario(){
  const modal=$('#newScenarioModal');
  const open=()=>{if(modal)modal.hidden=false;};
  const close=()=>{if(modal)modal.hidden=true;};
  $('#newScenarioBtn')?.addEventListener('click',open);
  $('#closeNewScenarioModal')?.addEventListener('click',close);
  $('#cancelNewScenario')?.addEventListener('click',close);
  modal?.addEventListener('click',e=>{if(e.target===modal)close();});
  $('#exportBeforeNewScenario')?.addEventListener('click',()=>{
    downloadCurrentProject();
    setText('#saveStatus','Project exported');
  });
  $('#confirmNewScenario')?.addEventListener('click',()=>{
    // Remove all persisted scenario-specific state. createInitialState supplies the clean
    // rules-aware project shell; reload ensures every editor drops in-memory map/playtest state.
    try{window.localStorage.removeItem(STORAGE_KEY);}catch(error){console.warn('Could not clear local project storage',error);}
    window.location.reload();
  });
}

async function startup() {
  window.__BAX_STARTUP_ENTERED__ = true;
  try {
    setText('#diagApp', `Initializing · v${VERSION}`);
    setupNavigation();
    setupBattlefieldSubnav();
    setupNewScenario();
    setupHelpAndProjectImport();
    setupSampleProjectLoader();
    const toastHost=document.createElement('div');toastHost.className='toast-host';document.body.appendChild(toastHost);
    document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;b.classList.add('is-working');setTimeout(()=>b.classList.remove('is-working'),180);});
    populateProject();
    setupFiles();
    $('#saveButton')?.addEventListener('click', persist);
    ['width','height','units','origin','historicalContext','mapNotes'].forEach(id => $(`#${id}`)?.addEventListener('change', persist));

    await disableDevelopmentCaches();
    setText('#diagMap', 'Fetching SVG');

    if(!hadSavedProject){
      const featureReview=setupFeatureReview(state,persist,null);
      setupGeometryExplorer(state,persist,featureReview);
      setupScenarioBuilder(state,persist);
      setupDeploymentEditor(state,persist);
      setupPlaytestCenter(state,persist);
      setupAiBridge(state,persist);
      setupScenarioPublisher(state);
      setText('#diagMap','Awaiting map upload');
      setText('#mapStatus','No map loaded');
      finishDiagnostics(true,0,0,{});
      window.__BAX_STARTUP_COMPLETE__=true;
      return;
    }

    const mapSource=state.project.mapSource;
    if(!mapSource?.svg){
      const featureReview=setupFeatureReview(state,persist,null);
      setupGeometryExplorer(state,persist,featureReview);
      setupScenarioBuilder(state,persist);
      setupDeploymentEditor(state,persist);
      setupPlaytestCenter(state,persist);
      setupAiBridge(state,persist);
      setupScenarioPublisher(state);
      setText('#diagMap','Awaiting map upload');
      setText('#mapStatus','No map loaded');
      finishDiagnostics(true,featureReview.currentFeatures().length,0,{});
      window.__BAX_STARTUP_COMPLETE__=true;
      return;
    }

    const mapUrl=new URL(`./${mapSource.svg}?v=${VERSION}`,document.baseURI).href;
    const svg=await loadInlineMap($('#battlefieldMapHost'),mapUrl);
    setText('#diagMap',mapSource.terrain?'Compiling structured terrain':'Analyzing map');

    let stats={};
    try {
      if(!mapSource.terrain)throw new Error('No structured terrain manifest supplied.');
      const manifestUrl=new URL(`./${mapSource.terrain}?v=${VERSION}`,document.baseURI).href;
      const manifest=await loadStructuredTerrainManifest(manifestUrl);
      state.project.features=manifest.features;
      // Legacy visual/raster recognition is now Geometry Explorer-only. It can suggest missed objects but cannot silently replace PPTX-authored terrain.
      const fallback=await detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes});
      state.project.candidates=[...fallback.candidates,...fallback.features.filter(f=>!['Stream','Masonry Wall','Dense Wood','Open Grove','Road','Bridge','Gatehouse','Building','Wet Ground'].includes(f.cls)).map(f=>({...f,id:`explorer-${f.id}`,reason:`Additional visual candidate only. ${f.reason||''}`}))];
      stats={...manifestStats(manifest),summary:classSummary(manifest),explorer:state.project.candidates.length};
    } catch(structuredError) {
      console.warn('Structured compiler fallback:',structuredError);
      const detected=await detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes});
      state.project.features=detected.features;state.project.candidates=detected.candidates;stats=detected.stats||{};
    }

    const featureReview = setupFeatureReview(state, persist, svg);
    setupGeometryExplorer(state, persist, featureReview);
    setupScenarioBuilder(state, persist);
    setupDeploymentEditor(state, persist);
    setupPlaytestCenter(state, persist);
    setupAiBridge(state, persist);
    setupScenarioPublisher(state);
    const candidateCount = state.project.candidates.filter(c => !state.importedCandidateIds.includes(c.id) && !state.ignoredCandidates[c.id]).length;
    finishDiagnostics(true, featureReview.currentFeatures().length, candidateCount, stats);
    window.__BAX_STARTUP_COMPLETE__ = true;
  } catch (error) {
    state.project.features = [];
    state.project.candidates = [];
    try {
      const featureReview = setupFeatureReview(state, persist, null);
      setupGeometryExplorer(state, persist, featureReview);
      setupScenarioBuilder(state, persist);
    setupDeploymentEditor(state, persist);
    setupPlaytestCenter(state, persist);
    setupAiBridge(state, persist);
    setupScenarioPublisher(state);
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
