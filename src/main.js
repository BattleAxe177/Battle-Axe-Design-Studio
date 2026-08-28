import { loadState, saveState, createInitialState, migrateImportedProject, normalizeImportedState, createProjectExportPayload, mergeImportedScenarioWithCurrentBattlefield, savePreImportBackup, loadPreImportBackup, STORAGE_KEY, IMPORT_BACKUP_KEY } from './app/state.js?v=0.6.8.0';
import { setupNavigation, setupBattlefieldSubnav } from './modules/navigation.js?v=0.6.8.0';
import { setupFeatureReview } from './modules/featureReview.js?v=0.6.8.0';
import { setupGeometryExplorer } from './modules/geometryExplorer.js?v=0.6.8.0';
import { loadInlineMap, loadInlineMapText } from './modules/mapView.js?v=0.6.8.0';
import { detectBattlefieldFeatures, findBattlefieldBoundary } from './modules/battlefieldDetector.js?v=0.6.8.0';
import { loadStructuredTerrainManifest, inspectPptxAuthoring, compilePptxTerrain, manifestStats, classSummary } from './modules/structuredMapCompiler.js?v=0.6.8.0';
import { setupScenarioBuilder } from './modules/scenarioBuilder.js?v=0.6.8.0';
import { setupDeploymentEditor } from './modules/deploymentEditor.js?v=0.6.8.0';
import { setupPlaytestCenter } from './modules/playtestCenter.js?v=0.6.8.0';
import { setupAiBridge } from './modules/aiBridge.js?v=0.6.8.0';
import { setupScenarioPublisher } from './modules/scenarioPublisher.js?v=0.6.8.0';
import { newBattlefieldRevision, applyPlayAreaViewBox, serializeBattlefieldSvg, invalidateBattlefieldDependents, syncBattlefieldImages } from './modules/battlefieldState.js?v=0.6.8.0';
import { authoredBoundaryToSvg } from './modules/battlefieldCrop.js?v=0.6.8.0';

const VERSION = '0.6.8.0';
const PROJECT_FORMAT_MARKER = 'battle-axe-studio-project'; // retained for legacy/static import contracts
window.__BAX_MAIN_STARTED__ = true;
window.__BAX_VERSION__ = VERSION;

