import { getEffectiveRuleset } from '../rules/ruleset.js?v=0.6.9.1';
import { battlefieldImageUrl } from './battlefieldState.js?v=0.6.9.1';
import { sideLabel, sideCommandColor } from './scenarioSides.js?v=0.6.9.1';
import { acceptedScenarioRules } from './scenarioProposal.js?v=0.6.9.1';
import { footprintPercentFromSpec } from './footprintGeometry.js?v=0.6.9.1';

const $=s=>document.querySelector(s);
const esc=s=>(s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function commands(s){
  return Object.entries(s.commands||{}).flatMap(([side,cs])=>(cs||[]).map((c,i)=>({side,commandIndex:i,...c})));
}
function acceptedRules(s){return acceptedScenarioRules(s).map(x=>({...x,proposal:x.text}));}
function authoritativeText(v){
  const raw=String(v||'').trim();if(!raw)return'';
  const paras=raw.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),out=[];
  for(const p of paras)if(!out.some(x=>x===p))out.push(p);
  if(out.length===1)return out[0];
  const half=Math.floor(out.length/2);
  if(half&&out.slice(0,half).join('\n')===out.slice(half).join('\n'))return out.slice(0,half).join('\n\n');
  return out.join('\n\n');
}
function resolvedUnitFootprint(s,profiles,u){
  const tt=s.tabletop||{},scenarioLegacy=Number(tt.unitBaseMm||50),scenarioW=Number(tt.unitBaseWidthMm||scenarioLegacy),scenarioD=Number(tt.unitBaseDepthMm||scenarioLegacy),profile=profiles.get(u.profile)||{},explicitLegacy=u.baseMm!=null&&String(u.baseMm).trim()!==''?Number(u.baseMm):null,fixed=!!profile.asset&&Number(profile.baseMm)>0,baseMm=Number(Number.isFinite(explicitLegacy)&&explicitLegacy>0?explicitLegacy:(fixed?profile.baseMm:scenarioLegacy)),profileW=Number(profile.baseWidthMm||((Number.isFinite(explicitLegacy)&&explicitLegacy>0)||fixed?baseMm:scenarioW)),profileD=Number(profile.baseDepthMm||((Number.isFinite(explicitLegacy)&&explicitLegacy>0)||fixed?baseMm:scenarioD));
  return{baseMm,width:Number(u.baseWidthMm||profileW),depth:Number(u.baseDepthMm||profileD)};
}
function basingSummary(s){const tt=s.tabletop||{},legacy=Number(tt.unitBaseMm||50),w=Number(tt.unitBaseWidthMm||legacy),d=Number(tt.unitBaseDepthMm||legacy),c=Number(tt.commanderBaseMm||25),m=Number(tt.measurementMultiplier||1);return `${w}×${d} mm unit default · ${c} mm commanders · ${m}× measurements`;}
function forceHtml(s,side,{compactRoster=false}={}){
  const cs=commands(s).filter(c=>c.side===side);if(!cs.length)return'<p>None.</p>';
  const rs=getEffectiveRuleset(s),profiles=new Map(rs.unitLibrary.map(x=>[x.profile,x]));
  const commanderCost=Number(rs.supplement.forceStructure?.commanderPointCost||0),hasCommandRatings=rs.supplement.commandRules?.mode==='rating-proximity';
  let armyTotal=0;
  const blocks=cs.map(c=>{
    const grouped=new Map();
    for(const u of c.units||[]){
      const fp=resolvedUnitFootprint(s,profiles,u),key=`${u.name}|${u.profile}|${fp.width}x${fp.depth}`,g=grouped.get(key)||{name:u.name,profile:u.profile,count:0,points:Number(profiles.get(u.profile)?.pts||u.points||0),baseWidthMm:fp.width,baseDepthMm:fp.depth};g.count++;grouped.set(key,g);
    }
    const rows=[...grouped.values()],unitSubtotal=rows.reduce((a,r)=>a+r.count*r.points,0),cmdPoints=c.commander?commanderCost:0,subtotal=unitSubtotal+cmdPoints;armyTotal+=subtotal;
    const rating=hasCommandRatings&&c.commander?` · CR ${c.commandRating==null?'auto':esc(c.commandRating)}`:'';
    const commanderRow=compactRoster&&cmdPoints?`<tr><td>1×</td><td>Commander — ${esc(c.commander)}</td><td>${cmdPoints}</td></tr>`:'';
    return `<div class="pub-command"><h4>${esc(c.name)}${c.commander?` — ${esc(c.commander)}${rating}`:''}${compactRoster?` <span class="points">${subtotal} pts</span>`:''}</h4>${compactRoster?`<table class="roster"><tbody>${rows.map(r=>`<tr><td>${r.count}×</td><td>${esc(r.name===r.profile?r.name:`${r.name} — ${r.profile}`)} <span class="small">· ${r.baseWidthMm}×${r.baseDepthMm} mm</span></td><td>${r.points?r.count*r.points:'—'}</td></tr>`).join('')}${commanderRow}</tbody></table>`:`<ul>${rows.map(r=>`<li>${r.count>1?`${r.count}× `:''}${esc(r.name===r.profile?r.name:`${r.name} — ${r.profile}`)} <span class="small">· ${r.baseWidthMm}×${r.baseDepthMm} mm</span>${r.points?` — ${r.count*r.points} pts`:''}</li>`).join('')}${cmdPoints?`<li>Commander — ${cmdPoints} pt${cmdPoints===1?'':'s'}</li>`:''}</ul>`}</div>`;
  });
  return blocks.join('')+`<p class="army-total"><strong>Army total: ${armyTotal} pts</strong></p>`;
}
function conciseText(text,maxWords=110){const words=authoritativeText(text).replace(/\s+/g,' ').trim().split(' ').filter(Boolean);return words.length<=maxWords?words.join(' '):words.slice(0,maxWords).join(' ').replace(/[,:;]$/,'')+'…';}
function historicalPublication(s,concise=false){const p=s.publication?.historical||{},value=concise?(p.conciseSummary||p.narrative):(p.narrative||p.conciseSummary);return value||s.historicalSituation||'';}
function battlefieldBrief(state){const authored=state.project.scenario?.publication?.battlefield||{},narrative=authored.conciseSummary||authored.narrative;if(narrative)return narrative;const rows=[];for(const f of state.project.features||[]){const d=state.decisions?.[f.id];if(d?.status!=='approved')continue;const effects=d.effects||f.terrainOverride?.effects||[];if(!effects.length)continue;const key=`${d.cls||f.cls||f.name}|${effects.join(',')}`;if(rows.some(x=>x.key===key))continue;rows.push({key,name:d.cls||f.cls||f.name,effects});}return rows.length?rows.slice(0,6).map(x=>`${x.name}: ${x.effects.join(', ')}.`).join(' '):'No game-relevant terrain effects are currently approved.';}
function deploymentBrief(s){const note=conciseText(s.deploymentNotes,75);if(note)return note;const cs=commands(s),parts=cs.map(c=>{const n=(c.units||[]).filter(u=>s.deployment?.placements?.[u.id]).length;return n?`${c.name}${c.commander?` (${c.commander})`:''}: ${n} unit${n===1?'':'s'} deployed.`:'';}).filter(Boolean);return parts.join(' ')||'Use the deployment map for starting positions.';}
function shade(scenario,side,i){return `background-color:${sideCommandColor(scenario,side,i)};-webkit-print-color-adjust:exact;print-color-adjust:exact`;}
function currentMapHtml(state,cls='map',alt='Battlefield map'){
  const url=battlefieldImageUrl(state.project);
  return url?`<img class="${cls}" src="${esc(url)}" alt="${esc(alt)}">`:`<div class="map-missing">No battlefield map generated for the current scenario.</div>`;
}
function deploymentMapHtml(state){
  const s=state.project.scenario,items=[],rules=getEffectiveRuleset(s),profiles=new Map(rules.unitLibrary.map(x=>[x.profile,x])),tt=s.tabletop||{};
  for(const c of commands(s)){
    for(const u of c.units||[]){
      const p=s.deployment?.placements?.[u.id];if(!p)continue;
      const profile=profiles.get(u.profile)||{},resolved=resolvedUnitFootprint(s,profiles,u),entity={kind:'unit',baseMm:resolved.baseMm,baseWidthMm:resolved.width,baseDepthMm:resolved.depth,baseShape:'rect'},fp=footprintPercentFromSpec(entity,state.project.playSpace||{},{}),facing=Number(p.facing||0);
      items.push(`<div class="dep-piece" style="left:${Number(p.x)}%;top:${Number(p.y)}%;width:${fp.width}%;height:${fp.height}%;transform:translate(-50%,-50%) rotate(${facing}deg);${shade(s,c.side,c.commandIndex)}"><span style="transform:rotate(${-facing}deg)">${esc(u.name)}</span></div>`);
    }
    const cp=s.deployment?.commanderPlacements?.[c.id];
    if(cp&&c.commander){const mm=Number(tt.commanderBaseMm||25),fp=footprintPercentFromSpec({kind:'commander',baseMm:mm,baseShape:'circle'},state.project.playSpace||{},{});items.push(`<div class="dep-cmd" style="left:${Number(cp.x)}%;top:${Number(cp.y)}%;width:${fp.width}%;height:${fp.height}%;${shade(s,c.side,c.commandIndex)}">★</div>`);}
  }
  const width=Number(state.project.playSpace?.width)||1,height=Number(state.project.playSpace?.height)||1;
  return `<div class="deployment-map" style="aspect-ratio:${width}/${height}">${currentMapHtml(state,'deployment-base','Deployment map')}${items.join('')}</div>`;
}
function scenarioSheetHtml(state){const s=state.project.scenario,title=esc(s.metadata?.title||'Battle Axe Scenario'),sideA=sideLabel(s,'sideA'),sideB=sideLabel(s,'sideB'),rules=acceptedRules(s),hist=conciseText(historicalPublication(s,true),115),battle=battlefieldBrief(state),deploy=deploymentBrief(s);return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:letter landscape;margin:.28in}*{box-sizing:border-box}body{font-family:Georgia,serif;color:#181818;margin:0;font-size:8.4pt;line-height:1.18}h1,h2,h3,h4{font-family:Arial,sans-serif}h1{font-size:19pt;margin:0;text-transform:uppercase}h2{font-size:10pt;margin:5px 0 2px;border-bottom:1px solid #333;text-transform:uppercase}.meta{font:7.5pt Arial,sans-serif;display:flex;gap:10px;margin-bottom:4px}.sheet{display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:9px}.mapbox{grid-row:span 2}.map{width:100%;max-height:3.25in;object-fit:contain;border:1px solid #777}.deployment-map{position:relative;width:100%;aspect-ratio:${Number(state.project.playSpace?.width||1)}/${Number(state.project.playSpace?.height||1)};overflow:hidden;border:1px solid #777}.deployment-map>.deployment-base{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}.dep-piece,.dep-cmd{position:absolute;transform:translate(-50%,-50%);color:#fff;border:1px solid #222;text-shadow:0 1px 1px #000;text-align:center;font:700 5pt Arial}.dep-piece{width:4%;aspect-ratio:1;display:grid;place-items:center}.dep-piece>span{width:max-content;max-width:62px}.dep-cmd{width:2%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center}.forces{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pub-command{break-inside:avoid;margin-bottom:3px}.pub-command h4{font-size:7.5pt;margin:1px 0}.roster{width:100%;border-collapse:collapse;font-size:7pt}.roster td{padding:0 2px;border-bottom:1px dotted #bbb}.roster td:first-child,.roster td:last-child{width:12%;text-align:right}.points{float:right}.army-total{margin:2px 0}.rule{margin:2px 0}.small{font-size:6.5pt;color:#555}@media print{body,.deployment-map,.dep-piece,.dep-cmd{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body><h1>${title}</h1><div class="meta"><span>${esc(s.metadata?.date||'')}</span><span>${esc(s.metadata?.location||'')}</span><span>${esc(s.metadata?.gameLength||'—')} turns</span><span>${esc(state.project.playSpace?.width||'?')} × ${esc(state.project.playSpace?.height||'?')} ${esc(state.project.playSpace?.units||'')}</span><span>${esc(basingSummary(s))}</span></div><div class="sheet"><section><h2>Overview</h2><p>${esc(hist||'Not provided.')}</p><h2>Battlefield</h2><p>${esc(battle)}</p><h2>Deployment</h2><p>${esc(deploy)}</p></section><section class="mapbox"><h2>Deployment Map</h2>${deploymentMapHtml(state)}</section><section><h2>Forces</h2><div class="forces"><div><h3>${esc(sideA)}</h3>${forceHtml(s,'sideA',{compactRoster:true})}</div><div><h3>${esc(sideB)}</h3>${forceHtml(s,'sideB',{compactRoster:true})}</div></div></section><section><h2>Scenario Rules</h2>${rules.length?rules.map(r=>`<div class="rule"><b>${esc(r.title)}.</b> ${esc(conciseText(r.proposal,45))}</div>`).join(''):'<p>None.</p>'}<h2>Victory</h2><p>${esc(conciseText(s.victoryText,80)||'Not provided.')}</p></section></div></body></html>`;}
function documentHtml(state,opts={}){
  if(opts.layout==='scenario-sheet')return scenarioSheetHtml(state);
  const s=state.project.scenario,title=esc(s.metadata?.title||'Battle Axe Scenario'),date=esc(s.metadata?.date||''),location=esc(s.metadata?.location||''),rules=acceptedRules(s),compact=opts.layout!=='comfortable',hist=authoritativeText(historicalPublication(s,false)),battlefieldNarrative=authoritativeText(s.publication?.battlefield?.narrative||s.publication?.battlefield?.conciseSummary),sideA=sideLabel(s,'sideA'),sideB=sideLabel(s,'sideB');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:letter;margin:.45in}*{box-sizing:border-box}body{font-family:Georgia,serif;color:#181818;margin:0;font-size:${compact?'9.2':'10.5'}pt;line-height:1.28}h1{font-family:Arial,sans-serif;font-size:24pt;margin:0;text-transform:uppercase}h2{font-family:Arial,sans-serif;font-size:12pt;border-bottom:1.5px solid #222;padding-bottom:3px;margin:10px 0 5px;text-transform:uppercase;letter-spacing:.04em}h3,h4{font-family:Arial,sans-serif;margin:4px 0 2px}p{margin:4px 0}.meta{display:flex;gap:14px;font-family:Arial,sans-serif;font-size:8.5pt;margin:2px 0 8px}.map{width:100%;max-height:4.35in;object-fit:contain;border:1px solid #777}.map-missing{display:grid;place-items:center;min-height:1.5in;padding:16px;border:1px dashed #777;color:#666;font-family:Arial,sans-serif}.forces{display:grid;grid-template-columns:1fr 1fr;gap:18px}.pub-command{break-inside:avoid}.pub-command ul{margin:2px 0 5px;padding-left:15px}.pub-command li{margin:1px 0}.rule{break-inside:avoid;margin:5px 0}.rule b{font-family:Arial,sans-serif}.small{font-size:8pt;color:#555}.deployment-map{position:relative;width:min(100%,6.7in);margin:5px auto;overflow:hidden;border:1px solid #777}.deployment-map>.deployment-base{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}.deployment-map>.map-missing{position:absolute;inset:0}.dep-piece,.dep-cmd{position:absolute;transform:translate(-50%,-50%);color:#fff;border:1px solid #222;text-shadow:0 1px 1px #000;text-align:center;font:700 6.5pt Arial,sans-serif;line-height:1.05}.dep-piece{width:4.1%;aspect-ratio:1;padding:1px;overflow:visible;display:grid;place-items:center;border-radius:3px}.dep-piece>span{display:block;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:100%;width:max-content;max-width:82px;color:#fff;text-shadow:0 1px 2px #000,0 0 2px #000;padding:1px 2px;white-space:normal;overflow:visible;font:700 5.8pt Arial,sans-serif;line-height:1.0;z-index:3}.dep-cmd{width:2.1%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center}@media print{button{display:none}body,.deployment-map,.dep-piece,.dep-cmd{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body><h1>${title}</h1><div class="meta"><span>${date}</span><span>${location}</span><span>${esc(s.metadata?.gameLength||'—')} turns</span><span>${esc(state.project.playSpace?.width||'?')} × ${esc(state.project.playSpace?.height||'?')} ${esc(state.project.playSpace?.units||'')}</span><span>${esc(basingSummary(s))}</span></div>${opts.historical?`<h2>Historical Situation</h2>${hist?hist.split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,' ')}</p>`).join(''):'<p>Not provided.</p>'}`:''}${opts.map?`<h2>Battlefield</h2>${battlefieldNarrative?battlefieldNarrative.split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,' ')}</p>`).join(''):''}${currentMapHtml(state)}`:''}${opts.forces?`<h2>Forces</h2><div class="forces"><section><h3>${esc(sideA)}</h3>${forceHtml(s,'sideA')}</section><section><h3>${esc(sideB)}</h3>${forceHtml(s,'sideB')}</section></div>`:''}${opts.rules?`<h2>Scenario Special Rules</h2>${rules.length?rules.map(r=>`<div class="rule"><b>${esc(r.title)}.</b> ${esc(r.proposal)}${r.engineStatus==='tabletop'?'<span class="small"> [Tabletop rule]</span>':''}</div>`).join(''):'<p>None.</p>'}`:''}${opts.victory?`<h2>Victory Conditions</h2><p>${esc(authoritativeText(s.victoryText)||'Not provided.').replace(/\n/g,'<br>')}</p>`:''}${opts.deployment?`<h2>Deployment</h2>${deploymentMapHtml(state)}${authoritativeText(s.deploymentNotes)?`<p>${esc(authoritativeText(s.deploymentNotes)).replace(/\n/g,'<br>')}</p>`:''}`:''}${opts.notes?`<h2>Designer Notes / Sources</h2><p>${esc(authoritativeText([s.publication?.forceHistoryNotes,s.publication?.sourceDiscussion,s.publication?.designRationale,s.publication?.designerNotes,s.designerNotes].filter(Boolean).join('\\n\\n')))}</p><p class="small">Sources registered in Studio: ${(s.sources||[]).map(x=>esc(x.name)).join('; ')||'None listed.'}</p>`:''}</body></html>`;
}

export function setupScenarioPublisher(state){
  const frame=$('#publisherPreview');if(!frame)return null;
  function opts(){const layout=$('#publisherLayout')?.value||'scenario-sheet';if(layout==='scenario-sheet')return{layout,historical:true,map:true,forces:true,deployment:true,rules:true,victory:true,notes:false};if(layout==='dossier')return{layout:'comfortable',historical:true,map:true,forces:true,deployment:true,rules:true,victory:true,notes:true};return{layout,historical:$('#pubHistorical')?.checked,map:$('#pubMap')?.checked,forces:$('#pubForces')?.checked,deployment:$('#pubDeployment')?.checked,rules:$('#pubRules')?.checked,victory:$('#pubVictory')?.checked,notes:$('#pubNotes')?.checked};}
  function validate(){
    const s=state.project.scenario,issues=[];
    if(!s.metadata?.title)issues.push('Scenario title missing');
    if(!authoritativeText(historicalPublication(s,false)))issues.push('Historical situation missing');
    if(!state.project.mapSource)issues.push('No battlefield map generated for current scenario');
    if(!Object.values(s.commands||{}).flatMap(x=>x).length)issues.push('No force commands');
    if(!acceptedRules(s).length)issues.push('No scenario special rules');
    if(!authoritativeText(s.victoryText))issues.push('Victory conditions missing');
    const undeployed=Object.values(s.commands||{}).flatMap(cs=>cs.flatMap(c=>c.units||[])).filter(u=>!s.deployment?.placements?.[u.id]).length;
    if(undeployed)issues.push(`${undeployed} unit(s) are not deployed`);
    $('#publisherValidation').innerHTML=issues.length?`<strong>${issues.length} publication warning${issues.length===1?'':'s'}</strong><ul>${issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="success">Ready to publish ✓</p>';
    return issues;
  }
  function refresh(){const html=documentHtml(state,opts());frame.srcdoc=html;validate();const unitCount=Object.values(state.project.scenario.commands||{}).flatMap(cs=>cs.flatMap(c=>c.units||[])).length,rules=acceptedRules(state.project.scenario).length;$('#publisherPageEstimate').textContent=opts().layout==='scenario-sheet'?'1-page Battle Axe sheet':opts().layout==='dossier'?'Design dossier':unitCount>18||rules>5?'~3–4 pages':'~2–3 pages';return html;}
  function printPdf(){const html=refresh(),w=window.open('','_blank');if(!w)return;try{w.opener=null;}catch{}w.document.open();w.document.write(html);w.document.close();setTimeout(()=>{w.focus();w.print();},650);}
  function download(){const html=refresh(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download=`${(state.project.scenario.metadata?.title||'Battle_Axe_Scenario').replace(/[^a-z0-9]+/gi,'_')}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}
  $('#refreshPublisher')?.addEventListener('click',refresh);$('#exportPublisherPdf')?.addEventListener('click',printPdf);$('#downloadPublisherHtml')?.addEventListener('click',download);
  ['publisherLayout','pubHistorical','pubMap','pubForces','pubDeployment','pubRules','pubVictory','pubNotes'].forEach(id=>$(`#${id}`)?.addEventListener('change',refresh));
  document.querySelector('[data-view="publish"]')?.addEventListener('click',()=>setTimeout(refresh,0));
  window.addEventListener('bax:scenario-changed',()=>{if(document.querySelector('[data-view="publish"]')?.classList.contains('active'))refresh();});
  window.addEventListener('bax:battlefield-changed',refresh);
  refresh();return{refresh,documentHtml:()=>documentHtml(state,opts())};
}
