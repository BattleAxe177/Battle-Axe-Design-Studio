import { setOverlay, clearOverlay } from './mapView.js?v=0.4.0-alpha.8';

export function setupGeometryExplorer(state,persist,featureReview){
  const dialog=document.querySelector('#geometryDialog'),rows=document.querySelector('#candidateRows'),info=document.querySelector('#candidateInfo'),overlay=document.querySelector('#candidateOverlay');
  const importButton=document.querySelector('#importCandidate'),ignoreButton=document.querySelector('#ignoreCandidate');
  const available=()=>state.project.candidates.filter(c=>!state.importedCandidateIds.includes(c.id)&&!state.ignoredCandidates[c.id]);
  const selected=()=>new Set(state.selectedCandidateIds||[]);
  function updateBulk(){const n=selected().size;document.querySelector('#candidateBulkBar').hidden=n<2;document.querySelector('#candidateBulkInfo').textContent=`${n} additional candidates selected`;}
  function render(){
    rows.innerHTML='';const candidates=available();if(!candidates.length)rows.innerHTML='<p class="muted">No additional candidates remain.</p>';
    for(const c of candidates){const shell=document.createElement('div');shell.className='candidate-row-shell';const cb=document.createElement('input');cb.type='checkbox';cb.className='candidate-select-box';cb.checked=selected().has(c.id);cb.addEventListener('change',()=>{const s=selected();cb.checked?s.add(c.id):s.delete(c.id);state.selectedCandidateIds=[...s];updateBulk();});const b=document.createElement('button');b.className='candidate-row';b.dataset.id=c.id;b.innerHTML=`<strong>${c.name}</strong><small>${c.kind} · ${c.confidence}%</small>`;b.addEventListener('click',()=>selectOne(c.id));shell.append(cb,b);rows.appendChild(shell);}document.querySelector('#diagExplorer').textContent=`${candidates.length} candidates`;updateBulk();
  }
  function selectOne(id){const c=available().find(x=>x.id===id);if(!c)return;state.selectedCandidateId=id;rows.querySelectorAll('.candidate-row').forEach(r=>r.classList.toggle('selected',r.dataset.id===id));info.innerHTML=`<h3>${c.name}</h3><p><strong>Candidate:</strong> ${c.kind}</p><p><strong>Confidence:</strong> ${c.confidence}%</p><p><strong>Why not automatically promoted:</strong> ${c.reason}</p><p class="muted">Whole-map context is the default preview. Select multiple candidates with the checkboxes for bulk import or ignore.</p>`;setOverlay(overlay,c.box,{flash:true});importButton.disabled=false;ignoreButton.disabled=false;}
  function open(){render();typeof dialog.showModal==='function'?dialog.showModal():dialog.setAttribute('open','');const first=available()[0];if(first)selectOne(first.id);else clearOverlay(overlay);}
  function close(){typeof dialog.close==='function'?dialog.close():dialog.removeAttribute('open');}
  function importIds(ids){for(const id of ids)if(!state.importedCandidateIds.includes(id))state.importedCandidateIds.push(id);state.selectedCandidateIds=[];persist();featureReview.renderRows();render();}
  function ignoreIds(ids){for(const id of ids)state.ignoredCandidates[id]=true;state.selectedCandidateIds=[];persist();render();clearOverlay(overlay);}
  function selectSimilar(){const active=available().find(c=>c.id===state.selectedCandidateId);if(!active)return;const targetKind=(active.kind||'').split('/')[0].trim();const s=selected();for(const c of available())if((c.kind||'').split('/')[0].trim()===targetKind||Math.abs((c.confidence||0)-(active.confidence||0))<=5)s.add(c.id);state.selectedCandidateIds=[...s];render();}
  document.querySelector('#detectButton').addEventListener('click',open);document.querySelector('#closeExplorer').addEventListener('click',close);
  importButton.addEventListener('click',()=>{if(!state.selectedCandidateId)return;const id=state.selectedCandidateId;importIds([id]);state.selectedCandidateId=null;close();featureReview.select(id);});
  ignoreButton.addEventListener('click',()=>{if(!state.selectedCandidateId)return;ignoreIds([state.selectedCandidateId]);state.selectedCandidateId=null;importButton.disabled=true;ignoreButton.disabled=true;info.innerHTML='<h3>Candidate ignored</h3><p>Ignored geometry remains excluded from normal review.</p>';});
  document.querySelector('#bulkImportCandidates').addEventListener('click',()=>importIds([...selected()]));document.querySelector('#bulkIgnoreCandidates').addEventListener('click',()=>ignoreIds([...selected()]));document.querySelector('#selectSimilarCandidates').addEventListener('click',selectSimilar);document.querySelector('#clearCandidateSelection').addEventListener('click',()=>{state.selectedCandidateIds=[];render();});
  render();return{open,render};
}