const {state, storageOkay} = loadState();
const $ = selector => document.querySelector(selector);

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function pctBoxToAbsolute(box,bound){if(!box||!bound)return null;const [x,y,w,h]=box.map(Number);if(![x,y,w,h,bound.x,bound.y,bound.width,bound.height].every(Number.isFinite))return null;return{x:bound.x+x/100*bound.width,y:bound.y+y/100*bound.height,width:w/100*bound.width,height:h/100*bound.height};}
function absoluteBoxToPct(rect,bound){if(!rect||!bound?.width||!bound?.height)return null;return[(rect.x-bound.x)/bound.width*100,(rect.y-bound.y)/bound.height*100,rect.width/bound.width*100,rect.height/bound.height*100];}
function boxIou(a,b){if(!a||!b)return 0;const [ax,ay,aw,ah]=a,[bx,by,bw,bh]=b,x=Math.max(ax,bx),y=Math.max(ay,by),x2=Math.min(ax+aw,bx+bw),y2=Math.min(ay+ah,by+bh),inter=Math.max(0,x2-x)*Math.max(0,y2-y),union=Math.max(.0001,aw*ah+bw*bh-inter);return inter/union;}
function boxCenterDistance(a,b){if(!a||!b)return Infinity;return Math.hypot(a[0]+a[2]/2-(b[0]+b[2]/2),a[1]+a[3]/2-(b[1]+b[3]/2));}
function reconcileStructuredWithSvg(features,detected,authoredCrop){
  const raw=[...(detected?.features||[]),...(detected?.candidates||[])].filter(v=>Array.isArray(v.box)&&v.id!=='visual-source-unresolved');
  const visuals=raw.map(v=>{if(!authoredCrop||!detected?.boundary)return v;const abs=pctBoxToAbsolute(v.box,detected.boundary),box=absoluteBoxToPct(abs,authoredCrop);return{...v,box};}).filter(v=>Array.isArray(v.box)&&v.box.every(Number.isFinite));
  let corroborated=0;
  const reconciled=(features||[]).map(f=>{let best=null;for(const v of visuals){const iou=boxIou(f.box,v.box),distance=boxCenterDistance(f.box,v.box);if(!best||iou>best.iou||(iou===best.iou&&distance<best.distance))best={id:v.id,iou,distance};}const matched=!!best&&(best.iou>=.12||best.distance<=3.5);if(matched)corroborated++;return{...f,visualValidation:{source:'svg',status:matched?'corroborated':'unverified',overlap:Number((best?.iou||0).toFixed(3)),centerDistance:Number((best?.distance??999).toFixed(2)),matchedId:matched?best.id:null}};});
  return{features:reconciled,corroborated,unverified:Math.max(0,reconciled.length-corroborated),visualCandidates:visuals.length};
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
    const names=['pptx','pdf','svg'].map(key=>$(`#${key}`)?.files?.[0]?.name).filter(Boolean);
    setText('#fileSummary',names.length?`Selected locally: ${names.join(' · ')}`:'No map source selected.');
    const ready=!!$('#svg')?.files?.[0];
    $('#generateBattlefield').disabled=!ready;
    const hasPptx=!!$('#pptx')?.files?.[0];
    setText('#battlefieldBuildStatus',ready?(hasPptx?'Ready: PowerPoint authored geometry will be primary; SVG will supply the rendered battlefield.':'Ready to generate from SVG. Add the matching PPTX when available for authored terrain geometry.'):names.length?'Sources selected. Add a browser-readable SVG to render the battlefield.':'Select map source files to begin.');
  };
  ['pdf','svg'].forEach(id=>$(`#${id}`)?.addEventListener('change',refreshNames));
  $('#pptx')?.addEventListener('change',async e=>{
    refreshNames();const file=e.target.files?.[0];if(!file)return;
    try{const info=await inspectPptxAuthoring(file);setText('#fileSummary',`${file.name}: ${info.shapeCount||0} authored shapes inspected · ${info.featureCount||0} terrain features · ${info.candidateCount||0} unresolved geometry. ${info.summary||''} Select the matching SVG to render the battlefield.`);}
    catch(error){setText('#fileSummary',`${file.name}: PPTX inventory failed — ${error.message}`);}
  });
  $('#generateBattlefield')?.addEventListener('click',async()=>{
    const file=$('#svg')?.files?.[0];if(!file)return;
    const button=$('#generateBattlefield');if(button)button.disabled=true;
    try{
      setText('#battlefieldBuildStatus','Compiling battlefield geometry…');
      const sourceText=await file.text();if(!/<(?:[\w.-]+:)?svg[\s>]/i.test(sourceText))throw new Error('Selected vector file is not valid SVG.');
      const playSpace={width:Number($('#width').value||48),height:Number($('#height').value||48),units:$('#units').value,origin:$('#origin').value};
      state.project.playSpace=playSpace;
      state.project.historicalContext=$('#historicalContext').value;
      state.project.mapNotes=$('#mapNotes').value;

      // Parse through the SVG XML path used by normal startup. This is important for
      // PowerPoint-derived SVGs whose root may use an XML namespace prefix.
      const svg=loadInlineMapText($('#battlefieldMapHost'),sourceText);
      // SVG remains the display/cropping source, but a matching PPTX is the preferred
      // gameplay-geometry source because PowerPoint preserves author labels and freeform shapes
      // even when the SVG export rasterizes textured fills.
      const detected=await detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes,playSpace});
      const pptxFile=$('#pptx')?.files?.[0]||null;
      let structured=null;
      if(pptxFile){
        setText('#battlefieldBuildStatus','Reading authored PowerPoint terrain geometry…');
        try{structured=await compilePptxTerrain(pptxFile,{playSpace});}
        catch(error){console.warn('PPTX geometry compiler fallback:',error);structured=null;}
      }
      const hasStructured=!!structured&&(structured.features.length||structured.candidates.length);
      // v0.6.5.0: when PPTX geometry is authoritative, crop the rendered SVG to the same authored black tabletop border.
      // This keeps the visual map, feature overlays, deployment, simulator, and publisher in one coordinate system.
      const authoredCrop=hasStructured?authoredBoundaryToSvg(svg,structured):null;
      const boundary=authoredCrop||detected.boundary;
      applyPlayAreaViewBox(svg,boundary);
      const clippedSvgText=serializeBattlefieldSvg(svg,boundary);
      const revision=newBattlefieldRevision();
      const visualCheck=hasStructured?reconcileStructuredWithSvg(structured.features,detected,authoredCrop):null;
      const structuredFeatures=hasStructured?(visualCheck?.features||structured.features):[];
      const secondaryVisual=(detected.candidates||[]).filter(c=>c.cls==='Unknown'||c.category==='Generic source geometry'||c.category==='Compiler diagnostic').slice(0,12);
      const finalFeatures=hasStructured?structuredFeatures:(detected.features||[]);
      const finalCandidates=hasStructured?[...(structured.candidates||[]),...secondaryVisual]:(detected.candidates||[]);
      const compileStats=hasStructured?{...structured.stats,visualPromoted:detected.features?.length||0,visualExplorer:detected.candidates?.length||0,svgCorroborated:visualCheck?.corroborated||0,svgUnverified:visualCheck?.unverified||0,explorer:finalCandidates.length,promoted:finalFeatures.length}:detected.stats||{};

      state.project.mapSource={
        kind:'local-svg',name:file.name,svgText:clippedSvgText,playArea:boundary,battlefieldRevision:revision,
        compileStats,
        authoring:{pptx:pptxFile?.name||null,pdf:$('#pdf')?.files?.[0]?.name||null,geometrySource:hasStructured?'pptx':'svg',cropSource:authoredCrop?'pptx-boundary':'svg-boundary',pptxSummary:structured?.stats?.summary||null,svgValidation:hasStructured?`${visualCheck?.corroborated||0}/${structuredFeatures.length} authored features geometrically corroborated by SVG detector candidates`:'not applicable',pdfValidation:$('#pdf')?.files?.[0]?'appearance reference registered (not geometry-authoritative)':'not supplied'}
      };
      state.project.battlefieldRevision=revision;
      state.project.features=finalFeatures;
      state.project.candidates=finalCandidates;
      state.project.manualFeatures=[];
      state.decisions={};state.ignoredCandidates={};state.importedCandidateIds=[];state.selectedFeatureIds=[];state.selectedCandidateIds=[];state.selectedFeatureId=null;state.selectedCandidateId=null;
      invalidateBattlefieldDependents(state,revision,{clearDeployment:true});
      saveState(state);

      const total=state.project.features.length+state.project.candidates.length;
      const diagnosticOnly=!hasStructured&&!!detected.stats?.diagnosticOnly;
      sessionStorage.setItem('bax-battlefield-build-status',diagnosticOnly
        ? `${file.name}: map imported, but terrain segmentation was inconclusive. A diagnostic candidate was retained in Geometry Explorer instead of reporting a silent zero-feature success.`
        : total
          ? `${file.name}: ${state.project.features.length} review feature(s), ${state.project.candidates.length} Geometry Explorer candidate(s)${hasStructured?' · PowerPoint-authored geometry primary':''}.`
          : `${file.name}: map imported, but no battlefield geometry candidates were generated. Review Geometry Tools or the source SVG.`);
      // A full reload is deliberate: every workspace is rebound to the same persisted
      // battlefield revision instead of retaining an editor-local reference to the old map.
      window.location.reload();
    }catch(error){
      setText('#battlefieldBuildStatus',`Could not generate battlefield: ${error.message}`);
      if(button)button.disabled=false;
    }
  });
  refreshNames();
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
  const payload=createProjectExportPayload(state,{studioVersion:VERSION});
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
      const mod=await import('./samples/paviaSample.js?v=0.6.8.0');
      const sampleState=createInitialState();sampleState.project=mod.createPaviaSampleProject();saveState(sampleState);
      window.location.reload();
    }catch(error){alert(`Could not load Pavia sample: ${error.message}`);}
  });
}

