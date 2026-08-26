import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeScenarioText } from '../src/modules/scenarioAnalyzer.js';
import { getEffectiveRuleset } from '../src/rules/ruleset.js';
import { movementEffectsWithRoadOverlap, movementBlockedByTerrain, movementDistanceMultiplier } from '../src/modules/roadMovement.js';
import { authoredBoundaryToSvg, visibleBorderRect } from '../src/modules/battlefieldCrop.js';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const fixture=fs.readFileSync(path.join(HERE,'fixtures','Glendale_ACW_Intake_v0.6.4.0.md'),'utf8');

function byName(a,name){return a.find(x=>x.name===name);}
const acwRuleset=getEffectiveRuleset({ruleset:{core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'0.1'}});
const analyze=()=>analyzeScenarioText(fixture,{sourceName:'Glendale fixture',ruleset:acwRuleset});

test('Glendale source-authored scenario rules are preserved as seven accepted SOURCE rules',()=>{
  const a=analyze();
  assert.deepEqual(a.sourceRules.map(x=>x.title),[
    'Confederate Initiative','Successive Assaults','Simmons’s Reserve','Sedgwick Reinforcements',
    'Whitlock Breastworks','Minor Watercourses','Farm Fields and Most Fences'
  ]);
  assert.ok(a.sourceRules.every(x=>x.status==='accepted'&&x.provenance==='SOURCE'));
});

test('ACW hierarchy parser preserves McCall regiments and five batteries without inventing incomplete rosters',()=>{
  const a=analyze();
  const mc=a.forces.filter(x=>/Pennsylvania Reserves|Battery/i.test(x.name));
  assert.equal(mc.filter(x=>x.profileHint==='Infantry').length,13);
  assert.equal(mc.filter(x=>x.profileHint==='Cannons').length,5);
  assert.equal(new Set(a.forces.map(x=>x.id)).size,a.forces.length,'source formation IDs must remain unique');
  assert.equal(byName(a.sourceCommands,'First Brigade')?.formations.length,5);
  assert.equal(byName(a.sourceCommands,'Second Brigade')?.formations.length,4);
  assert.equal(byName(a.sourceCommands,'Third Brigade')?.formations.length,4);
  assert.equal(byName(a.sourceCommands,'Artillery')?.formations.length,5);
  for(const n of ["Robinson’s Brigade","Grover’s Brigade","Burns’s Brigade","Dana’s Brigade","Sully’s Brigade"]){
    const c=byName(a.sourceCommands,n);assert.ok(c,`missing ${n}`);assert.equal(c.formations.length,0,`${n} must remain unresolved rather than fabricated`);
  }
});

test('James J. Archer is a commander surname, never an Archers unit profile',()=>{
  const a=analyze();
  const archer=a.sourceCommands.find(x=>/Archer/.test(x.commander||''));
  assert.ok(archer);assert.match(archer.name,/Brigade/);
  assert.equal(a.forces.some(x=>x.profileHint==='Archers'||/^Archers$/i.test(x.name)),false);
});

test('Longstreet and Hill subordinate brigades retain common parents and remain unresolved without regiments',()=>{
  const a=analyze();
  const longstreet=a.sourceCommands.filter(x=>x.parentCommandName==='Longstreet’s Command'&&/^(First|Second|Third|Fourth|Fifth|Sixth) Brigade$/.test(x.name));
  assert.equal(longstreet.length,6);assert.ok(longstreet.every(x=>x.parentCommandName==='Longstreet’s Command'&&x.formations.length===0));
  const hillNames=['Field','Pender','Gregg','Anderson','Archer','Branch'];
  for(const surname of hillNames){const c=a.sourceCommands.find(x=>(x.commander||'').includes(surname));assert.ok(c,`missing ${surname}`);assert.equal(c.parentCommandName,'A. P. Hill’s Division');assert.equal(c.formations.length,0);}
});

test('road overlap suppresses only movement penalties and never grants bonus distance',()=>{
  assert.equal(movementDistanceMultiplier(['Difficult'],false),0.5);
  assert.equal(movementDistanceMultiplier(['Difficult'],true),1);
  assert.equal(movementDistanceMultiplier([],true),1);
  assert.equal(movementBlockedByTerrain(['Impassable'],false),true);
  assert.equal(movementBlockedByTerrain(['Impassable'],true),false);
  assert.deepEqual(movementEffectsWithRoadOverlap(['Difficult','Obscuring','Defensive'],true),['Obscuring','Defensive']);
});

test('PowerPoint authored boundary is transformed from slide coordinates into SVG coordinates',()=>{
  const svg={viewBox:{baseVal:{x:0,y:0,width:1600,height:900}}};
  const structured={slideBounds:{x:0,y:0,width:13.333333,height:7.5},boundary:{x:4.1489,y:1.2571,width:5.008,height:5.014}};
  const r=authoredBoundaryToSvg(svg,structured);assert.ok(r);
  assert.ok(Math.abs(r.x-497.9)<2);assert.ok(Math.abs(r.y-150.9)<2);assert.ok(Math.abs(r.width-601)<2);assert.ok(Math.abs(r.height-601.7)<2);
});

test('crop helper accepts metadata aliases and can recover a black/no-fill SVG frame',()=>{
  const svg1={viewBox:{baseVal:{x:0,y:0,width:1000,height:500}}};
  const r=authoredBoundaryToSvg(svg1,{stats:{sourceBounds:{x:0,y:0,width:20,height:10},playArea:{x:5,y:2,width:10,height:6}}});
  assert.deepEqual(r,{x:250,y:100,width:500,height:300});
  const attrs={x:'200',y:'100',width:'600',height:'300',stroke:'#000000',fill:'none'};
  const el={getAttribute:k=>attrs[k]??null};
  const svg2={viewBox:{baseVal:{x:0,y:0,width:1000,height:500}},querySelectorAll:()=>[el]};
  assert.deepEqual(visibleBorderRect(svg2),{x:200,y:100,width:600,height:300});
});
