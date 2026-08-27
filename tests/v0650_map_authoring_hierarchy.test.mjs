import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeScenarioText } from '../src/modules/scenarioAnalyzer.js';
import { getEffectiveRuleset } from '../src/rules/ruleset.js';
import { classifyTerrainDescription, transformPointForDrawingMl } from '../src/modules/structuredMapCompiler.js';
import { RULES, normalizedEffects, machineGeneratedName } from '../src/modules/featureReview.js';
import { isRoadFeature } from '../src/modules/roadMovement.js';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const fixture=fs.readFileSync(path.join(HERE,'fixtures','Glendale_ACW_Intake_v0.6.4.0.md'),'utf8');
const acwRuleset=getEffectiveRuleset({ruleset:{core:'battle-axe-core',supplement:'american-civil-war',supplementVersion:'0.1'}});

test('DrawingML rotation is applied around the PowerPoint shape center',()=>{
  const p=transformPointForDrawingMl({x:10,y:10},{off:{x:0,y:0},ext:{w:10,h:20},rotation:90});
  assert.ok(Math.abs(p.x-5)<1e-9,`x=${p.x}`);
  assert.ok(Math.abs(p.y-15)<1e-9,`y=${p.y}`);
  const flipped=transformPointForDrawingMl({x:10,y:10},{off:{x:0,y:0},ext:{w:10,h:20},flipH:true});
  assert.ok(Math.abs(flipped.x-0)<1e-9);
  assert.ok(Math.abs(flipped.y-10)<1e-9);
});

test('semantic terrain classification preserves no-game-impact overrides and gives Road its engine role',()=>{
  const creek=classifyTerrainDescription('Creeks - no game impact');
  assert.equal(creek.cls,'Stream');
  assert.deepEqual(creek.effects,[]);
  const road=classifyTerrainDescription('Road - Long Bridge Rd.');
  assert.equal(road.cls,'Road');
  assert.ok(road.effects.includes('Road'));
  assert.match(RULES.Road,/no movement bonus/i);
  assert.match(RULES.Road,/movement only/i);
});

test('Road role is class-managed in Terrain Review and generic Track stays separate',()=>{
  assert.deepEqual(normalizedEffects('Road',['Defensive']).sort(),['Defensive','Road'].sort());
  assert.equal(normalizedEffects('Track',['Road','Difficult']).includes('Road'),false);
  assert.equal(isRoadFeature({cls:'Road',effects:['Road']}),true);
  assert.equal(isRoadFeature({cls:'Track',name:'Farm Track'}),false);
  assert.equal(isRoadFeature({name:'Willis Church Road'}),true);
});

test('promoted machine names are identifiable for canonical class renaming without clobbering meaningful names',()=>{
  assert.equal(machineGeneratedName('Unclassified Shape 37'),true);
  assert.equal(machineGeneratedName('Source Geometry 12'),true);
  assert.equal(machineGeneratedName('Whitlock Rail Fence'),false);
});

test('ACW command tree keeps explicit hierarchy, supporting commands, and unresolved Confederate brigades',()=>{
  const a=analyzeScenarioText(fixture,{sourceName:'Glendale hierarchy fixture',ruleset:acwRuleset});
  assert.equal(a.sourceCommands.some(c=>/^Supporting Union Commands$/i.test(c.name)),false,'organizational section label must not become a command');
  const first=a.sourceCommands.find(c=>c.name==='First Brigade');
  const second=a.sourceCommands.find(c=>c.name==='Second Brigade');
  const third=a.sourceCommands.find(c=>c.name==='Third Brigade');
  assert.equal(first?.parentCommandName,'McCall’s Division — Pennsylvania Reserves');
  assert.equal(second?.formations.length,4);
  assert.equal(third?.formations.length,4);
  for(const name of ["Robinson’s Brigade","Grover’s Brigade","Burns’s Brigade","Dana’s Brigade","Sully’s Brigade"]){
    const c=a.sourceCommands.find(x=>x.name===name);assert.ok(c,`missing ${name}`);assert.equal(c.formations.length,0);
  }
  const conf=a.sourceCommands.filter(c=>['Longstreet’s Command','A. P. Hill’s Division'].includes(c.parentCommandName));
  assert.ok(conf.length>=12,'expected Longstreet and Hill subordinate brigade nodes');
  assert.ok(conf.every(c=>c.formations.length===0),'incomplete Confederate brigades must remain unresolved, not fabricated');
});

test('supplement change handler explicitly re-analyzes source evidence instead of leaving stale period parsing',()=>{
  const src=fs.readFileSync(path.join(ROOT,'src/modules/scenarioBuilder.js'),'utf8');
  const i=src.indexOf("$('#scenarioSupplementSelector')?.addEventListener('change'");
  assert.ok(i>=0);
  const block=src.slice(i,src.indexOf("$('#tabletopPreset')",i));
  assert.match(block,/Re-analysis after supplement change/);
  assert.match(block,/sourceForces=\[\]/);
  assert.match(block,/sourceCommands=\[\]/);
  assert.match(block,/analyzeScenarioText\(sourceText/);
});

test('compiler and review source contain group metadata inheritance, visual fallback, and canonical regrouping safeguards',()=>{
  const compiler=fs.readFileSync(path.join(ROOT,'src/modules/structuredMapCompiler.js'),'utf8');
  const review=fs.readFileSync(path.join(ROOT,'src/modules/featureReview.js'),'utf8');
  const main=fs.readFileSync(path.join(ROOT,'src/main.js'),'utf8');
  const css=fs.readFileSync(path.join(ROOT,'src/styles/app.css'),'utf8');
  assert.match(compiler,/ancestorSources/);
  assert.match(compiler,/group metadata/);
  assert.match(compiler,/visual style inference/);
  assert.match(compiler,/#3B7D23/,'woodland visual fallback should be present');
  assert.match(review,/CATEGORY_FOR_CLASS/);
  assert.match(review,/Road corridor/);
  assert.match(review,/normalizeIdentity/);
  assert.match(main,/reconcileStructuredWithSvg/);
  assert.match(main,/svgValidation/);
  assert.match(main,/appearance reference registered \(not geometry-authoritative\)/);
  assert.match(css,/\.feature-list>\.panel-heading\{position:sticky;top:0/);
  assert.match(css,/\.feature-list>\.bulk-bar\{position:sticky;top:52px/);
});
