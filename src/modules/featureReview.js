import { highlightFeature, clearOverlay } from './mapView.js?v=0.5.8.0';

export const RULES = {
  Difficult: 'Move Value is halved for units moving in Difficult terrain.',
  Obscuring: 'Line of sight may be traced into Obscuring terrain, but the terrain limits sight through it according to the applicable Battle Axe rule.',
  Tall: 'Tall terrain blocks ground-level line of sight where the applicable Battle Axe sight line crosses it.',
  Dangerous: 'A unit moving through Dangerous terrain must make the applicable Danger Test.',
  Impassable: 'Units may not move into or across Impassable terrain except through an approved opening or crossing override.',
  Defensive: 'Units benefiting from Defensive terrain receive the applicable defensive combat benefit.'
};
export const CLASSES = ['Open Ground','Elevated Ground','Ravine','Dense Wood','Open Grove','Orchard','Vineyard','Field','Wet Ground','Stream','Water Body','Ditch','Road','Track','Masonry Wall','Hedge','Fence','Earthwork','Fortification','Bridge','Ford','Gatehouse','Breach','Settlement','Building','Structure','Decorative','Unknown'];
export const EFFECTS = Object.keys(RULES);

const signature=f=>JSON.stringify({cls:f.cls||'Unknown',effects:[...(f.effects||[])].sort()});

// User-facing review helpers. Keep raw detector percentages and provenance in the
// expandable Technical details section; the normal workflow gets plain language.
function confidenceLabel(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 'Confidence not rated';
  if(n>=85)return 'High confidence';
  if(n>=65)return 'Medium confidence';
  if(n>=40)return 'Low confidence';
  return 'Needs review';
}
function friendlySource(feature={}){
  const provenance=String(feature.provenance||'').toLowerCase();
  let message;
  if(provenance.includes('pptx')||provenance.includes('powerpoint')) message='Identified directly from the uploaded PowerPoint map.';
  else if(provenance.includes('manual')) message='Added manually by the designer.';
  else if(provenance.includes('raster')||String(feature.id||'').startsWith('raster-')||String(feature.id||'').startsWith('visual-')) message='Detected from the map artwork; review the suggested interpretation.';
  else if(String(feature.category||'').includes('Geometry Explorer')||String(feature.reason||'').startsWith('Imported candidate')) message='Imported from Geometry Explorer for normal battlefield review.';
  else message='Detected from the uploaded battlefield map.';
  const support=[];
  if(feature.contextSupport?.mapNotes) support.push('your Input Map Notes');
  if(feature.contextSupport?.historical) support.push('the Historical Battlefield Description');
  if(support.length) message+=` The interpretation is also supported by ${support.join(' and ')}.`;
  return message;
}
const CLASS_GROUPS={
  'Open Ground':'Open ground','Elevated Ground':'Topography','Ravine':'Topography',
  'Dense Wood':'Vegetation','Open Grove':'Vegetation','Orchard':'Agriculture','Vineyard':'Agriculture','Field':'Agriculture',
  'Wet Ground':'Hydrology','Stream':'Hydrology','Water Body':'Hydrology','Ditch':'Hydrology',
  'Road':'Roads & tracks','Track':'Roads & tracks','Masonry Wall':'Barriers','Hedge':'Barriers','Fence':'Barriers',
  'Earthwork':'Fortifications','Fortification':'Fortifications','Breach':'Fortifications',
  'Bridge':'Crossings & access','Ford':'Crossings & access','Gatehouse':'Crossings & access',
  'Settlement':'Built environment','Building':'Built environment','Structure':'Built environment','Decorative':'Decorative features'
};
const DEFAULT_NAMES={'Elevated Ground':'Hill','Ravine':'Ravine','Dense Wood':'Woods','Open Grove':'Open grove','Orchard':'Orchard','Vineyard':'Vineyard','Field':'Field','Wet Ground':'Wet ground','Stream':'Stream','Water Body':'Water body','Ditch':'Ditch','Road':'Road','Track':'Track','Masonry Wall':'Wall','Hedge':'Hedge','Fence':'Fence','Earthwork':'Earthworks','Fortification':'Fortifications','Bridge':'Bridge','Ford':'Ford','Gatehouse':'Gatehouse','Breach':'Breach','Settlement':'Settlement','Building':'Building','Structure':'Structure','Decorative':'Decorative feature','Open Ground':'Open ground'};
const isGenericName=name=>/^Unclassified(?: authored)? shape(?: \d+)?$/i.test(String(name||'').trim())||/^Unclassified feature(?: \d+)?$/i.test(String(name||'').trim());
function categoryForClass(cls,fallback='Unclassified'){return CLASS_GROUPS[cls]||(cls&&cls!=='Unknown'?fallback:'Unclassified');}
function grouped(features){const g=new Map();for(const f of features){const category=f.category||'Unclassified';if(!g.has(category))g.set(category,[]);g.get(category).push(f);}return g;}

