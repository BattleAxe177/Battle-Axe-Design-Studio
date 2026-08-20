import { getEffectiveRuleset } from '../rules/ruleset.js?v=0.5.4.0';

function xmur3(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0;};}
function mulberry32(a){return()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function makeRng(seed){const h=xmur3(String(seed))();const r=mulberry32(h);return{float:r,d6:()=>1+Math.floor(r()*6),d3:()=>1+Math.floor(r()*3)};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const normDeg=d=>((d%360)+360)%360;
function bearing(a,b){return normDeg(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90);}
function shortestTurn(a,b){return ((b-a+540)%360)-180;}
function pivotToward(u,target,ctx){const to=bearing(u,target),delta=shortestTurn(u.facing??0,to);if(Math.abs(delta)<.5){u.facing=to;return 0;}const from=u.facing??0;u.facing=to;ctx.event('pivot',u,{from,to,delta});return Math.abs(delta);}
function coalition(f){return f==='French'?'French':'Imperial';}
function isSwissUnit(u){return /swiss/i.test(u?.name||'')||['Swiss Pikemen','Swiss Guard'].includes(u?.profile);}
function swissMutualRestriction(a,b,ctx=null){return !!ctx?.rules?.capabilities?.swissMutualRestriction&&isSwissUnit(a)&&isSwissUnit(b);}
function pctToTable(p,state){return{x:Number(p.x||0)/100*Number(state.project.playSpace?.width||48),y:Number(p.y||0)/100*Number(state.project.playSpace?.height||48)};}
function tableToPct(p,state){return{x:p.x/Number(state.project.playSpace?.width||48)*100,y:p.y/Number(state.project.playSpace?.height||48)*100};}
function toTablePoint(p,width,height){return{x:Number(p[0]||0)/100*width,y:Number(p[1]||0)/100*height};}
function pointInPoly(x,y,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;const hit=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-9)+xi);if(hit)inside=!inside;}return inside;}
function pointSegDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(!l2)return Math.hypot(x-a.x,y-a.y);let t=((x-a.x)*dx+(y-a.y)*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(x-(a.x+t*dx),y-(a.y+t*dy));}
function featureTerrain(state){
  const width=Number(state.project.playSpace?.width||48),height=Number(state.project.playSpace?.height||48);
  return (state.project.features||[]).map(f=>({f,dec:state.decisions?.[f.id]})).filter(x=>x.dec?.status==='approved').map(({f,dec})=>{
    const parts=(f.geometry?.parts||[]).map(part=>({closed:!!part.closed,points:(part.points||[]).map(p=>toTablePoint(p,width,height))})).filter(p=>p.points.length>=2);
    const z={id:f.id,name:f.name,cls:dec.cls||f.cls,effects:new Set(dec.effects||[]),parts,override:f.terrainOverride||null};
    if(!parts.length&&Array.isArray(f.box)){z.x=f.box[0]/100*width;z.y=f.box[1]/100*height;z.w=f.box[2]/100*width;z.h=f.box[3]/100*height;}
    return z;
  });
}
function terrainContains(z,x,y){
  if(z.parts?.length){for(const p of z.parts){if(p.closed&&p.points.length>=3&&pointInPoly(x,y,p.points))return true;if(!p.closed){const buffer=z.cls==='Masonry Wall'?0.22:z.cls==='Road'?0.18:z.cls==='Open Grove'?0.18:0.14;for(let i=1;i<p.points.length;i++)if(pointSegDistance(x,y,p.points[i-1],p.points[i])<=buffer)return true;}}return false;}
  return Number.isFinite(z.x)&&x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h;
}
function terrainAt(terrain,x,y){
  const out=new Set();let openOverride=false;
  for(const z of terrain)if(terrainContains(z,x,y)){if(z.override==='Open Crossing'||z.cls==='Bridge')openOverride=true;for(const e of z.effects)out.add(e);}
  if(openOverride){out.delete('Difficult');out.delete('Impassable');}
  return out;
}
function terrainAlong(terrain,a,b){const out=new Set(),d=dist(a,b),steps=Math.max(1,Math.ceil(d/.25));for(let i=0;i<=steps;i++){const q=i/steps,x=a.x+(b.x-a.x)*q,y=a.y+(b.y-a.y)*q;for(const e of terrainAt(terrain,x,y))out.add(e);}return out;}

function partDistanceToPoint(part,p){let m=Infinity;for(let i=1;i<part.points.length;i++)m=Math.min(m,pointSegDistance(p.x,p.y,part.points[i-1],part.points[i]));if(part.closed&&part.points.length>2)m=Math.min(m,pointSegDistance(p.x,p.y,part.points.at(-1),part.points[0]));return m;}
function segmentCrossesPart(a,b,part){for(let i=1;i<part.points.length;i++)if(segIntersect(a,b,part.points[i-1],part.points[i]))return true;if(part.closed&&part.points.length>2&&segIntersect(a,b,part.points.at(-1),part.points[0]))return true;return false;}
function defensiveRelation(attacker,target,ctx){
  const camp=ctx.units.find(a=>!a.destroyed&&!a.inactive&&a.profile==='Camp'&&coalition(a.faction)===coalition(target.faction)&&inContact(a,target));
  if(camp)return{defensive:true,source:'Camp',feature:camp.name};
  const features=[];
  for(const z of ctx.terrain){if(!z.effects?.has('Defensive'))continue;
    let area=false,directional=false;
    for(const part of z.parts||[]){
      if(part.closed&&part.points.length>=3&&pointInPoly(target.x,target.y,part.points)){area=true;break;}
      if(attacker&&!part.closed&&segmentCrossesPart({x:attacker.x,y:attacker.y},{x:target.x,y:target.y},part)&&partDistanceToPoint(part,target)<=baseSize(target)/2+.35){directional=true;break;}
    }
    if(!z.parts?.length&&terrainContains(z,target.x,target.y))area=true;
    if(area||directional)features.push({name:z.name||z.id,kind:directional?'directional':'area'});
  }
  return features.length?{defensive:true,source:features[0].kind==='directional'?'Linear Defensive Terrain':'Terrain',feature:features[0].name,features}:{defensive:false,source:null,feature:null,features:[]};
}
function applyDangerTestForPath(u,start,end,ctx,context='movement'){
  const effects=terrainAlong(ctx.terrain,start,end);if(!effects.has('Dangerous'))return true;const roll=ctx.rng.d6();ctx.event('danger_test',u,{roll,context,path:{from:start,to:end}});if(roll===1){u.destroyed=true;ctx.event('unit_destroyed',u,{cause:'dangerous terrain',roll,context});return false;}return true;
}