function setupHelpAndProjectImport(){
  const help=$('#helpDialog');$('#openHelpBtn')?.addEventListener('click',()=>help?.showModal());$('#closeHelpBtn')?.addEventListener('click',()=>help?.close());
  $('#openProjectBtn')?.addEventListener('click',()=>$('#openProjectFile')?.click());
  $('#openProjectFile')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const data=JSON.parse(await file.text()),restoredBase=normalizeImportedState(data),migrated=migrateImportedProject(data),migration=migrated.migration;
      let restored=restoredBase;
      // Always keep one automatic pre-import recovery point. This protects the designer even
      // when an old scenario-only JSON cannot possibly contain map/deployment information.
      try{savePreImportBackup(state,window.localStorage,{studioVersion:VERSION});}catch(error){console.warn('Could not save pre-import backup',error);}
      if(!migration?.capabilities?.containsBattlefield&&state.project?.mapSource){
        const keep=window.confirm(`This legacy scenario file does not contain a battlefield map or approved terrain.\n\nPress OK to keep the currently loaded battlefield and approved terrain while importing the scenario.\nPress Cancel to open the legacy scenario without a map.`);
        if(keep){
          restored=mergeImportedScenarioWithCurrentBattlefield(restored,state);
          migration.warnings.push('Legacy scenario contained no battlefield; retained the currently loaded authoritative battlefield/terrain workspace.');
        }
      }
      saveState(restored);
      if(migration?.steps?.length||migration?.warnings?.length)sessionStorage.setItem('bax-import-migration-note',`Imported ${file.name} through schema migration (${migration.sourceVersion}). ${[...(migration.steps||[]),...(migration.warnings||[])].join(' ')}`);
      window.location.reload();
    }catch(error){alert(`Could not open project: ${error.message}`);}finally{e.target.value='';}
  });
  $('#restorePreImportBtn')?.addEventListener('click',()=>{
    try{const restored=loadPreImportBackup(window.localStorage);if(!restored){alert('No pre-import recovery copy is available in this browser.');return;}saveState(restored);sessionStorage.setItem('bax-import-migration-note','Restored the automatic pre-import recovery copy.');window.location.reload();}
    catch(error){alert(`Could not restore the pre-import recovery copy: ${error.message}`);}
  });
  const recover=$('#restorePreImportBtn');if(recover)recover.disabled=!window.localStorage.getItem(IMPORT_BACKUP_KEY);
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
    try{window.sessionStorage.removeItem('bax-battlefield-build-status');}catch{}
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
    const mapSource=state.project.mapSource;
    let svg=null,stats={},mapOkay=false;

    if(mapSource?.svgText){
      setText('#diagMap','Loading current battlefield');
      svg=loadInlineMapText($('#battlefieldMapHost'),mapSource.svgText);

      // Repair legacy/corrupted battlefield crops from saved projects. PowerPoint SVG exports
      // commonly contain the tabletop as an explicitly outlined rectangle inside a larger
      // authoring slide. The tabletop boundary is authoritative for every workspace. If a
      // previous release saved the full slide as playArea, re-detect the explicit boundary
      // and migrate the persisted battlefield back to that crop before rendering/highlighting.
      const detectedPlayArea=findBattlefieldBoundary(svg,state.project.playSpace);
      const rootVb=svg.viewBox?.baseVal;
      const rootBounds=rootVb?.width>0&&rootVb?.height>0?{x:rootVb.x,y:rootVb.y,width:rootVb.width,height:rootVb.height}:null;
      const stored=mapSource.playArea;
      const close=(a,b,t=.02)=>a&&b&&Math.abs(a.x-b.x)<=Math.max(1,b.width*t)&&Math.abs(a.y-b.y)<=Math.max(1,b.height*t)&&Math.abs(a.width-b.width)<=Math.max(1,b.width*t)&&Math.abs(a.height-b.height)<=Math.max(1,b.height*t);
      const area=b=>Math.max(0,Number(b?.width)||0)*Math.max(0,Number(b?.height)||0);
      const detectedIsUseful=detectedPlayArea?.width>0&&detectedPlayArea?.height>0&&(!rootBounds||area(detectedPlayArea)<area(rootBounds)*.92);
      const storedLooksRoot=rootBounds&&stored&&close(stored,rootBounds,.015);
      const storedDiffers=stored&&detectedIsUseful&&!close(stored,detectedPlayArea,.03);
      const authoritativePptCrop=mapSource.authoring?.cropSource==='pptx-boundary';
      if(!authoritativePptCrop&&detectedIsUseful&&(!stored||storedLooksRoot||storedDiffers)){
        mapSource.playArea={...detectedPlayArea};
        applyPlayAreaViewBox(svg,mapSource.playArea);
        mapSource.svgText=serializeBattlefieldSvg(svg,mapSource.playArea);
        saveState(state);
        console.info('Repaired battlefield play-area crop from source boundary.',mapSource.playArea);
      }else if(mapSource.playArea){
        applyPlayAreaViewBox(svg,mapSource.playArea);
      }
      mapOkay=true;
      stats=mapSource.compileStats||{};
      // Old local-map saves from pre-v0.5.3 may not contain compiled feature state.
      if(!(state.project.features?.length||state.project.candidates?.length)){
        setText('#diagMap','Compiling current battlefield');
        const detected=await detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes,playSpace:state.project.playSpace});
        state.project.features=detected.features||[];state.project.candidates=detected.candidates||[];stats=detected.stats||{};
        const boundary=mapSource.playArea||detected.boundary;if(boundary){applyPlayAreaViewBox(svg,boundary);mapSource.playArea=boundary;mapSource.svgText=serializeBattlefieldSvg(svg,boundary);}
        if(!state.project.battlefieldRevision){state.project.battlefieldRevision=newBattlefieldRevision();mapSource.battlefieldRevision=state.project.battlefieldRevision;}
        mapSource.compileStats=stats;saveState(state);
      }
    }else if(mapSource?.svg){
      setText('#diagMap','Fetching SVG');
      const mapUrl=new URL(`./${mapSource.svg}?v=${VERSION}`,document.baseURI).href;
      svg=await loadInlineMap($('#battlefieldMapHost'),mapUrl);mapOkay=true;
      if(mapSource.playArea)applyPlayAreaViewBox(svg,mapSource.playArea);
      setText('#diagMap',mapSource.terrain?'Compiling structured terrain':'Analyzing map');
      try {
        if(!mapSource.terrain)throw new Error('No structured terrain manifest supplied.');
        const manifestUrl=new URL(`./${mapSource.terrain}?v=${VERSION}`,document.baseURI).href;
        const manifest=await loadStructuredTerrainManifest(manifestUrl);
        state.project.features=manifest.features;
        const fallback=await detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes,playSpace:state.project.playSpace});
        state.project.candidates=[...fallback.candidates,...fallback.features.filter(f=>!['Stream','Masonry Wall','Dense Wood','Open Grove','Road','Bridge','Gatehouse','Building','Wet Ground'].includes(f.cls)).map(f=>({...f,id:`explorer-${f.id}`,reason:`Additional visual candidate only. ${f.reason||''}`}))];
        stats={...manifestStats(manifest),summary:classSummary(manifest),explorer:state.project.candidates.length};
        if(!mapSource.playArea&&fallback.boundary){mapSource.playArea=fallback.boundary;applyPlayAreaViewBox(svg,fallback.boundary);}
      } catch(structuredError) {
        console.warn('Structured compiler fallback:',structuredError);
        const detected=await detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes,playSpace:state.project.playSpace});
        state.project.features=detected.features;state.project.candidates=detected.candidates;stats=detected.stats||{};
        if(!mapSource.playArea&&detected.boundary){mapSource.playArea=detected.boundary;applyPlayAreaViewBox(svg,detected.boundary);}
      }
      if(!state.project.battlefieldRevision){state.project.battlefieldRevision=newBattlefieldRevision();mapSource.battlefieldRevision=state.project.battlefieldRevision;}
      saveState(state);
    }else{
      setText('#diagMap','Awaiting map upload');
      setText('#mapStatus','No map loaded');
    }

    // Initialize every workspace after the active battlefield has been resolved. None of
    // these tools owns a default map; downstream images are synchronized from mapSource.
    const featureReview=setupFeatureReview(state,persist,svg);
    setupGeometryExplorer(state,persist,featureReview);
    setupScenarioBuilder(state,persist);
    setupDeploymentEditor(state,persist);
    setupPlaytestCenter(state,persist);
    setupAiBridge(state,persist);
    setupScenarioPublisher(state);
    syncBattlefieldImages(state);

    const buildStatus=sessionStorage.getItem('bax-battlefield-build-status');
    if(buildStatus){setText('#battlefieldBuildStatus',buildStatus);sessionStorage.removeItem('bax-battlefield-build-status');}
    if(mapOkay){
      const candidateCount=(state.project.candidates||[]).filter(c=>!state.importedCandidateIds.includes(c.id)&&!state.ignoredCandidates[c.id]).length;
      finishDiagnostics(true,featureReview.currentFeatures().length,candidateCount,stats);
      if(!featureReview.currentFeatures().length&&!candidateCount){
        setText('#mapStatus',`${mapSource?.name||'Current map'} · 0 terrain candidates — compiler review required`);
        const banner=$('#startupBanner');if(banner){banner.classList.remove('hidden');banner.textContent=`v${VERSION}: the current map loaded, but the compiler found no reviewable terrain geometry.`;}
      }else if(mapSource?.kind==='local-svg')setText('#mapStatus',`${mapSource.name||'Current map'} · generated`);
    }else{
      finishDiagnostics(true,featureReview.currentFeatures().length,0,{});
      setText('#diagMap','Awaiting map upload');
      setText('#mapStatus','No map loaded');
    }

    // A project import can require schema migration before this page reloads. Surface that
    // result after startup so the designer knows the file was recovered rather than silently
    // accepting or discarding legacy fields. Migration warnings share the same message.
    const migrationNote=sessionStorage.getItem('bax-import-migration-note');
    if(migrationNote){
      sessionStorage.removeItem('bax-import-migration-note');
      const banner=$('#startupBanner');
      if(banner){
        const existing=!banner.classList.contains('hidden')?String(banner.textContent||'').trim():'';
        banner.classList.remove('hidden');
        banner.textContent=existing?`${migrationNote} ${existing}`:migrationNote;
      }
    }
    window.__BAX_STARTUP_COMPLETE__=true;
  } catch (error) {
    state.project.features=[];state.project.candidates=[];
    try {
      const featureReview=setupFeatureReview(state,persist,null);
      setupGeometryExplorer(state,persist,featureReview);
      setupScenarioBuilder(state,persist);
      setupDeploymentEditor(state,persist);
      setupPlaytestCenter(state,persist);
      setupAiBridge(state,persist);
      setupScenarioPublisher(state);
      syncBattlefieldImages(state);
    } catch (secondary) {console.error('Fallback UI initialization failed:',secondary);}
    finishDiagnostics(false,0,0,{});
    showRuntimeError(error,'initialization');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startup, {once:true});
} else {
  startup();
}
