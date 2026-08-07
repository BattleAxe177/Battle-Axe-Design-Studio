import { loadState, saveState } from './app/state.js';
import { setupNavigation } from './modules/navigation.js';
import { setupFeatureReview } from './modules/featureReview.js';
import { setupGeometryExplorer } from './modules/geometryExplorer.js';
import { loadInlineMap } from './modules/mapView.js';
import { detectBattlefieldFeatures } from './modules/battlefieldDetector.js';

const {state, storageOkay} = loadState();
const $ = selector => document.querySelector(selector);

function persist() {
  try {
    state.project.playSpace.width = Number($('#width').value); state.project.playSpace.height = Number($('#height').value); state.project.playSpace.units = $('#units').value; state.project.playSpace.origin = $('#origin').value;
    state.project.historicalContext = $('#historicalContext').value; state.project.mapNotes = $('#mapNotes').value; saveState(state);
    $('#saveStatus').textContent = 'Saved'; setTimeout(() => $('#saveStatus').textContent = 'Ready', 1200);
  } catch (error) { console.error(error); $('#saveStatus').textContent = 'Save failed'; }
}
function populateProject() { const p=state.project; $('#width').value=p.playSpace.width; $('#height').value=p.playSpace.height; $('#units').value=p.playSpace.units; $('#origin').value=p.playSpace.origin; $('#historicalContext').value=p.historicalContext; $('#mapNotes').value=p.mapNotes; $('#sidebarProject').textContent=p.name; $('#sidebarSpace').textContent=`${p.playSpace.width} × ${p.playSpace.height} ${p.playSpace.units}`; }
function setupFiles(){['pptx','pdf','svg'].forEach(id=>$(`#${id}`).addEventListener('change',()=>{const names=['pptx','pdf','svg'].map(key=>$(`#${key}`).files[0]?.name).filter(Boolean);$('#fileSummary').textContent=names.length?`Selected locally: ${names.join(' · ')}`:'No local source files selected.';}));}
function setupPwa(){if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Service worker registration failed:',error));}
function finishDiagnostics(mapOkay,features,candidates,stats={}){$('#diagApp').textContent='Ready';$('#diagMap').textContent=mapOkay?'Loaded':'Failed';$('#diagFeatures').textContent=`${features} promoted`;$('#diagExplorer').textContent=`${candidates} candidates`;$('#diagStorage').textContent=storageOkay?'Available':'Unavailable';$('#mapStatus').textContent=mapOkay?`Map geometry scanned · ${stats.wall||0} wall paths · ${stats.water||0} water polygons`:'Map failed';$('#startupBanner').textContent=mapOkay?`Geometry-first scan complete: ${features} battlefield features plus ${candidates} optional Geometry Explorer candidates.`:'Pavia map failed to load. Check the GitHub Pages asset path.';setTimeout(()=>$('#startupBanner').classList.add('hidden'),mapOkay?3600:12000);}

async function startup(){
  setupNavigation(); populateProject(); setupFiles(); setupPwa(); $('#saveButton').addEventListener('click',persist); ['width','height','units','origin','historicalContext','mapNotes'].forEach(id=>$(`#${id}`).addEventListener('change',persist));
  try {
    const svg=await loadInlineMap($('#battlefieldMapHost'),'./projects/pavia/battlefield.svg');
    const detected=detectBattlefieldFeatures(svg,{mapNotes:state.project.mapNotes});
    state.project.features=detected.features; state.project.candidates=detected.candidates;
    const featureReview=setupFeatureReview(state,persist,svg); setupGeometryExplorer(state,persist,featureReview);
    finishDiagnostics(true,featureReview.currentFeatures().length,state.project.candidates.filter(c=>!state.importedCandidateIds.includes(c.id)&&!state.ignoredCandidates[c.id]).length,detected.stats);
  } catch(error) {
    console.error('Battlefield initialization failed:',error); state.project.features=[];state.project.candidates=[]; const featureReview=setupFeatureReview(state,persist,null);setupGeometryExplorer(state,persist,featureReview);finishDiagnostics(false,0,0,{});$('#startupBanner').textContent=`Battlefield initialization failed: ${error.message}`;
  }
}
document.addEventListener('DOMContentLoaded',startup);