function baseSize(u){return Number(u.baseMm||50)/25.4;}
function forwardVec(facing){const r=(facing??0)*Math.PI/180;return{x:Math.sin(r),y:-Math.cos(r)};}
function rightVec(facing){const r=(facing??0)*Math.PI/180;return{x:Math.cos(r),y:Math.sin(r)};}
function rectCornersAt(u,x=u.x,y=u.y,facing=u.facing??0){const h=baseSize(u)/2,f=forwardVec(facing),r=rightVec(facing);return[
  {x:x+f.x*h+r.x*h,y:y+f.y*h+r.y*h},{x:x+f.x*h-r.x*h,y:y+f.y*h-r.y*h},
  {x:x-f.x*h-r.x*h,y:y-f.y*h-r.y*h},{x:x-f.x*h+r.x*h,y:y-f.y*h+r.y*h}
];}
function polygonAxes(poly){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;out.push({x:-dy/l,y:dx/l});}return out;}
function projectPoly(poly,axis){let lo=Infinity,hi=-Infinity;for(const p of poly){const q=p.x*axis.x+p.y*axis.y;lo=Math.min(lo,q);hi=Math.max(hi,q);}return{lo,hi};}
function rectOverlapAt(u,x,y,o,tol=1e-5){const a=rectCornersAt(u,x,y),b=rectCornersAt(o);for(const axis of [...polygonAxes(a),...polygonAxes(b)]){const A=projectPoly(a,axis),B=projectPoly(b,axis);if(A.hi<=B.lo+tol||B.hi<=A.lo+tol)return false;}return true;}
function basesTouchOrOverlap(a,b,tol=.035){const A=rectCornersAt(a),B=rectCornersAt(b);for(const axis of [...polygonAxes(A),...polygonAxes(B)]){const x=projectPoly(A,axis),y=projectPoly(B,axis);if(x.hi<y.lo-tol||y.hi<x.lo-tol)return false;}return true;}
function segIntersect(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);const c1=cross(a,b,c),c2=cross(a,b,d),c3=cross(c,d,a),c4=cross(c,d,b);return ((c1===0||c2===0||c1*c2<0)&&(c3===0||c4===0||c3*c4<0));}
function segmentIntersectsPoly(a,b,poly){if(pointInPoly(a.x,a.y,poly)||pointInPoly(b.x,b.y,poly))return true;for(let i=0;i<poly.length;i++)if(segIntersect(a,b,poly[i],poly[(i+1)%poly.length]))return true;return false;}
function pointPolyDistance(p,poly){if(pointInPoly(p.x,p.y,poly))return 0;let m=Infinity;for(let i=0;i<poly.length;i++)m=Math.min(m,pointSegDistance(p.x,p.y,poly[i],poly[(i+1)%poly.length]));return m;}
function baseGapDistance(a,b){const A=rectCornersAt(a),B=rectCornersAt(b);if(basesTouchOrOverlap(a,b,0))return 0;let m=Infinity;for(const p of A)m=Math.min(m,pointPolyDistance(p,B));for(const p of B)m=Math.min(m,pointPolyDistance(p,A));return m;}
function endpointClear(u,x,y,ctx,ignoreIds=new Set()){return !ctx.units.some(o=>o.id!==u.id&&!ignoreIds.has(o.id)&&!o.destroyed&&!o.inactive&&rectOverlapAt(u,x,y,o));}
function nearestClearEndpoint(u,start,desired,ctx){const dx=desired.x-start.x,dy=desired.y-start.y;for(let f=1;f>=0;f-=0.025){const x=start.x+dx*f,y=start.y+dy*f;if(endpointClear(u,x,y,ctx))return{x,y,f};}return null;}
function pikeShotTransitAllowed(a,b,ctx=null){if(!ctx?.rules?.capabilities?.pikeShotTransit)return false;if(coalition(a.faction)!==coalition(b.faction))return false;const pike=x=>x.traits.includes('Pikes')||['Swiss Pikemen','Landsknechts','Pikemen','Colunela Pike'].includes(x.profile);const shot=x=>['Swordsmen','Crossbowmen','Arquebusiers'].includes(x.profile);return (pike(a)&&shot(b))||(shot(a)&&pike(b));}
function movementPathBlocker(u,a,b,ctx,{charge=false}={}){for(const o of ctx.units){if(o.id===u.id||o.destroyed||o.inactive)continue;if(!segmentIntersectsPoly(a,b,rectCornersAt(o)))continue;if(!charge&&pikeShotTransitAllowed(u,o,ctx))continue;return o;}return null;}
function enemyTooCloseAt(u,x,y,ctx){const ghost={...u,x,y};return ctx.units.some(o=>!o.destroyed&&!o.inactive&&coalition(o.faction)!==coalition(u.faction)&&baseGapDistance(ghost,o)<1*ctx.scale-1e-4);}
function nearestLegalMoveEndpoint(u,start,desired,ctx){const dx=desired.x-start.x,dy=desired.y-start.y;for(let f=1;f>=0;f-=0.02){const x=start.x+dx*f,y=start.y+dy*f;if(!endpointClear(u,x,y,ctx))continue;if(enemyTooCloseAt(u,x,y,ctx))continue;return{x,y,f};}return null;}
function commanderForUnit(unit,commanders){return commanders.find(c=>!c.destroyed&&c.faction===unit.faction&&c.commandId===unit.commandId)||null;}
function generalForUnit(unit,commanders){return commanders.find(c=>!c.destroyed&&c.faction===unit.faction&&c.isGeneral)||null;}
function commandBonus(unit,commanders,scale){
  const own=commanderForUnit(unit,commanders);if(own&&dist(unit,own)<=3*scale)return{bonus:1,commander:own,range:3*scale,kind:'command'};
  const gen=generalForUnit(unit,commanders);if(gen&&dist(unit,gen)<=4*scale)return{bonus:1,commander:gen,range:4*scale,kind:'general'};
  return{bonus:0,commander:null,range:0,kind:'none'};
}
function commandTest(unit,ctx){const threshold=unit.traits.includes('Elite')?3:4,cb=commandBonus(unit,ctx.commanders,ctx.scale),die=ctx.rng.d6(),roll=die+cb.bonus,ok=roll>=threshold;ctx.event('command_test',unit,{die,bonus:cb.bonus,bonusFrom:cb.commander?.name||null,bonusKind:cb.kind,distance:cb.commander?Number(dist(unit,cb.commander).toFixed(2)):null,range:cb.range||null,roll,threshold,outcome:ok?'pass':'fail'});return ok;}
function commanderCommandTest(c,ctx,reason='commander test'){const die=ctx.rng.d6(),ok=die>=4;ctx.event('commander_command_test',c,{die,threshold:4,reason,outcome:ok?'pass':'fail'});return ok;}
function coverageForCommander(c,ctx){const range=(c.isGeneral?4:3)*ctx.scale;const candidates=ctx.units.filter(u=>!u.destroyed&&!u.inactive&&u.faction===c.faction&&(c.isGeneral||u.commandId===c.commandId));const covered=candidates.filter(u=>dist(c,u)<=range);return{range,candidates,covered,uncovered:candidates.filter(u=>dist(c,u)>range)};}
function commanderMoveTarget(c,ctx){const cov=coverageForCommander(c,ctx);if(!cov.candidates.length)return{cov,target:null,reason:'no active commanded units'};if(!cov.uncovered.length)return{cov,target:null,reason:'all eligible units already in command range'};const pool=cov.uncovered;return{cov,target:{x:pool.reduce((a,u)=>a+u.x,0)/pool.length,y:pool.reduce((a,u)=>a+u.y,0)/pool.length},reason:'reposition to improve command coverage'};}
function commanderEnemyTooCloseAt(c,x,y,ctx){const ghost={...c,x,y};return ctx.units.some(u=>!u.destroyed&&!u.inactive&&coalition(u.faction)!==coalition(c.faction)&&baseGapDistance(ghost,u)<1*ctx.scale-1e-4);}
function moveCommander(c,ctx){
  const before=commanderMoveTarget(c,ctx);if(!before.target){ctx.event('commander_hold',c,{reason:before.reason,covered:before.cov.covered.length,total:before.cov.candidates.length,commandRange:before.cov.range});return;}
  const maxMove=4*ctx.scale,d=dist(c,before.target);if(d<.01)return;let travel=Math.min(maxMove,d),nx=c.x+(before.target.x-c.x)/d*travel,ny=c.y+(before.target.y-c.y)/d*travel;
  while(travel>0&&commanderEnemyTooCloseAt(c,nx,ny,ctx)){travel=Math.max(0,travel-.25);nx=c.x+(before.target.x-c.x)/d*travel;ny=c.y+(before.target.y-c.y)/d*travel;}
  const from={x:c.x,y:c.y};c.x=clamp(nx,0,ctx.width);c.y=clamp(ny,0,ctx.height);applyDangerTestForPath(c,from,{x:c.x,y:c.y},ctx,'commander move');const after=coverageForCommander(c,ctx);ctx.event('commander_move',c,{from,to:{x:c.x,y:c.y},distance:Number(dist(from,c).toFixed(2)),reason:before.reason,coveredBefore:before.cov.covered.length,coveredAfter:after.covered.length,total:after.candidates.length,commandRange:after.range});
}
function moveCommandersForSide(side,ctx){for(const c of ctx.commanders.filter(c=>c.faction===side&&!c.destroyed))moveCommander(c,ctx);}
function nearestVisibleEnemyActor(u,ctx){
  const actors=[...ctx.units.filter(x=>!x.destroyed&&!x.inactive&&coalition(x.faction)!==coalition(u.faction)),...ctx.commanders.filter(x=>!x.destroyed&&coalition(x.faction)!==coalition(u.faction))];
  const visible=actors.filter(t=>lineOfSight(u,t,ctx).ok);visible.sort((a,b)=>baseGapDistance(u,a)-baseGapDistance(u,b));return visible[0]||null;
}
function canChargeCommander(u,c,ctx){if(!c||c.destroyed||u.destroyed||u.traits.includes('Army Asset'))return{ok:false,reason:'invalid commander target'};const nearest=nearestVisibleEnemyActor(u,ctx);if(!nearest||nearest.id!==c.id)return{ok:false,reason:'commander is not the nearest visible enemy'};const solution=chargeContactSolution(u,c,ctx);if(!solution.ok)return solution;return{...solution,commander:true};}
function chargeCommander(u,c,ctx){const legal=canChargeCommander(u,c,ctx);if(!legal.ok){ctx.event('charge_blocked',u,{target:c?.id||null,targetName:c?.name||'Commander',reason:legal.reason});return false;}const start={x:u.x,y:u.y},fromFacing=u.facing??0;u.facing=legal.facing;if(Math.abs(shortestTurn(fromFacing,u.facing))>.5)ctx.event('pivot',u,{from:fromFacing,to:u.facing,delta:shortestTurn(fromFacing,u.facing),charge:true});u.x=legal.contactCenter.x;u.y=legal.contactCenter.y;ctx.event('commander_charge_contact',u,{target:c.id,targetName:c.name,from:start,to:{x:u.x,y:u.y},movementDistance:Number(legal.needed.toFixed(3)),contactEstablished:true});if(!applyDangerTestForPath(u,start,{x:u.x,y:u.y},ctx,'charge'))return true;const passed=commanderCommandTest(c,ctx,'enemy unit moved into contact');if(!passed){c.destroyed=true;c.destroyedBy=u.id;ctx.event('commander_destroyed',c,{by:u.id,byName:u.name,isGeneral:!!c.isGeneral,victoryPoints:c.isGeneral?3:2,cause:'captured or killed after failed escape test'});return true;}const d3=ctx.rng.d3(),away=bearing(u,c),dir=forwardVec(away),from={x:c.x,y:c.y};c.x=clamp(c.x+dir.x*d3*ctx.scale,0,ctx.width);c.y=clamp(c.y+dir.y*d3*ctx.scale,0,ctx.height);applyDangerTestForPath(c,from,{x:c.x,y:c.y},ctx,'commander escape');ctx.event('commander_escape',c,{from,to:{x:c.x,y:c.y},d3,distance:d3*ctx.scale,awayFrom:u.id,awayFromName:u.name});return true;}
function breakTest(target,ctx){const roll=ctx.rng.d6(),total=roll+target.damage;if(total>=6){target.destroyed=true;ctx.event('unit_destroyed',target,{roll,damage:target.damage});return false;}ctx.event('break_test',target,{roll,damage:target.damage,total,outcome:'survives'});target.damage=0;return true;}
function shootingDice(u){if(u.traits.includes('Arquebus')||u.traits.includes('Arquebuses')||u.traits.includes('Pistols'))return 2;const s=u.traits.find(t=>/^Shoot \d+/i.test(t));return s?Number(s.match(/\d+/)[0]):0;}
function contactDistance(a,b){return (baseSize(a)+baseSize(b))/2;}
function inContact(a,b){return basesTouchOrOverlap(a,b,.035);}
function countsAsEngaged(a,b){return inContact(a,b)&&!swissMutualRestriction(a,b);}
function segmentBlockedByUnit(a,b,ctx,ignoreIds=new Set(),tallEndpoint=false){
  for(const o of ctx.units){if(o.destroyed||o.inactive||ignoreIds.has(o.id))continue;if(tallEndpoint&&!terrainAt(ctx.terrain,o.x,o.y).has('Tall'))continue;if(segmentIntersectsPoly(a,b,rectCornersAt(o)))return o;}
  return null;
}
function obscuringBlocksSegment(a,b,u,target,ctx){
  for(const z of ctx.terrain){if(!z.effects?.has('Obscuring'))continue;const uInside=terrainContains(z,u.x,u.y),tInside=terrainContains(z,target.x,target.y);if(uInside||tInside)continue;const steps=Math.max(3,Math.ceil(dist(a,b)/.15));for(let i=1;i<steps;i++){const q=i/steps,x=a.x+(b.x-a.x)*q,y=a.y+(b.y-a.y)*q;if(terrainContains(z,x,y))return z;}}
  return null;
}
function lineOfSight(u,target,ctx){
  const f=forwardVec(u.facing??0),r=rightVec(u.facing??0),h=baseSize(u)/2;
  const starts=[-0.45,0,0.45].map(k=>({x:u.x+f.x*h+r.x*h*k*2,y:u.y+f.y*h+r.y*h*k*2}));
  const ends=[...rectCornersAt(target),{x:target.x,y:target.y}];
  const tallEndpoint=terrainAt(ctx.terrain,u.x,u.y).has('Tall')||terrainAt(ctx.terrain,target.x,target.y).has('Tall');
  let last={reason:'no clear front-edge line',blocker:null};
  for(const a of starts)for(const b of ends){const unitBlock=segmentBlockedByUnit(a,b,ctx,new Set([u.id,target.id]),tallEndpoint);if(unitBlock){last={reason:'unit',blocker:unitBlock.name};continue;}const terrainBlock=obscuringBlocksSegment(a,b,u,target,ctx);if(terrainBlock){last={reason:'obscuring terrain',blocker:terrainBlock.name};continue;}return{ok:true,from:a,to:b};}
  return{ok:false,...last};
}
function rayToTargetEdge(origin,dir,target){
  const r=rightVec(target.facing??0),f=forwardVec(target.facing??0),h=baseSize(target)/2,rel={x:origin.x-target.x,y:origin.y-target.y};
  const ox=rel.x*r.x+rel.y*r.y,oy=rel.x*f.x+rel.y*f.y,dx=dir.x*r.x+dir.y*r.y,dy=dir.x*f.x+dir.y*f.y;
  let best=null;const candidates=[];if(Math.abs(dx)>1e-9){candidates.push({t:(h-ox)/dx,edge:'right'});candidates.push({t:(-h-ox)/dx,edge:'left'});}if(Math.abs(dy)>1e-9){candidates.push({t:(h-oy)/dy,edge:'front'});candidates.push({t:(-h-oy)/dy,edge:'rear'});}
  for(const c of candidates){if(c.t<-.0001)continue;const x=ox+dx*c.t,y=oy+dy*c.t;if(x<-h-.001||x>h+.001||y<-h-.001||y>h+.001)continue;if(!best||c.t<best.t)best={...c,local:{x,y},world:{x:target.x+r.x*x+f.x*y,y:target.y+r.y*x+f.y*y}};}return best;
}
function chargeContactSolution(u,target,ctx){
  const desired=bearing(u,target),signed=shortestTurn(u.facing??0,desired);if(Math.abs(signed)>45.0001)return{ok:false,reason:'target outside 45° charge wheel',turn:Math.abs(signed)};
  const facing=normDeg((u.facing??0)+signed),dir=forwardVec(facing),right=rightVec(facing),h=baseSize(u)/2,front={x:u.x+dir.x*h,y:u.y+dir.y*h};
  let hit=null;for(const k of [-1,-.5,0,.5,1]){const origin={x:front.x+right.x*h*k,y:front.y+right.y*h*k};const q=rayToTargetEdge(origin,dir,target);if(q&&(!hit||q.t<hit.t))hit={...q,frontSample:k,origin};}
  if(!hit)return{ok:false,reason:'charge line does not contact defender base'};const needed=Math.max(0,hit.t);
  const contactCenter={x:u.x+dir.x*needed,y:u.y+dir.y*needed},effects=terrainAlong(ctx.terrain,{x:u.x,y:u.y},contactCenter),moveAllowance=(effects.has('Difficult')?u.move/2:u.move)*ctx.scale;if(needed>moveAllowance+1e-6)return{ok:false,reason:effects.has('Difficult')?'outside halved Move through Difficult terrain':'outside charge move',needed,moveAllowance};if(effects.has('Impassable'))return{ok:false,reason:'impassable terrain'};
  const blocker=movementPathBlocker(u,{x:u.x,y:u.y},contactCenter,ctx,{charge:true});if(blocker&&blocker.id!==target.id)return{ok:false,reason:'charge path blocked',blocker:blocker.name};
  return{ok:true,facing,turn:Math.abs(signed),needed,hit,contactCenter,effects:[...effects]};
}
function conformToDefender(u,target,solution,ctx){
  const edge=solution.hit.edge,tr=rightVec(target.facing??0),tf=forwardVec(target.facing??0),ah=baseSize(u)/2,th=baseSize(target)/2;let outward;
  if(edge==='front')outward=tf;else if(edge==='rear')outward={x:-tf.x,y:-tf.y};else if(edge==='right')outward=tr;else outward={x:-tr.x,y:-tr.y};
  const inward={x:-outward.x,y:-outward.y},finalFacing=bearing({x:0,y:0},inward),tangent=(edge==='front'||edge==='rear')?tr:tf,edgePoint=solution.hit.world,span=Math.max(0,th-ah*.15);
  for(const off of [0,.15,-.15,.3,-.3,.45,-.45,.6,-.6].map(v=>v*span)){const p={x:edgePoint.x+tangent.x*off,y:edgePoint.y+tangent.y*off},x=p.x+outward.x*ah,y=p.y+outward.y*ah,ghost={...u,x,y,facing:finalFacing};if(!endpointClear(ghost,x,y,ctx,new Set([target.id])))continue;return{x,y,facing:finalFacing,edge,contactPoint:p,conformDistance:Math.hypot(x-solution.contactCenter.x,y-solution.contactCenter.y)};}return null;
}
function canCharge(u,target,ctx){
  if(u.destroyed||target.destroyed||u.traits.includes('Army Asset'))return{ok:false,reason:'invalid unit'};if(swissMutualRestriction(u,target,ctx))return{ok:false,reason:'Swiss units may not charge other Swiss units'};if(countsAsEngaged(u,target))return{ok:false,reason:'already in contact'};const solution=chargeContactSolution(u,target,ctx);if(!solution.ok)return solution;const conform=conformToDefender(u,target,solution,ctx);if(!conform)return{ok:false,reason:'unable to conform without overlapping another unit'};return{...solution,conform};
}
function counterCharge(defender,charger,ctx){
  if(!ctx.rules?.capabilities?.italianWarsTraits||!defender.traits.includes('Shock Cavalry')||defender.destroyed||defender.chargedThisPhase||swissMutualRestriction(defender,charger,ctx))return false;if(!commandTest(defender,ctx)){ctx.event('counter_charge_failed',defender,{charger:charger.id,chargerName:charger.name});return false;}
  const d3=ctx.rng.d3(),allowance=d3*ctx.scale,start={x:defender.x,y:defender.y},dir=forwardVec(defender.facing),desired={x:clamp(defender.x+dir.x*allowance,0,ctx.width),y:clamp(defender.y+dir.y*allowance,0,ctx.height)},effects=terrainAlong(ctx.terrain,start,desired);
  if(effects.has('Impassable')){ctx.event('counter_charge_blocked',defender,{charger:charger.id,reason:'Impassable terrain'});return false;}
  let end=desired,contact=false;const front={x:defender.x+dir.x*baseSize(defender)/2,y:defender.y+dir.y*baseSize(defender)/2},hit=rayToTargetEdge(front,dir,charger);
  if(hit&&hit.t<=allowance+1e-6){const center={x:defender.x+dir.x*hit.t,y:defender.y+dir.y*hit.t},blocker=movementPathBlocker(defender,start,center,ctx,{charge:true});if(!blocker||blocker.id===charger.id){defender.x=center.x;defender.y=center.y;const pseudo={hit,contactCenter:center};const conform=conformToDefender(defender,charger,pseudo,ctx);if(conform){defender.x=conform.x;defender.y=conform.y;defender.facing=conform.facing;}defender.engagedWith=charger.id;charger.engagedWith=defender.id;contact=true;}}
  if(!contact){const blocker=movementPathBlocker(defender,start,desired,ctx,{charge:true});if(blocker&&blocker.id!==charger.id){ctx.event('counter_charge_blocked',defender,{charger:charger.id,blocker:blocker.name});return false;}const clear=nearestClearEndpoint(defender,start,desired,ctx);if(clear){defender.x=clear.x;defender.y=clear.y;}}
  applyDangerTestForPath(defender,start,{x:defender.x,y:defender.y},ctx,'counter-charge');defender.chargedThisPhase=true;ctx.event('counter_charge',defender,{charger:charger.id,chargerName:charger.name,d3,from:start,to:{x:defender.x,y:defender.y},straightForward:true,originalFacing:start.facing??defender.facing,contactEstablished:countsAsEngaged(defender,charger)});return true;
}
function charge(u,target,ctx){
  let legal=canCharge(u,target,ctx);if(!legal.ok){ctx.event('charge_blocked',u,{target:target.id,targetName:target.name,reason:legal.reason,turn:legal.turn??null,needed:legal.needed??null,blocker:legal.blocker??null});return false;}
  // Shock Cavalry may counter-charge before the original charger completes its move.
  counterCharge(target,u,ctx);if(target.destroyed)return false;if(countsAsEngaged(u,target)){u.chargedThisPhase=true;ctx.event('charge',u,{target:target.id,targetName:target.name,from:{x:u.x,y:u.y},to:{x:u.x,y:u.y},distance:0,contactEstablished:true,conformed:true,counterChargeContact:true});return true;}
  legal=canCharge(u,target,ctx);if(!legal.ok){ctx.event('charge_blocked',u,{target:target.id,targetName:target.name,reason:`after counter-charge: ${legal.reason}`});return false;}
  const start={x:u.x,y:u.y},fromFacing=u.facing??0;u.facing=legal.facing;if(Math.abs(shortestTurn(fromFacing,u.facing))>.5)ctx.event('pivot',u,{from:fromFacing,to:u.facing,delta:shortestTurn(fromFacing,u.facing),charge:true});
  u.x=legal.contactCenter.x;u.y=legal.contactCenter.y;ctx.event('charge_contact',u,{target:target.id,targetName:target.name,from:start,to:{x:u.x,y:u.y},movementDistance:Number(legal.needed.toFixed(3)),contactPoint:legal.hit.world,defenderEdge:legal.hit.edge,contactEstablished:true,terrain:legal.effects});
  if(!applyDangerTestForPath(u,start,{x:u.x,y:u.y},ctx,'charge'))return true;
  if(u.traits.includes('Pistols')&&!target.destroyed){const defense=defenseState(target,ctx,u);attack(target,2,defense.defensive?6:5,ctx,u,true,{special:'Pistols before charge contact',preCharge:true,lineOfSight:true});if(target.destroyed){u.chargedThisPhase=true;ctx.event('charge_target_destroyed_by_pistols',u,{target:target.id,targetName:target.name});return true;}}
  const before={x:u.x,y:u.y,facing:u.facing};u.x=legal.conform.x;u.y=legal.conform.y;u.facing=legal.conform.facing;ctx.event('charge_conform',u,{target:target.id,targetName:target.name,from:before,to:{x:u.x,y:u.y},facing:u.facing,defenderEdge:legal.conform.edge,conformDistance:Number(legal.conform.conformDistance.toFixed(3)),conformIsFree:true,movementDistance:Number(legal.needed.toFixed(3)),movementAllowance:u.move*ctx.scale,totalPhysicalDisplacement:Number((legal.needed+legal.conform.conformDistance).toFixed(3)),mayExceedMovementAllowance:true});
  u.chargedThisPhase=true;u.engagedWith=target.id;target.engagedWith=target.engagedWith||u.id;ctx.event('charge',u,{target:target.id,targetName:target.name,from:start,to:{x:u.x,y:u.y},distance:Number(legal.needed.toFixed(2)),contactEstablished:countsAsEngaged(u,target),conformed:true,defenderEdge:legal.conform.edge,terrain:legal.effects});
  if(target.traits.includes('Artillery')){target.destroyed=true;ctx.event('artillery_destroyed_on_contact',u,{target:target.id,targetName:target.name,contactVerified:true});return true;}
  if(target.traits.includes('Army Asset')){const protectedBy=ctx.units.find(f=>!f.destroyed&&!f.inactive&&!f.traits.includes('Army Asset')&&coalition(f.faction)===coalition(target.faction)&&countsAsEngaged(f,target));if(!protectedBy){target.destroyed=true;ctx.event('army_asset_destroyed',u,{target:target.id,targetName:target.name,assetType:target.profile,victoryPoints:target.profile==='Camp'?4:2,contactVerified:true});}else ctx.event('army_asset_protected',u,{target:target.id,targetName:target.name,protectedBy:protectedBy.name});}return true;
}
function defenseState(target,ctx,attacker=null){const effects=terrainAt(ctx.terrain,target.x,target.y),relation=defensiveRelation(attacker,target,ctx),defensive=relation.defensive;const names=[...effects];if(relation.source==='Camp')names.push('Camp Defensive');if(relation.feature&&!names.includes(relation.feature))names.push(relation.feature);return{effects:names,defensive,defensiveSource:relation.source,defensiveFeature:relation.feature,baseArmor:target.armor,effectiveArmor:defensive?6:target.armor};}
function attack(target,count,armor,ctx,attacker,shooting=false,meta={}){const rolls=Array.from({length:count},()=>ctx.rng.d6()),hits=rolls.filter(r=>r>=armor).length;target.damage+=hits;ctx.event('attack',attacker,{target:target.id,targetName:target.name,rolls,armor,hits,shooting,...meta});if(hits&&!target.destroyed)breakTest(target,ctx);return hits;}
function canShoot(u,target,ctx){
  if(!target||target.kind==='commander')return{ok:false,reason:'Commanders cannot be shot at'};if(u.destroyed||target.destroyed||countsAsEngaged(u,target)||swissMutualRestriction(u,target,ctx))return{ok:false,reason:'invalid target'};const los=lineOfSight(u,target,ctx);if(!los.ok)return{ok:false,reason:los.reason,blocker:los.blocker};
  if(u.traits.includes('Artillery')){if(ctx.units.some(e=>e.id!==target.id&&!e.destroyed&&!e.inactive&&coalition(e.faction)!==coalition(target.faction)&&countsAsEngaged(target,e)))return{ok:false,reason:'Artillery may not target an enemy engaged in combat'};if(baseGapDistance(u,target)>8*ctx.scale)return{ok:false,reason:'outside artillery range'};return{ok:true,kind:'artillery',los};}
  const dice=shootingDice(u);if(!dice)return{ok:false,reason:'unit has no shooting capability'};const range=(u.traits.includes('Arquebus')||u.traits.includes('Arquebuses')||u.traits.includes('Pistols')?2:4)*ctx.scale;if(baseGapDistance(u,target)>range)return{ok:false,reason:'outside shooting range'};return{ok:true,kind:'shoot',dice,range,los};
}
function shoot(u,target,ctx){const legal=canShoot(u,target,ctx);if(!legal.ok){if(['unit','obscuring terrain','no clear front-edge line'].includes(legal.reason))ctx.event('shoot_blocked',u,{target:target?.id,targetName:target?.name,reason:legal.reason,blocker:legal.blocker||null});return false;}const defense=defenseState(target,ctx,u);
  if(legal.kind==='artillery'){const roll=ctx.rng.d6();ctx.event('artillery',u,{target:target.id,targetName:target.name,roll,terrain:defense.effects,defensive:defense.defensive,defensiveSource:defense.defensiveSource,defensiveFeature:defense.defensiveFeature,lineOfSight:true});if(roll>=5){target.damage+=ctx.rng.d3();breakTest(target,ctx);}return true;}
  let armor=defense.effectiveArmor;if(!defense.defensive){if(u.traits.includes('Arquebus')||u.traits.includes('Arquebuses'))armor=4;if(u.traits.includes('Pistols'))armor=5;}attack(target,legal.dice,armor,ctx,u,true,{terrain:defense.effects,defensive:defense.defensive,defensiveSource:defense.defensiveSource,defensiveFeature:defense.defensiveFeature,baseArmor:defense.baseArmor,defensiveArmor:defense.defensive?6:null,lineOfSight:true});return true;
}
function canSkirmish(u,target,ctx){if(u.skirmishedThisTurn||!u.traits.includes('Javelins')||u.destroyed||target.destroyed||swissMutualRestriction(u,target,ctx)||baseGapDistance(u,target)>2*ctx.scale)return false;return lineOfSight(u,target,ctx).ok;}
function skirmishAction(u,target,ctx){
  if(!canSkirmish(u,target,ctx))return false;u.skirmishedThisTurn=true;const defense=defenseState(target,ctx,u);attack(target,2,defense.effectiveArmor,ctx,u,true,{specialAction:'Skirmish',terrain:defense.effects,defensive:defense.defensive,lineOfSight:true});if(u.destroyed)return true;
  const start={x:u.x,y:u.y},f=forwardVec(u.facing),baseAllowance=u.move*ctx.scale,tentative={x:clamp(u.x-f.x*baseAllowance,0,ctx.width),y:clamp(u.y-f.y*baseAllowance,0,ctx.height)},tentativeEffects=terrainAlong(ctx.terrain,start,tentative),allowance=tentativeEffects.has('Difficult')?baseAllowance/2:baseAllowance,desired={x:clamp(u.x-f.x*allowance,0,ctx.width),y:clamp(u.y-f.y*allowance,0,ctx.height)};
  if(terrainAlong(ctx.terrain,start,desired).has('Impassable')){ctx.event('skirmish_move_blocked',u,{reason:'Impassable terrain'});return true;}const blocker=movementPathBlocker(u,start,desired,ctx,{charge:false});let end=desired;if(blocker&&!pikeShotTransitAllowed(u,blocker,ctx)){const dx=desired.x-start.x,dy=desired.y-start.y;for(let q=.98;q>=0;q-=.02){const c={x:start.x+dx*q,y:start.y+dy*q};if(!segmentIntersectsPoly(start,c,rectCornersAt(blocker))){end=c;break;}}}
  const clear=nearestLegalMoveEndpoint(u,start,end,ctx);if(clear){u.x=clear.x;u.y=clear.y;const effects=terrainAlong(ctx.terrain,start,{x:u.x,y:u.y});applyDangerTestForPath(u,start,{x:u.x,y:u.y},ctx,'skirmish move');ctx.event('skirmish_move',u,{from:start,to:{x:u.x,y:u.y},distance:Number(dist(start,u).toFixed(3)),backwardFullSpeed:true,terrain:[...effects]});}return true;
}
function contactArc(defender,attacker){const rel=Math.abs(shortestTurn(defender.facing??0,bearing(defender,attacker)));if(rel<=45)return'front';if(rel>=135)return'rear';return'side';}
function chargeAttackMultiplier(attacker,target){if(!attacker.chargedThisPhase)return 1;if(attacker.traits.includes('Fury'))return 2;if(attacker.traits.includes('Shock Cavalry')&&!target.traits.includes('Pikes'))return 2;return 1;}
function pikeFrontBonus(attacker,target){return attacker.traits.includes('Pikes')&&!attacker.chargedThisPhase&&contactArc(attacker,target)==='front';}
function flankRearBonus(attacker,target){return contactArc(attacker,target)==='front'&&contactArc(target,attacker)!=='front';}
function rollMeleeAttack(attacker,target,count,ctx,meta={}){
  if(attacker.destroyed||target.destroyed||!countsAsEngaged(attacker,target)||swissMutualRestriction(attacker,target,ctx))return 0;const def=defenseState(target,ctx,attacker),pike=pikeFrontBonus(attacker,target),mult=chargeAttackMultiplier(attacker,target)*(pike?2:1)*(flankRearBonus(attacker,target)?2:1),dice=Math.max(0,count*mult),raw=Array.from({length:dice},()=>ctx.rng.d6()),rerolls=[];
  const rolls=raw.map(r=>{if(pike&&r===1){const n=ctx.rng.d6();rerolls.push(n);return n;}return r;});const hits=rolls.filter(r=>r>=def.effectiveArmor).length;target.damage+=hits;ctx.event('attack',attacker,{target:target.id,targetName:target.name,rolls,initialRolls:raw,rerolls,armor:def.effectiveArmor,hits,shooting:false,terrain:def.effects,defensive:def.defensive,baseArmor:def.baseArmor,defensiveArmor:def.defensive?6:null,contactVerified:true,attackerArc:contactArc(attacker,target),targetArc:contactArc(target,attacker),pikeFrontBonus:pike,flankRearBonus:flankRearBonus(attacker,target),chargeMultiplier:chargeAttackMultiplier(attacker,target),...meta});return hits;
}
function allocateBaseAttacks(unit,enemies){const pri={front:0,side:1,rear:2},ordered=[...enemies].sort((a,b)=>pri[contactArc(unit,a)]-pri[contactArc(unit,b)]),alloc=new Map(ordered.map(t=>[t,0]));if(!ordered.length)return alloc;for(let i=0;i<unit.combat;i++){const t=ordered[i%ordered.length];alloc.set(t,alloc.get(t)+1);}return alloc;}
function combatTier(u,ctx,enemies=[]){if(enemies.some(e=>defenseState(u,ctx,e).defensive))return 0;if(u.chargedThisPhase)return 1;return 2;}
// Defensive precedence equivalent to legacy check: tDef.defensive&&!uDef.defensive; exposed as defenderAttacksFirst in log metadata.
function resolveCloseCombat(side,ctx){
  const defenderAttacksFirst=true,living=ctx.units.filter(u=>!u.destroyed&&!u.inactive&&!u.traits.includes('Army Asset')),engaged=living.filter(u=>living.some(t=>coalition(t.faction)!==coalition(u.faction)&&countsAsEngaged(u,t)));
  for(const tier of [0,1,2]){const damaged=new Set();for(const u of engaged){if(u.destroyed)continue;const enemies=living.filter(t=>!t.destroyed&&coalition(t.faction)!==coalition(u.faction)&&countsAsEngaged(u,t));if(combatTier(u,ctx,enemies)!==tier)continue;if(!enemies.length)continue;const alloc=allocateBaseAttacks(u,enemies);for(const [t,count] of alloc){if(count<=0||t.destroyed)continue;const hits=rollMeleeAttack(u,t,count,ctx,{combatTier:tier,multipleFronts:enemies.length>1});if(hits)damaged.add(t);}}for(const t of damaged)if(!t.destroyed&&t.damage>0)breakTest(t,ctx);}
  for(const u of ctx.units){u.chargedThisPhase=false;if(u.destroyed)u.engagedWith=null;}
}
function moveToward(u,target,ctx){
  if(u.traits.includes('Immobile')){ctx.event('move_blocked',u,{reason:'Immobile army asset'});return false;}const start={x:u.x,y:u.y},desired=bearing(u,target),delta=clamp(shortestTurn(u.facing??0,desired),-90,90),fromFacing=u.facing??0;u.facing=normDeg(fromFacing+delta);if(Math.abs(delta)>.5)ctx.event('pivot',u,{from:fromFacing,to:u.facing,delta,move:true});
  const dir=forwardVec(u.facing),allowBase=u.move*ctx.scale,tentative={x:clamp(u.x+dir.x*allowBase,0,ctx.width),y:clamp(u.y+dir.y*allowBase,0,ctx.height)};let effects=terrainAlong(ctx.terrain,start,tentative),allowance=effects.has('Difficult')?allowBase/2:allowBase,desiredEnd={x:clamp(u.x+dir.x*allowance,0,ctx.width),y:clamp(u.y+dir.y*allowance,0,ctx.height)};effects=terrainAlong(ctx.terrain,start,desiredEnd);
  if(effects.has('Impassable')){ctx.event('move_blocked',u,{from:start,toward:desiredEnd,reason:'Impassable terrain'});u.facing=fromFacing;return false;}
  const blocker=movementPathBlocker(u,start,desiredEnd,ctx,{charge:false});let clipped=desiredEnd;if(blocker&&!pikeShotTransitAllowed(u,blocker,ctx)){const dx=desiredEnd.x-start.x,dy=desiredEnd.y-start.y;for(let f=.98;f>=0;f-=.02){const q={x:start.x+dx*f,y:start.y+dy*f};if(!segmentIntersectsPoly(start,q,rectCornersAt(blocker))){clipped=q;break;}}ctx.event('move_shortened',u,{reason:'Movement path blocked by unit',blocker:blocker.name});}
  const clear=nearestLegalMoveEndpoint(u,start,clipped,ctx);if(!clear){ctx.event('move_blocked',u,{from:start,toward:clipped,reason:'No legal final position / enemy 1-inch exclusion'});u.facing=fromFacing;return false;}if(clear.f<0.999)ctx.event('move_shortened',u,{intended:clipped,to:{x:clear.x,y:clear.y},reason:'Final footprint collision or 1-inch enemy exclusion'});u.x=clear.x;u.y=clear.y;const actualEffects=terrainAlong(ctx.terrain,start,{x:u.x,y:u.y});applyDangerTestForPath(u,start,{x:u.x,y:u.y},ctx,'move');ctx.event('move',u,{from:start,to:{x:u.x,y:u.y},distance:Number(dist(start,u).toFixed(3)),terrain:[...actualEffects],wheelDegrees:Number(delta.toFixed(2)),straightAfterWheel:true});return true;
}
function nearestEnemy(u,units){return units.filter(x=>!x.destroyed&&!x.inactive&&coalition(x.faction)!==coalition(u.faction)).sort((a,b)=>dist(u,a)-dist(u,b))[0]||null;}
function legalActionsForUnit(u,ctx){
  if(u.destroyed||u.inactive||u.traits.includes('Army Asset'))return[];if(ctx.units.some(t=>!t.destroyed&&coalition(t.faction)!==coalition(u.faction)&&countsAsEngaged(u,t)))return[];
  const actions=[],enemies=ctx.units.filter(t=>!t.destroyed&&!t.inactive&&coalition(t.faction)!==coalition(u.faction));
  for(const t of enemies){if(canSkirmish(u,t,ctx))actions.push({type:'skirmish',target:t,distance:baseGapDistance(u,t)});const shot=canShoot(u,t,ctx);if(shot.ok)actions.push({type:'shoot',target:t,distance:baseGapDistance(u,t),legal:shot});const ch=canCharge(u,t,ctx);if(ch.ok)actions.push({type:'charge',target:t,distance:ch.needed,legal:ch});}
  for(const c of ctx.commanders.filter(c=>!c.destroyed&&coalition(c.faction)!==coalition(u.faction))){const ch=canChargeCommander(u,c,ctx);if(ch.ok)actions.push({type:'charge_commander',target:c,distance:ch.needed,legal:ch});}
  const toward=nearestVisibleEnemyActor(u,ctx)||nearestEnemy(u,ctx.units);if(toward)actions.push({type:'move',target:toward,distance:baseGapDistance(u,toward)});return actions;
}
function chooseTacticalAction(actions){const priority={skirmish:0,shoot:1,charge:2,charge_commander:2,move:3};return [...actions].sort((a,b)=>(priority[a.type]-priority[b.type])||(a.distance-b.distance))[0]||null;}
function executeAction(action,u,ctx){if(!action)return false;if(action.type==='skirmish')return skirmishAction(u,action.target,ctx)?'skirmish':false;if(action.type==='shoot')return shoot(u,action.target,ctx)?'shoot':false;if(action.type==='charge')return charge(u,action.target,ctx)?'charge':false;if(action.type==='charge_commander')return chargeCommander(u,action.target,ctx)?'charge_commander':false;if(action.type==='move')return moveToward(u,action.target,ctx)?'move':false;return false;}
function activate(u,ctx,unalerted){
  if(u.destroyed||u.inactive||u.traits.includes('Army Asset'))return;if(unalerted.has(u.id)){if(!commandTest(u,ctx)){ctx.event('activation_blocked',u,{reason:'unalerted'});return;}unalerted.delete(u.id);ctx.event('unit_alerted',u,{});}if(ctx.units.some(t=>!t.destroyed&&coalition(t.faction)!==coalition(u.faction)&&countsAsEngaged(u,t))){ctx.event('activation_hold',u,{reason:'engaged in close combat'});return;}
  const firstLegal=legalActionsForUnit(u,ctx),firstAction=chooseTacticalAction(firstLegal);ctx.event('ai_action_choice',u,{action:firstAction?.type||null,target:firstAction?.target?.id||null,targetName:firstAction?.target?.name||null,legalActionCount:firstLegal.length});const first=executeAction(firstAction,u,ctx);if(!first||u.destroyed||['charge','charge_commander'].includes(first))return;if(ctx.units.some(t=>!t.destroyed&&coalition(t.faction)!==coalition(u.faction)&&countsAsEngaged(u,t)))return;if(commandTest(u,ctx)){const secondLegal=legalActionsForUnit(u,ctx),secondAction=chooseTacticalAction(secondLegal);ctx.event('ai_action_choice',u,{action:secondAction?.type||null,target:secondAction?.target?.id||null,targetName:secondAction?.target?.name||null,legalActionCount:secondLegal.length,secondAction:true});executeAction(secondAction,u,ctx);}
}
function vpFor(side,units,commanders=[]){const destroyed=units.filter(u=>coalition(u.faction)!==coalition(side)&&u.destroyed).reduce((a,u)=>a+(u.profile==='Camp'?4:u.profile==='Baggage Train'?2:(u.points||0)),0),commanderVp=commanders.filter(c=>coalition(c.faction)!==coalition(side)&&c.destroyed).reduce((a,c)=>a+(c.isGeneral?3:2),0),retainedAssets=units.filter(u=>coalition(u.faction)===coalition(side)&&!u.destroyed&&['Camp','Baggage Train'].includes(u.profile)).length;return destroyed+commanderVp+retainedAssets;}
function winner(units,commanders,turn,maxTurns){const alive=new Set(units.filter(u=>!u.destroyed&&!u.inactive).map(u=>coalition(u.faction)));if(alive.size===1)return [...alive][0];if(turn>maxTurns){const f=vpFor('French',units,commanders),i=vpFor('Imperial',units,commanders);return f===i?'Draw':f>i?'French':'Imperial';}return null;}
function makeSnapshot(ctx,event){return{event,units:ctx.units.map(u=>({id:u.id,name:u.name,profile:u.profile,commandId:u.commandId,faction:u.faction,x:u.x,y:u.y,facing:u.facing??0,destroyed:u.destroyed,inactive:u.inactive})),commanders:ctx.commanders.map(c=>({...c}))};}
function acceptedText(s){return (s.suggestions||[]).filter(x=>x.status==='accepted').map(x=>`${x.title} ${x.proposal}`).join(' ').toLowerCase();}

