import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { classifyTerrainDescription, TERRAIN_ONTOLOGY } from '../src/modules/structuredMapCompiler.js';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');

test('terrain ontology interprets broad non-sample battlefield vocabulary',()=>{
  const cases={
    'bocage bank':'Hedge / Bocage',
    'sunken lane':'Sunken Road',
    'rice paddy':'Wet Ground',
    'wadi':'Watercourse',
    'redoubt':'Fortification',
    'terraced olive grove':'Orchard',
    'stone wall':'Wall',
    'ford':'Ford / Crossing',
    'ravine':'Ravine / Gully',
    'scattered trees':'Open Grove / Copse'
  };
  for(const [label,type] of Object.entries(cases))assert.equal(classifyTerrainDescription(label).sourceType,type,label);
  assert.ok(TERRAIN_ONTOLOGY.length>=25,'ontology should cover broad terrain families, not a short sample dictionary');
});

test('unfamiliar authored terminology survives as Unknown rather than being discarded',()=>{
  const x=classifyTerrainDescription('terraced volcanic rubble garden');
  assert.equal(x.matched,false);assert.equal(x.cls,'Unknown');assert.equal(x.source,'terraced volcanic rubble garden');
});

test('Cerignola terms work through ontology rather than exact-name sample dictionary',()=>{
  assert.equal(classifyTerrainDescription('Hill').cls,'Elevated Ground');
  assert.equal(classifyTerrainDescription('Build Up Area').cls,'Settlement');
  assert.equal(classifyTerrainDescription('Vineyards').cls,'Vineyard');
  assert.equal(classifyTerrainDescription('ditch/stream').cls,'Stream');
  assert.equal(classifyTerrainDescription('Fortifications').cls,'Fortification');
});

test('map generation makes PPTX authored geometry primary when available',async()=>{
  const main=await read('src/main.js'),compiler=await read('src/modules/structuredMapCompiler.js');
  assert.match(main,/compilePptxTerrain/);assert.match(main,/PowerPoint authored geometry will be primary/);
  assert.match(main,/hasStructured\?structuredFeatures/);assert.match(main,/geometrySource:hasStructured\?'pptx':'svg'/);
  assert.match(compiler,/PPTX authored geometry/);assert.match(compiler,/Unclassified source geometry/);
  assert.match(compiler,/custGeom/);assert.match(compiler,/cubicBezTo/);
});

test('SVG coordinate boxes are root-relative and do not change with viewBox clipping',async()=>{
  const detector=await read('src/modules/battlefieldDetector.js');
  assert.match(detector,/rootRelativeMatrix/);assert.match(detector,/rm\.inverse\(\)\.multiply\(m\)/);
  assert.match(detector,/remain stable if the battlefield viewBox is changed/);
});

test('visual detector no longer hard-codes Pavia gate and castle names',async()=>{
  const detector=await read('src/modules/battlefieldDetector.js');
  for(const name of ['Pescarina','Repentita','Riazzo','Due Porte','Mirabello'])assert.doesNotMatch(detector,new RegExp(name));
  assert.match(detector,/gate\/porta\/breach/);assert.match(detector,/map-labeled-opening/);
});

test('suggested forces are a compact read-only force sketch rather than a second card editor',async()=>{
  const builder=await read('src/modules/scenarioBuilder.js'),css=await read('src/styles/app.css'),html=await read('index.html');
  assert.match(builder,/force-sketch-command/);assert.match(builder,/force-sketch-profile/);assert.match(builder,/<ul>/);
  assert.doesNotMatch(builder,/data-create-plan-command/);
  assert.match(css,/\.force-plan\{display:grid/);assert.match(css,/\.force-sketch-commands/);
  assert.match(html,/compact command-tree sketch/i);
});
