import { UNIT_LIBRARY, PAVIA_DRAFT_SAMPLE, WARGAMERS_GUIDE_SAMPLE, createBlankScenario } from '../data/scenarioData.js?v=0.4.0-alpha.1';
import { analyzeScenarioText, proposedRosterUnits } from './scenarioAnalyzer.js?v=0.4.0-alpha.1';

const $=s=>document.querySelector(s);
const safe=s=>(s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

export function setupScenarioBuilder(state,persist){
  const scenario=()=>state.project.scenario;
  let editingUnit=null;
  let stagedText='';

  function tabs(){
    document.querySelectorAll('.scenario-tab').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.scenario-tab').forEach(x=>x.classList.toggle('active',x===b));
      document.querySelectorAll('.scenario-pane').forEach(p=>p.classList.toggle('active',p.id===`scenario-${b.dataset.scenarioTab}`));
      if(b.dataset.scenarioTab==='forces') renderForces(); if(b.dataset.scenarioTab==='summary') renderSummary();
    }));
  }
  async function addFiles(files){
    const s=scenario();
    for(const file of files){
      const rec={id:uid('source'),name:file.name,type:file.type||'unknown',size:file.size,status:'registered',textExtracted:false};
      const ext=file.name.toLowerCase().split('.').pop();
      if(['txt','md','json','csv'].includes(ext)){
        try{const text=await file.text();rec.textExtracted=true;rec.status='text extracted';rec.text=text.slice(0,250000);stagedText += `\n\n${text}`;}catch{rec.status='read failed';}
      }else rec.status='registered — visual/binary extraction pending';
      s.sources.push(rec);
    }
    persist();renderSources();
  }
  function renderSources(){
    const s=scenario();
    $('#scenarioSourceList').innerHTML=s.sources.length?s.sources.map(x=>`<div class="source-item"><span><strong>${safe(x.name)}</strong><small>${safe(x.type)} · ${(x.size/1024).toFixed(1)} KB</small></span><span class="source-status ${x.textExtracted?'ok':'pending'}">${safe(x.status)}</span></div>`).join(''):'<p class="muted">No source documents registered yet.</p>';
  }
  function mergeAnalysis(a,sourceName){
    const s=scenario();
    for(const [k,v] of Object.entries(a.metadata))if(v&&!s.metadata[k])s.metadata[k]=v;
    if(a.historicalSituation&&!s.historicalSituation)s.historicalSituation=a.historicalSituation;
    if(a.deploymentNotes&&!s.deploymentNotes)s.deploymentNotes=a.deploymentNotes;
    if(a.victoryText&&!s.victoryText)s.victoryText=a.victoryText;
    for(const o of a.observations) if(!s.observations.some(x=>x.field===o.field&&x.value===o.value))s.observations.push(o);
    for(const f of a.forces) if(!s.sourceForces.some(x=>x.key===f.key))s.sourceForces.push(f);
    for(const sg of a.suggestions) if(!s.suggestions.some(x=>x.id===sg.id))s.suggestions.push(sg);
    s.unresolved=[...new Set([...s.unresolved,...a.unresolved])];
    s.lastAnalysis={at:new Date().toISOString(),sourceName};
  }
  function analyze(text,name='Scenario intake'){
    if(!text.trim())return;
    mergeAnalysis(analyzeScenarioText(text,{sourceName:name}),name);persist();renderAllScenario();activateTab('review');
  }
  function activateTab(name){const b=document.querySelector(`.scenario-tab[data-scenario-tab="${name}"]`);b?.click();}
  function renderReview(){
    const s=scenario(); const ready=s.observations.length, unresolved=s.unresolved.length;
    $('#scenarioReviewStatus').textContent=s.lastAnalysis?`${ready} observations`:'Not analyzed';
    $('#scenarioReviewSummary').innerHTML=s.lastAnalysis?`<div class="intake-metrics"><span><b>${s.sourceForces.length}</b> source forces</span><span><b>${s.suggestions.filter(x=>x.status==='pending').length}</b> pending suggestions</span><span><b>${unresolved}</b> unresolved</span></div>`:'<p class="muted">Analyze a source to populate the scenario.</p>';
    $('#sourceObservations').innerHTML=s.observations.length?s.observations.map(o=>`<div class="observation"><div><strong>${safe(o.field)}</strong><span class="confidence-badge">${o.confidence}%</span></div><p>${safe(o.value)}</p><small>Source: ${safe(o.sourceName)}</small></div>`).join(''):'<p class="muted">No extracted observations yet.</p>';
    $('#scenarioTitle').value=s.metadata.title||'';$('#scenarioDate').value=s.metadata.date||'';$('#scenarioLocation').value=s.metadata.location||'';$('#scenarioGameLength').value=s.metadata.gameLength||'';$('#scenarioTableSize').value=s.metadata.tableSize||'';$('#scenarioStatus').value=s.metadata.status||'';$('#scenarioSituation').value=s.historicalSituation||'';$('#scenarioDeployment').value=s.deploymentNotes||'';$('#scenarioVictory').value=s.victoryText||'';
  }
  function saveFields(){const s=scenario();s.metadata={title:$('#scenarioTitle').value,date:$('#scenarioDate').value,location:$('#scenarioLocation').value,gameLength:$('#scenarioGameLength').value,status:$('#scenarioStatus').value,tableSize:$('#scenarioTableSize').value};s.historicalSituation=$('#scenarioSituation').value;s.deploymentNotes=$('#scenarioDeployment').value;s.victoryText=$('#scenarioVictory').value;persist();renderSummary();}
  function renderSuggestions(){
    const s=scenario(), pending=s.suggestions.filter(x=>x.status!=='ignored');
    $('#suggestionCount').textContent=pending.filter(x=>x.status==='pending').length;
    $('#suggestionTray').innerHTML=pending.length?pending.map(x=>`<article class="suggestion-card ${x.status}"><div class="suggestion-head"><div><span class="suggestion-type">${safe(x.type)}</span><h4>${safe(x.title)}</h4></div><label class="include-toggle"><input type="checkbox" data-suggestion-include="${x.id}" ${x.status==='accepted'?'checked':''}> Include</label></div><p class="proposal-text">${safe(x.proposal)}</p><p class="evidence-text"><strong>Evidence:</strong> ${safe(x.evidence)}</p><div class="suggestion-foot"><span>Confidence ${x.confidence}%</span><div><button class="link-button" data-suggestion-edit="${x.id}">Edit</button> <button class="link-button" data-suggestion-ignore="${x.id}">Ignore</button></div></div></article>`).join(''):'<p class="muted">No Studio suggestions yet.</p>';
    const ignored=s.suggestions.filter(x=>x.status==='ignored');$('#ignoredSuggestionCount').textContent=ignored.length;$('#ignoredSuggestions').innerHTML=ignored.map(x=>`<div class="ignored-suggestion"><span>${safe(x.title)}</span><button class="link-button" data-suggestion-restore="${x.id}">Restore</button></div>`).join('');
    document.querySelectorAll('[data-suggestion-include]').forEach(el=>el.addEventListener('change',()=>{const x=s.suggestions.find(y=>y.id===el.dataset.suggestionInclude);x.status=el.checked?'accepted':'pending';persist();renderSuggestions();}));
    document.querySelectorAll('[data-suggestion-ignore]').forEach(el=>el.addEventListener('click',()=>{const x=s.suggestions.find(y=>y.id===el.dataset.suggestionIgnore);x.status='ignored';persist();renderSuggestions();}));
    document.querySelectorAll('[data-suggestion-restore]').forEach(el=>el.addEventListener('click',()=>{const x=s.suggestions.find(y=>y.id===el.dataset.suggestionRestore);x.status='pending';persist();renderSuggestions();}));
    document.querySelectorAll('[data-suggestion-edit]').forEach(el=>el.addEventListener('click',()=>{const x=s.suggestions.find(y=>y.id===el.dataset.suggestionEdit);const next=prompt('Edit Studio suggestion before accepting:',x.proposal);if(next!==null){x.proposal=next;x.status='accepted';persist();renderSuggestions();}}));
  }
  function renderForces(){
    const s=scenario();$('#sourceForceCount').textContent=s.sourceForces.length;
    $('#sourceForceList').innerHTML=s.sourceForces.length?s.sourceForces.map(f=>`<div class="source-force-card"><span class="faction-dot ${f.faction.toLowerCase()}"></span><div><strong>${safe(f.name)}</strong><small>${safe(f.faction)} · source suggests ${safe(f.profile)} · ${f.confidence}%</small><p>${safe(f.sourceText)}</p></div></div>`).join(''):'<p class="muted">No source forces extracted yet.</p>';
    for(const faction of ['French','Imperial','Garrison']){
      const host=$(`#roster${faction}`);host.innerHTML='';for(const u of s.rosters[faction]||[])host.appendChild(unitCard(u,faction));
    } renderLibrary();
  }
  function unitCard(u,faction){const card=document.createElement('div');card.className='unit-card';card.draggable=true;card.dataset.unitId=u.id;const base=UNIT_LIBRARY.find(x=>x.profile===u.profile);card.innerHTML=`<div class="unit-card-top"><strong>${safe(u.name)}</strong><span>${safe(u.profile)}</span></div><small>${safe(u.represents||'No historical link yet')}</small>${base?`<div class="unit-stats"><span>M ${base.m}</span><span>C ${base.c}</span><span>A ${base.a}</span><span>${base.pts} pts</span></div>`:''}<div class="trait-chips">${(u.traits||[]).map(t=>`<span>${safe(t)}</span>`).join('')}</div>`;card.addEventListener('click',()=>openUnitEditor(faction,u.id));card.addEventListener('dragstart',e=>e.dataTransfer.setData('application/x-bax-roster',JSON.stringify({unitId:u.id,from:faction})));return card;}
  function renderLibrary(){const q=($('#unitLibrarySearch').value||'').toLowerCase();$('#unitLibrary').innerHTML='';for(const item of UNIT_LIBRARY.filter(x=>!q||`${x.profile} ${x.category}`.toLowerCase().includes(q))){const c=document.createElement('div');c.className='library-card';c.draggable=true;c.innerHTML=`<span class="library-icon">${item.icon}</span><div><strong>${safe(item.profile)}</strong><small>${safe(item.category)} · M${item.m} C${item.c} A${item.a} · ${item.pts} pts</small><div class="trait-chips">${item.traits.map(t=>`<span>${safe(t)}</span>`).join('')}</div><p>${safe(item.source)}</p></div>`;c.addEventListener('dragstart',e=>e.dataTransfer.setData('application/x-bax-library',item.profile));$('#unitLibrary').appendChild(c);}}
  function addLibraryUnit(profile,faction){const base=UNIT_LIBRARY.find(x=>x.profile===profile);if(!base)return;scenario().rosters[faction].push({id:uid('unit'),name:profile,profile,commander:'',represents:'',traits:[...base.traits],notes:'Added manually from Battle Axe Unit Library.'});persist();renderForces();}
  function setupDropzones(){document.querySelectorAll('.roster-dropzone').forEach(zone=>{zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over')});zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');const faction=zone.dataset.faction;const p=e.dataTransfer.getData('application/x-bax-library');if(p)return addLibraryUnit(p,faction);const r=e.dataTransfer.getData('application/x-bax-roster');if(r){const data=JSON.parse(r),from=scenario().rosters[data.from],idx=from.findIndex(x=>x.id===data.unitId);if(idx>=0){const [u]=from.splice(idx,1);scenario().rosters[faction].push(u);persist();renderForces();}}});});}
  function addProposals(){const proposed=proposedRosterUnits(scenario().sourceForces);for(const faction of Object.keys(proposed)){for(const p of proposed[faction]){if(scenario().rosters[faction].some(u=>u.sourceId===p.sourceId&&u.profile===p.profile&&u.name===p.name))continue;scenario().rosters[faction].push({id:uid('unit'),sourceId:p.sourceId,name:p.name,profile:p.profile,commander:'',represents:p.represents,traits:p.traits,notes:p.notes});}}persist();renderForces();}
  function openUnitEditor(faction,id){const u=scenario().rosters[faction].find(x=>x.id===id);if(!u)return;editingUnit={faction,id};$('#unitEditorTitle').textContent=u.name;$('#unitName').value=u.name;$('#unitProfile').innerHTML=UNIT_LIBRARY.map(x=>`<option ${x.profile===u.profile?'selected':''}>${safe(x.profile)}</option>`).join('');$('#unitCommander').value=u.commander||'';$('#unitRepresents').value=u.represents||'';$('#unitTraits').value=(u.traits||[]).join('\n');$('#unitNotes').value=u.notes||'';$('#unitEditorDialog').showModal();}
  function saveUnit(){if(!editingUnit)return;const u=scenario().rosters[editingUnit.faction].find(x=>x.id===editingUnit.id);if(!u)return;u.name=$('#unitName').value.trim()||$('#unitProfile').value;u.profile=$('#unitProfile').value;u.commander=$('#unitCommander').value;u.represents=$('#unitRepresents').value;u.traits=$('#unitTraits').value.split('\n').map(x=>x.trim()).filter(Boolean);u.notes=$('#unitNotes').value;persist();$('#unitEditorDialog').close();renderForces();}
  function deleteUnit(){if(!editingUnit)return;const arr=scenario().rosters[editingUnit.faction],idx=arr.findIndex(x=>x.id===editingUnit.id);if(idx>=0)arr.splice(idx,1);persist();$('#unitEditorDialog').close();renderForces();}
  function renderSummary(){const s=scenario(),accepted=s.suggestions.filter(x=>x.status==='accepted');const allUnits=Object.values(s.rosters).flat();$('#scenarioSummaryCard').innerHTML=`<h4>${safe(s.metadata.title||'Untitled scenario')}</h4><dl class="summary-dl"><div><dt>Date</dt><dd>${safe(s.metadata.date||'—')}</dd></div><div><dt>Location</dt><dd>${safe(s.metadata.location||'—')}</dd></div><div><dt>Game length</dt><dd>${safe(s.metadata.gameLength||'—')}</dd></div><div><dt>Battle Axe units</dt><dd>${allUnits.length}</dd></div><div><dt>Accepted Studio suggestions</dt><dd>${accepted.length}</dd></div></dl><h4>Accepted rules / parameters</h4>${accepted.map(x=>`<div class="summary-rule"><b>${safe(x.title)}</b><p>${safe(x.proposal)}</p></div>`).join('')||'<p class="muted">None accepted.</p>'}`;
    const unresolved=[...s.unresolved];if(!s.metadata.title)unresolved.push('Scenario title required');if(!allUnits.length)unresolved.push('No Battle Axe units in force roster');$('#scenarioUnresolved').innerHTML=unresolved.length?`<ul>${[...new Set(unresolved)].map(x=>`<li>${safe(x)}</li>`).join('')}</ul>`:'<p class="success">No current alpha validation warnings.</p>';
  }
  function exportJson(){const blob=new Blob([JSON.stringify(scenario(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${(scenario().metadata.title||'battle-axe-scenario').replace(/[^a-z0-9]+/gi,'_')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
  function renderAllScenario(){renderSources();renderReview();renderSuggestions();renderForces();renderSummary();}

  tabs();renderAllScenario();setupDropzones();
  $('#scenarioFiles').addEventListener('change',e=>addFiles([...e.target.files]));
  $('#loadPaviaDraft').addEventListener('click',()=>{$('#scenarioSourceText').value=PAVIA_DRAFT_SAMPLE;stagedText=PAVIA_DRAFT_SAMPLE;scenario().sources.push({id:uid('source'),name:'Pavia scenario draft example',type:'bundled text example',size:PAVIA_DRAFT_SAMPLE.length,status:'text extracted',textExtracted:true});renderSources();});
  $('#loadGuideExample').addEventListener('click',()=>{$('#scenarioSourceText').value=WARGAMERS_GUIDE_SAMPLE;stagedText=WARGAMERS_GUIDE_SAMPLE;scenario().sources.push({id:uid('source'),name:"Wargamer's Guide scanned-page example",type:'bundled visual-source summary',size:WARGAMERS_GUIDE_SAMPLE.length,status:'visual source observations loaded',textExtracted:true});renderSources();});
  $('#analyzeScenario').addEventListener('click',()=>{const text=[stagedText,$('#scenarioSourceText').value,...scenario().sources.filter(x=>x.text).map(x=>x.text)].filter(Boolean).join('\n\n');analyze(text,scenario().sources.map(x=>x.name).join(' + ')||'Pasted source text');});
  $('#clearScenarioSources').addEventListener('click',()=>{scenario().sources=[];scenario().observations=[];scenario().suggestions=[];scenario().sourceForces=[];scenario().unresolved=[];stagedText='';$('#scenarioSourceText').value='';persist();renderAllScenario();});
  $('#saveScenarioFields').addEventListener('click',saveFields);$('#addProposedForces').addEventListener('click',addProposals);$('#unitLibrarySearch').addEventListener('input',renderLibrary);$('#closeUnitEditor').addEventListener('click',()=>$('#unitEditorDialog').close());$('#saveUnitEditor').addEventListener('click',saveUnit);$('#deleteUnitEditor').addEventListener('click',deleteUnit);$('#exportScenarioJson').addEventListener('click',exportJson);$('#resetScenario').addEventListener('click',()=>{if(confirm('Reset the Scenario Builder to a blank scenario?')){state.project.scenario=createBlankScenario();persist();renderAllScenario();}});
  return {renderAllScenario,renderForces,renderSummary};
}