export function scenarioConfigFingerprint(state){const s=state.project.scenario||{};const relevant={battlefieldRevision:state.project.battlefieldRevision||state.project.mapSource?.battlefieldRevision||null,playSpace:state.project.playSpace,ruleset:s.ruleset,tabletop:s.tabletop,metadata:s.metadata,commands:s.commands,deployment:s.deployment,rules:(s.suggestions||[]).filter(x=>x.status==='accepted').map(x=>({id:x.id,title:x.title,proposal:x.proposal,engineStatus:x.engineStatus,engineText:x.engineText,overrides:x.overrides})),victory:s.victoryText,terrain:(state.project.features||[]).map(f=>({id:f.id,geometry:f.geometry,box:f.box,override:f.terrainOverride,decision:state.decisions?.[f.id]}))};const str=JSON.stringify(relevant);let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return `cfg-${(h>>>0).toString(16).padStart(8,'0')}`;}

export function buildRuntimeFromStudio(state,settings={}){const s=state.project.scenario,rules=getEffectiveRuleset(s),profileMap=new Map(rules.unitLibrary.map(x=>[x.profile,x])),units=[],commanders=[],tabletop={unitBaseMm:50,commanderBaseMm:25,measurementMultiplier:2,...(s.tabletop||{})},scale=Number(settings.measurementScale??tabletop.measurementMultiplier);for(const [faction,cmds] of Object.entries(s.commands||{})){for(let ci=0;ci<(cmds||[]).length;ci++){const c=cmds[ci];const cp=s.deployment?.commanderPlacements?.[c.id];if(c.commander&&cp){const p=pctToTable(cp,state);commanders.push({id:`cmd-${c.id}`,kind:'commander',commandId:c.id,name:c.commander,faction,x:p.x,y:p.y,baseMm:Number(tabletop.commanderBaseMm||25),traits:[],destroyed:false,isGeneral:!!c.isGeneral||ci===0});}for(const u of c.units||[]){const p0=s.deployment?.placements?.[u.id];if(!p0)continue;const p=pctToTable(p0,state),base=profileMap.get(u.profile)||{m:2,c:2,a:4,pts:1,traits:[]};units.push({id:u.id,name:u.name,profile:u.profile,faction,commandId:c.id,forceRole:u.forceRole||c.forceRole||null,x:p.x,y:p.y,facing:Number(p0.facing??(faction==='French'?0:180)),move:base.m,combat:base.c,armor:base.a,points:base.pts,baseMm:Number(base.asset?base.baseMm:(tabletop.unitBaseMm||50)),traits:[...new Set([...(base.traits||[]),...(u.traits||[]), ...(rules.capabilities.italianWarsTraits&&(u.profile==='Spanish Tercio'||(base.traits||[]).includes('Tercio'))?['Arquebus','Fury','Elite','Pikes']:[]), ...(rules.capabilities.campBaggageAssets&&['Camp','Baggage Train'].includes(u.profile)?['Immobile','Army Asset',u.profile]:[])])],damage:0,destroyed:false,inactive:false});}}}
  const text=acceptedText(s),surprise=text.includes('surprise')||text.includes('unalerted')||text.includes('readiness'),sortie=text.includes('sortie')||text.includes('garrison');const garrisonTurn=Number(settings.garrisonTurn||2);if(sortie)for(const u of units)if(u.forceRole==='garrison'||u.faction==='Garrison')u.inactive=true;const unalerted=new Set();if(surprise){for(const u of units.filter(x=>x.faction==='French')){const near=units.some(e=>e.faction==='Imperial'&&!e.destroyed&&dist(u,e)<=18);if(!near)unalerted.add(u.id);}}
  return{units,commanders,terrain:featureTerrain(state),rules,scale,width:Number(state.project.playSpace?.width||48),height:Number(state.project.playSpace?.height||48),surprise,sortie,garrisonTurn,unalerted};}