export function setupFeatureReview(state,persist,svg){
  const rows=document.querySelector('#featureRows'), count=document.querySelector('#featureCount'), overlay=document.querySelector('#selectionOverlay');
  const terrainClass=document.querySelector('#terrainClass'), effectList=document.querySelector('#effectList'), rulesBox=document.querySelector('#rulesBox');
  const bulkBar=document.querySelector('#featureBulkBar'), bulkInfo=document.querySelector('#featureBulkInfo');
  if(!terrainClass.options.length) CLASSES.forEach(v=>terrainClass.add(new Option(v,v)));

  const currentFeatures=()=>{
    const imported=state.project.candidates.filter(c=>state.importedCandidateIds.includes(c.id)).map(c=>({...c,category:'Imported from Geometry Explorer',proposal:c.kind,cls:c.cls||'Unknown',effects:c.effects||[],reason:`Imported candidate. ${c.reason}`}));
    return [...state.project.features,...(state.project.manualFeatures||[]),...imported];
  };
  const selectedIds=()=>state.selectedFeatureIds||[];
  const selectedFeatures=()=>currentFeatures().filter(f=>selectedIds().includes(f.id));
  const effective=f=>{const d=state.decisions[f.id],cls=d?.cls||f.cls||'Unknown';return {...f,name:d?.name||f.name,cls,effects:d?.effects||f.effects||[],note:d?.note||'',status:d?.status||'pending',category:categoryForClass(cls,d?.category||f.category||'Unclassified')};};
  function defaultNameFor(cls,id){const base=DEFAULT_NAMES[cls]||cls||'Feature',same=currentFeatures().map(effective).filter(x=>x.id!==id&&x.cls===cls&&String(x.name||'').toLowerCase().startsWith(base.toLowerCase())).length;return same?`${base} ${same+1}`:base;}

  function renderRules(){
    const selected=[...effectList.querySelectorAll('input:checked')].map(x=>x.value);
    rulesBox.innerHTML=`<strong>Rules context</strong>${selected.length?selected.map(e=>`<div class="rule-entry"><b>${e}</b><p>${RULES[e]}</p></div>`).join(''):'<p>No Battle Axe effects selected.</p>'}`;
  }
  function renderEffects(selected){
    effectList.innerHTML='';
    for(const effect of EFFECTS){const label=document.createElement('label');label.className='effect-row';const input=document.createElement('input');input.type='checkbox';input.value=effect;input.checked=selected.includes(effect);const span=document.createElement('span');span.textContent=effect;label.append(input,span);input.addEventListener('change',renderRules);effectList.appendChild(label);} renderRules();
  }
  function updateBulk(){
    const fs=selectedFeatures().map(effective); const n=fs.length;
    bulkBar.hidden=n<2;
    if(n<2)return;
    const same=new Set(fs.map(signature)).size===1;
    bulkInfo.textContent=`${n} selected · ${same?'identical attributes — safe for bulk approval':'mixed attributes — review before applying common attributes'}`;
    document.querySelector('#bulkApproveFeatures').disabled=!same;
  }
  function toggleSelected(id,on){
    const set=new Set(selectedIds()); on?set.add(id):set.delete(id); state.selectedFeatureIds=[...set]; updateBulk(); renderRows(false);
  }
  function renderRows(reselect=true){
    const savedScroll=rows.scrollTop; rows.innerHTML=''; const features=currentFeatures().map(effective); count.textContent=features.length;
    for(const [category,items] of grouped(features)){
      const section=document.createElement('section');section.className='feature-group';
      const h=document.createElement('h4');h.innerHTML=`<span class="group-select-wrap"><input type="checkbox" class="group-select" aria-label="Select all ${category}"> ${category}</span><span>${items.length}</span>`;section.appendChild(h);
      h.querySelector('.group-select').addEventListener('change',e=>{const set=new Set(selectedIds());for(const f of items)e.target.checked?set.add(f.id):set.delete(f.id);state.selectedFeatureIds=[...set];renderRows(false);updateBulk();});
      for(const feature of items){
        const row=document.createElement('div');row.className='feature-row-shell';row.dataset.id=feature.id;
        const cb=document.createElement('input');cb.type='checkbox';cb.className='feature-select-box';cb.checked=selectedIds().includes(feature.id);cb.setAttribute('aria-label',`Select ${feature.name}`);cb.addEventListener('change',e=>{e.stopPropagation();toggleSelected(feature.id,e.target.checked);});
        const button=document.createElement('button');button.className='feature-row';button.dataset.id=feature.id; const decision=state.decisions[feature.id];
        button.innerHTML=`<span class="feature-symbol"></span><span><strong>${feature.name}</strong><small>${feature.proposal} · ${confidenceLabel(feature.interpretationConfidence??feature.confidence)}</small></span><b>${decision?.status==='approved'?'✓':decision?.status==='rejected'?'×':'›'}</b>`;
        button.addEventListener('click',()=>select(feature.id));row.append(cb,button);section.appendChild(row);
      } rows.appendChild(section);
    }
    rows.scrollTop=savedScroll; updateBulk(); if(reselect&&state.selectedFeatureId) select(state.selectedFeatureId,{flash:false});
  }
  function select(id,{flash=true}={}){
    const baseFeature=currentFeatures().find(f=>f.id===id);if(!baseFeature)return;const feature=effective(baseFeature);state.selectedFeatureId=id;
    document.querySelectorAll('.feature-row').forEach(r=>r.classList.toggle('selected',r.dataset.id===id));const d=state.decisions[id]||{};
    document.querySelector('#featureName').textContent=feature.name;document.querySelector('#featureDisplayName').value=feature.name||'';
    document.querySelector('#featureProposal').innerHTML=`<strong>${feature.proposal}</strong><div class="feature-confidence">${confidenceLabel(feature.interpretationConfidence??feature.confidence)}</div><p class="feature-user-note">${friendlySource(feature)}</p><details class="feature-technical-detail"><summary>Technical details</summary><small>Detection ${feature.detectionConfidence??feature.confidence}% · Interpretation ${feature.interpretationConfidence??feature.confidence}%${feature.sourceLabel?` · Source label: ${feature.sourceLabel}`:''}</small><p>${feature.reason||'No additional diagnostic detail.'}</p></details>`;
    terrainClass.value=feature.cls||'Unknown';document.querySelector('#reviewerNote').value=feature.note||'';renderEffects(feature.effects||[]);highlightFeature(svg,overlay,baseFeature,{flash});
  }
  function saveOne(status){if(!state.selectedFeatureId)return;const base=currentFeatures().find(f=>f.id===state.selectedFeatureId);if(!base)return;const cls=terrainClass.value;let name=document.querySelector('#featureDisplayName').value.trim()||base.name;if(isGenericName(name)&&cls!=='Unknown')name=defaultNameFor(cls,base.id);state.decisions[state.selectedFeatureId]={...(state.decisions[state.selectedFeatureId]||{}),status,name,cls,category:categoryForClass(cls,base.category),effects:[...effectList.querySelectorAll('input:checked')].map(x=>x.value),note:document.querySelector('#reviewerNote').value};persist();renderRows();select(state.selectedFeatureId,{flash:false});}
  function bulkStatus(status){for(const f of selectedFeatures()){const e=effective(f);state.decisions[f.id]={...(state.decisions[f.id]||{}),status,name:e.name,cls:e.cls,category:e.category,effects:e.effects,note:e.note};}persist();renderRows();}
  function bulkApply(){const cls=terrainClass.value,effects=[...effectList.querySelectorAll('input:checked')].map(x=>x.value),note=document.querySelector('#reviewerNote').value;for(const f of selectedFeatures()){const e=effective(f),name=isGenericName(e.name)&&cls!=='Unknown'?defaultNameFor(cls,f.id):e.name;state.decisions[f.id]={...(state.decisions[f.id]||{}),status:'revised',name,cls,category:categoryForClass(cls,f.category),effects,note};}persist();renderRows();}


  // Manual missing-feature authoring: a deterministic escape hatch when structured source extraction misses geometry.
  let manualDraw=null;
  const mapHost=document.querySelector('#battlefieldMapHost');
  const finishManual=document.querySelector('#finishManualFeature'), cancelManual=document.querySelector('#cancelManualFeature'), mapHint=document.querySelector('#mapFootHint');
  function mapPoint(evt){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;const px=(evt.clientX-r.left)/r.width,py=(evt.clientY-r.top)/r.height;return [Math.max(0,Math.min(100,px*100)),Math.max(0,Math.min(100,py*100))];}
  function drawManualPreview(){svg.querySelector('#ba-manual-preview')?.remove();if(!manualDraw?.points?.length)return;const vb=svg.viewBox.baseVal,g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='ba-manual-preview';g.classList.add('ba-manual-preview');const pts=manualDraw.points.map(([x,y])=>[vb.x+x/100*vb.width,vb.y+y/100*vb.height]);let el;if(manualDraw.type==='point'){el=document.createElementNS('http://www.w3.org/2000/svg','circle');el.setAttribute('cx',pts[0][0]);el.setAttribute('cy',pts[0][1]);el.setAttribute('r',Math.max(vb.width,vb.height)*.009);}else{el=document.createElementNS('http://www.w3.org/2000/svg',manualDraw.type==='polygon'?'polygon':'polyline');el.setAttribute('points',pts.map(p=>p.join(',')).join(' '));}g.appendChild(el);svg.appendChild(g);}
  function stopManual(){manualDraw=null;svg.querySelector('#ba-manual-preview')?.remove();finishManual.hidden=true;cancelManual.hidden=true;mapHost.classList.remove('manual-drawing');mapHint.textContent='Selected feature flashes its actual geometry. Use Add missing feature when the compiler misses source geometry entirely.';}
  function beginManual(){const raw=(prompt('Geometry type for the missing feature: polygon, line, or point','polygon')||'').trim().toLowerCase();if(!['polygon','line','point'].includes(raw))return;manualDraw={type:raw,points:[]};finishManual.hidden=raw==='point';cancelManual.hidden=false;mapHost.classList.add('manual-drawing');mapHint.textContent=raw==='point'?'Click the missing feature location.':'Click vertices around/along the missing feature, then choose Finish drawing.';clearOverlay(overlay);}
  function completeManual(){if(!manualDraw)return;const min=manualDraw.type==='polygon'?3:manualDraw.type==='line'?2:1;if(manualDraw.points.length<min){alert(`Add at least ${min} point${min>1?'s':''}.`);return;}const name=(prompt('Feature name:',`Manual feature ${(state.project.manualFeatures||[]).length+1}`)||'').trim();if(!name)return;const id=`manual-${Date.now().toString(36)}`;const f={id,name,category:'Manually added features',proposal:'Manual source geometry',cls:'Unknown',effects:[],reason:'Manually drawn by the designer because the structured compiler did not detect this battlefield feature.',detectionConfidence:100,interpretationConfidence:100,provenance:'Manual Studio geometry',geometry:{type:manualDraw.type,parts:[{closed:manualDraw.type==='polygon',points:manualDraw.points}]}};state.project.manualFeatures=state.project.manualFeatures||[];state.project.manualFeatures.push(f);persist();stopManual();renderRows(false);select(id);}
  mapHost?.addEventListener('click',evt=>{if(!manualDraw)return;evt.preventDefault();evt.stopPropagation();manualDraw.points.push(mapPoint(evt));drawManualPreview();if(manualDraw.type==='point')completeManual();});
  document.querySelector('#addMissingFeature')?.addEventListener('click',beginManual);finishManual?.addEventListener('click',completeManual);cancelManual?.addEventListener('click',stopManual);

    document.querySelector('#approveButton').addEventListener('click',()=>saveOne('approved'));document.querySelector('#reviseButton').addEventListener('click',()=>saveOne('revised'));document.querySelector('#rejectButton').addEventListener('click',()=>saveOne('rejected'));document.querySelector('#clearSelection').addEventListener('click',()=>clearOverlay(overlay));
  document.querySelector('#bulkApproveFeatures').addEventListener('click',()=>bulkStatus('approved'));document.querySelector('#bulkRejectFeatures').addEventListener('click',()=>bulkStatus('rejected'));document.querySelector('#bulkApplyFeatures').addEventListener('click',bulkApply);document.querySelector('#clearFeatureSelection').addEventListener('click',()=>{state.selectedFeatureIds=[];renderRows(false);});
  renderRows(); const first=currentFeatures()[0];if(first)select(first.id);
  return {renderRows,select,currentFeatures,selectedFeatures};
}
