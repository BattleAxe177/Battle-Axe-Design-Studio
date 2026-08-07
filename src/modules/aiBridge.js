const $=s=>document.querySelector(s);
const safe=s=>(s??'').toString();

function acceptedRules(s){return (s.suggestions||[]).filter(x=>x.status==='accepted');}
function allCommands(s){return Object.entries(s.commands||{}).flatMap(([faction,cmds])=>(cmds||[]).map(c=>({faction,...c})));}
function approvedTerrain(state){return (state.project.features||[]).map(f=>({f,dec:state.decisions?.[f.id]})).filter(x=>x.dec?.status==='approved');}
function linesForCommands(s){const out=[];for(const c of allCommands(s)){out.push(`### ${c.faction} — ${c.name}`);out.push(`Commander: ${c.commander||'Unassigned'}`);for(const u of c.units||[])out.push(`- ${u.name} | BA profile: ${u.profile} | represents: ${u.represents||'not specified'} | traits: ${(u.traits||[]).join(', ')||'none'} | rationale: ${u.notes||'none'}`);out.push('');}return out;}
function deploymentLines(s){const out=[];const units=new Map();for(const c of allCommands(s))for(const u of c.units||[])units.set(u.id,{...u,command:c.name,faction:c.faction});for(const [id,p] of Object.entries(s.deployment?.placements||{})){const u=units.get(id);out.push(`- ${u?.name||id} (${u?.faction||p.faction||'?'}, ${u?.command||p.commandId||'?'}) at ${Number(p.x).toFixed(1)}%, ${Number(p.y).toFixed(1)}%`);}for(const z of s.deployment?.zones||[]){if(z.points)out.push(`- Zone ${z.name} (${z.faction||'unassigned'}): polygon ${z.points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ; ')}`);else out.push(`- Zone ${z.name} (${z.faction||'unassigned'}): rectangle ${z.x?.toFixed?.(1)},${z.y?.toFixed?.(1)} ${z.width?.toFixed?.(1)}×${z.height?.toFixed?.(1)}%`);}return out;}

export function buildAiBrief(state){const s=state.project.scenario;const terrain=approvedTerrain(state);const out=[
`# Battle Axe Design Studio — External AI Review Brief`,
``,
`You are assisting a scenario designer using Battle Axe Design Studio. Treat SOURCE EVIDENCE, STUDIO INTERPRETATION, and DESIGNER DECISIONS as separate layers. Do not silently change historical evidence. Propose changes rather than assuming they are accepted. When historical interpretation is uncertain, say so.`,
``,
`## Requested response format`,
`1. Briefly summarize what you understand the designer is trying to achieve.`,
`2. List proposed changes as discrete items with: target, action, proposed value/text, and rationale.`,
`3. Identify any source/design conflicts or uncertainties.`,
`4. Do not rewrite untouched parts of the scenario.`,
``,
`## Scenario metadata`,
`Title: ${s.metadata?.title||'Untitled'}`,
`Date: ${s.metadata?.date||'Not specified'}`,
`Location: ${s.metadata?.location||'Not specified'}`,
`Game length: ${s.metadata?.gameLength||'Not specified'}`,
`Play space: ${state.project.playSpace?.width||'?'} × ${state.project.playSpace?.height||'?'} ${state.project.playSpace?.units||''}`,
``,
`## Historical situation (designer-reviewed)`,
`${s.historicalSituation||'Not yet populated'}`,
``,
`## Source-derived historical commands/formations`,
...((s.sourceCommands||[]).length?(s.sourceCommands||[]).flatMap(c=>{const forms=(c.formations||[]).map(id=>(s.sourceForces||[]).find(f=>f.id===id)).filter(Boolean);return [`### ${c.faction} — ${c.name}`,`Commander: ${c.commander||'Not identified'} | Army commander: ${c.armyCommander||'Not identified'}`,...forms.map(f=>`- ${f.name} | source troop type: ${f.profile} | historical note: ${f.historicalNote||f.sourceText||'none'} | confidence ${f.confidence||'?'}%`),''];}):['No historical commands extracted.']),
`## Current Battle Axe force structure`,
...linesForCommands(s),
`## Accepted scenario rules / parameters`,
...((acceptedRules(s).length?acceptedRules(s).map(r=>`- ${r.title}: ${r.proposal}\n  Evidence/rationale: ${r.evidence||'none'}`):['None accepted.'])),
``,
`## Deployment`,
...((deploymentLines(s).length?deploymentLines(s):['No units/zones deployed.'])),
``,
`## Approved battlefield terrain`,
...((terrain.length?terrain.map(({f,dec})=>`- ${f.name}: ${dec.cls||f.cls}; effects ${(dec.effects||[]).join(', ')||'none'}; reviewer note ${dec.note||'none'}`):['No terrain approvals recorded.'])),
``,
`## Victory conditions`,
`${s.victoryText||'Not yet populated'}`,
``,
`## Unresolved items`,
...((s.unresolved||[]).length?(s.unresolved||[]).map(x=>`- ${x}`):['- None currently recorded']),
``,
`## Designer request`,
`[PASTE OR TYPE YOUR REQUEST TO THE EXTERNAL AI HERE]`
];return out.join('\n');}

export function setupAiBridge(state,persist){
  const dialog=$('#aiBridgeDialog');if(!dialog)return null;
  const open=()=>{$('#aiBriefText').value=buildAiBrief(state);$('#aiResponseText').value='';$('#aiBridgeStatus').textContent='Brief generated from current project state.';dialog.showModal();};
  $('#openAiBridge')?.addEventListener('click',open);$('#closeAiBridge')?.addEventListener('click',()=>dialog.close());
  $('#refreshAiBrief')?.addEventListener('click',()=>{$('#aiBriefText').value=buildAiBrief(state);$('#aiBridgeStatus').textContent='Brief refreshed.';});
  $('#copyAiBrief')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#aiBriefText').value);$('#aiBridgeStatus').textContent='Copied to clipboard.';}catch{$('#aiBridgeStatus').textContent='Clipboard unavailable — select the text and copy manually.';}});
  $('#downloadAiBrief')?.addEventListener('click',()=>{const blob=new Blob([$('#aiBriefText').value],{type:'text/markdown'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Battle_Axe_AI_Review_Brief.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);});
  $('#saveAiResponse')?.addEventListener('click',()=>{const text=$('#aiResponseText').value.trim();if(!text)return;const s=state.project.scenario;s.sources.push({id:`source-ai-${Date.now().toString(36)}`,name:'External AI response',type:'text/markdown',size:text.length,status:'external AI response saved for review',textExtracted:true,text});s.unresolved=[...new Set([...(s.unresolved||[]),'External AI response imported — review/analyze before applying changes'])];persist();$('#aiBridgeStatus').textContent='Response saved as scenario source evidence. Use Source Intake → Analyze sources to interpret it.';});
  return{open,build:()=>buildAiBrief(state)};
}