export function runPlaytest(state,settings={}){const seed=settings.seed??1,maxTurns=Number(settings.turns||state.project.scenario.metadata?.gameLength||6||6),runtime=buildRuntimeFromStudio(state,settings),rng=makeRng(seed),events=[],snapshots=[],heat={movement:[],combat:[],casualty:[],commander:[],congestion:[]},maxEvents=Math.max(500,Number(settings.maxEvents||12000));let eventNo=0;const ctx={...runtime,rng,event(type,actor,payload={}){if(eventNo>=maxEvents){const err=new Error(`Simulation safety guard: exceeded ${maxEvents} events at turn ${ctx.turn||0}, side ${ctx.side||'unknown'}, actor ${actor?.name||actor?.id||'none'}.`);err.code='BAX_SIMULATION_GUARD';err.diagnostic={turn:ctx.turn||0,side:ctx.side||'',actor:actor?.id||null,actorName:actor?.name||'',eventCount:eventNo,maxEvents};throw err;}const ev={i:++eventNo,turn:ctx.turn||0,side:ctx.side||'',type,actor:actor?.id||null,actorName:actor?.name||actor?.id||'',x:actor?.x??null,y:actor?.y??null,payload};events.push(ev);if(type==='move')heat.movement.push({x:actor.x,y:actor.y});if(['attack','artillery','engagement'].includes(type))heat.combat.push({x:actor.x,y:actor.y});if(['unit_destroyed','army_asset_destroyed','commander_destroyed'].includes(type))heat.casualty.push({x:actor.x,y:actor.y});snapshots.push(makeSnapshot(ctx,ev));}};snapshots.push(makeSnapshot(ctx,{i:0,turn:0,type:'setup',actor:null,payload:{}}));let turn=1,win=null;const order=['Imperial','French'];while(turn<=maxTurns&&!win){ctx.turn=turn;if(runtime.sortie&&turn>=runtime.garrisonTurn)for(const u of ctx.units.filter(x=>(x.forceRole==='garrison'||x.faction==='Garrison')&&x.inactive)){u.inactive=false;ctx.event('reinforcement_activated',u,{turn});}for(const c of ctx.commanders)if(!c.destroyed)heat.commander.push({x:c.x,y:c.y});for(const u of ctx.units)if(!u.destroyed&&!u.inactive)heat.congestion.push({x:u.x,y:u.y});for(const side of order){ctx.side=side;for(const u of ctx.units.filter(x=>x.faction===side&&!x.destroyed&&!x.inactive))u.skirmishedThisTurn=false;for(const u of ctx.units.filter(x=>x.faction===side&&!x.destroyed&&!x.inactive))activate(u,ctx,runtime.unalerted);moveCommandersForSide(side,ctx);resolveCloseCombat(side,ctx);win=winner(ctx.units,ctx.commanders,turn,maxTurns);if(win)break;}turn++;}
  if(!win)win=winner(ctx.units,ctx.commanders,turn,maxTurns)||'Draw';const result={seed,winner:win,turnsCompleted:Math.min(turn-1,maxTurns),victoryPoints:{French:vpFor('French',ctx.units,ctx.commanders),Imperial:vpFor('Imperial',ctx.units,ctx.commanders)},survivors:{French:ctx.units.filter(u=>u.faction==='French'&&!u.destroyed).length,Imperial:ctx.units.filter(u=>u.faction!=='French'&&!u.destroyed).length},events,snapshots,heat,finalUnits:ctx.units,finalCommanders:ctx.commanders};return result;}

