import { highlightFeature, clearOverlay } from './mapView.js?v=0.4.0-alpha.3';

export const RULES = {
  Difficult: 'Move Value is halved for units moving in Difficult terrain.',
  Obscuring: 'Line of sight may be traced into Obscuring terrain, but the terrain limits sight through it according to the applicable Battle Axe rule.',
  Tall: 'Tall terrain blocks ground-level line of sight where the applicable Battle Axe sight line crosses it.',
  Dangerous: 'A unit moving through Dangerous terrain must make the applicable Danger Test.',
  Impassable: 'Units may not move into or across Impassable terrain except through an approved opening or crossing override.',
  Defensive: 'Units benefiting from Defensive terrain receive the applicable defensive combat benefit.'
};
export const CLASSES = ['Open Ground','Dense Wood','Open Grove','Wet Ground','Stream','Road','Masonry Wall','Bridge','Gatehouse','Breach','Building','Decorative','Unknown'];
export const EFFECTS = Object.keys(RULES);

const signature=f=>JSON.stringify({cls:f.cls||'Unknown',effects:[...(f.effects||[])].sort()});
function grouped(features){const g=new Map();for(const f of features){if(!g.has(f.category))g.set(f.category,[]);g.get(f.category).push(f);}return g;}

export function setupFeatureReview(state,persist,svg){
  const rows=document.querySelector('#featureRows'), count=document.querySelector('#featureCount'), overlay=document.querySelector('#selectionOverlay');
  const terrainClass=document.querySelector('#terrainClass'), effectList=document.querySelector('#effectList'), rulesBox=document.querySelector('#rulesBox');
  const bulkBar=document.querySelector('#featureBulkBar'), bulkInfo=document.querySelector('#featureBulkInfo');
  if(!terrainClass.options.length) CLASSES.forEach(v=>terrainClass.add(new Option(v,v)));

  const currentFeatures=()=>{
    const imported=state.project.candidates.filter(c=>state.importedCandidateIds.includes(c.id)).map(c=>({...c,category:'Imported from Geometry Explorer',proposal:c.kind,cls:c.cls||'Unknown',effects:c.effects||[],reason:`Imported candidate. ${c.reason}`}));
    return [...state.project.features,...imported];
  };
  const selectedIds=()=>state.selectedFeatureIds||[];
  const selectedFeatures=()=>currentFeatures().filter(f=>selectedIds().includes(f.id));
  const effective=f=>{const d=state.decisions[f.id];return {...f,cls:d?.cls||f.cls||'Unknown',effects:d?.effects||f.effects||[],note:d?.note||'',status:d?.status||'pending'};};

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
    const savedScroll=rows.scrollTop; rows.innerHTML=''; const features=currentFeatures(); count.textContent=features.length;
    for(const [category,items] of grouped(features)){
      const section=document.createElement('section');section.className='feature-group';
      const h=document.createElement('h4');h.innerHTML=`<span class="group-select-wrap"><input type="checkbox" class="group-select" aria-label="Select all ${category}"> ${category}</span><span>${items.length}</span>`;section.appendChild(h);
      h.querySelector('.group-select').addEventListener('change',e=>{const set=new Set(selectedIds());for(const f of items)e.target.checked?set.add(f.id):set.delete(f.id);state.selectedFeatureIds=[...set];renderRows(false);updateBulk();});
      for(const feature of items){
        const row=document.createElement('div');row.className='feature-row-shell';row.dataset.id=feature.id;
        const cb=document.createElement('input');cb.type='checkbox';cb.className='feature-select-box';cb.checked=selectedIds().includes(feature.id);cb.setAttribute('aria-label',`Select ${feature.name}`);cb.addEventListener('change',e=>{e.stopPropagation();toggleSelected(feature.id,e.target.checked);});
        const button=document.createElement('button');button.className='feature-row';button.dataset.id=feature.id; const decision=state.decisions[feature.id];
        button.innerHTML=`<span class="feature-symbol"></span><span><strong>${feature.name}</strong><small>${feature.proposal} · detect ${feature.detectionConfidence??feature.confidence}% · interpret ${feature.interpretationConfidence??feature.confidence}%</small></span><b>${decision?.status==='approved'?'✓':decision?.status==='rejected'?'×':'›'}</b>`;
        button.addEventListener('click',()=>select(feature.id));row.append(cb,button);section.appendChild(row);
      } rows.appendChild(section);
    }
    rows.scrollTop=savedScroll; updateBulk(); if(reselect&&state.selectedFeatureId) select(state.selectedFeatureId,{flash:false});
  }
  function select(id,{flash=true}={}){
    const feature=currentFeatures().find(f=>f.id===id);if(!feature)return;state.selectedFeatureId=id;
    document.querySelectorAll('.feature-row').forEach(r=>r.classList.toggle('selected',r.dataset.id===id));const d=state.decisions[id]||{};
    document.querySelector('#featureName').textContent=feature.name;
    document.querySelector('#featureProposal').innerHTML=`<strong>${feature.proposal}</strong><br><span class="confidence-line">Detection ${feature.detectionConfidence??feature.confidence}% · Interpretation ${feature.interpretationConfidence??feature.confidence}%</span><br><small>${feature.reason||''}</small>`;
    terrainClass.value=d.cls||feature.cls||'Unknown';document.querySelector('#reviewerNote').value=d.note||'';renderEffects(d.effects||feature.effects||[]);highlightFeature(svg,overlay,feature,{flash});
  }
  function saveOne(status){if(!state.selectedFeatureId)return;state.decisions[state.selectedFeatureId]={status,cls:terrainClass.value,effects:[...effectList.querySelectorAll('input:checked')].map(x=>x.value),note:document.querySelector('#reviewerNote').value};persist();renderRows();}
  function bulkStatus(status){for(const f of selectedFeatures()){const e=effective(f);state.decisions[f.id]={status,cls:e.cls,effects:e.effects,note:e.note};}persist();renderRows();}
  function bulkApply(){const cls=terrainClass.value,effects=[...effectList.querySelectorAll('input:checked')].map(x=>x.value),note=document.querySelector('#reviewerNote').value;for(const f of selectedFeatures())state.decisions[f.id]={status:'revised',cls,effects,note};persist();renderRows();}

  document.querySelector('#approveButton').addEventListener('click',()=>saveOne('approved'));document.querySelector('#reviseButton').addEventListener('click',()=>saveOne('revised'));document.querySelector('#rejectButton').addEventListener('click',()=>saveOne('rejected'));document.querySelector('#clearSelection').addEventListener('click',()=>clearOverlay(overlay));
  document.querySelector('#bulkApproveFeatures').addEventListener('click',()=>bulkStatus('approved'));document.querySelector('#bulkRejectFeatures').addEventListener('click',()=>bulkStatus('rejected'));document.querySelector('#bulkApplyFeatures').addEventListener('click',bulkApply);document.querySelector('#clearFeatureSelection').addEventListener('click',()=>{state.selectedFeatureIds=[];renderRows(false);});
  renderRows(); const first=currentFeatures()[0];if(first)select(first.id);
  return {renderRows,select,currentFeatures,selectedFeatures};
}