export function runBatch(state,settings={}){const runs=clamp(Number(settings.runs||20),1,250),base=Number(settings.seed||1),results=[];for(let i=0;i<runs;i++)results.push(runPlaytest(state,{...settings,seed:base+i}));const wins={French:0,Imperial:0,Draw:0};for(const r of results)wins[r.winner]=(wins[r.winner]||0)+1;const avg=k=>results.reduce((a,r)=>a+r[k],0)/runs;const avgVp={French:results.reduce((a,r)=>a+r.victoryPoints.French,0)/runs,Imperial:results.reduce((a,r)=>a+r.victoryPoints.Imperial,0)/runs};return{runs,wins,winPct:Object.fromEntries(Object.entries(wins).map(([k,v])=>[k,v/runs*100])),avgTurns:avg('turnsCompleted'),avgVp,results};}

export function toPctSnapshot(snapshot,state){return{...snapshot,units:snapshot.units.map(u=>({...u,...tableToPct(u,state)})),commanders:snapshot.commanders.map(c=>({...c,...tableToPct(c,state)}))};}

export const __conformance={defenseState,defensiveRelation,canShoot,canCharge,canChargeCommander,legalActionsForUnit,chooseTacticalAction,applyDangerTestForPath,nearestVisibleEnemyActor};
