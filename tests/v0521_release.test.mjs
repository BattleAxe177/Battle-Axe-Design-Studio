import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');

test('deployment and replay visual footprint derive from base mm and battlefield dimensions',async()=>{
  const d=await read('src/modules/deploymentEditor.js'),p=await read('src/modules/playtestCenter.js');
  assert.match(d,/pctFromMm/);assert.match(d,/unitBaseMm/);assert.match(p,/pctFromMm/);assert.match(p,/commanderBaseMm/);
});
test('battlefield subnavigation remains available and has explicit back controls',async()=>{
  const h=await read('index.html'),n=await read('src/modules/navigation.js');
  assert.match(h,/battlefieldSubnav/);assert.match(h,/Back to Battlefield/);assert.match(n,/setupBattlefieldSubnav/);assert.match(n,/show\('intake'\)/);
});
test('Pavia is exposed only as an explicit sample project',async()=>{
  const h=await read('index.html'),m=await read('projects/samples/pavia/sample-project.json');
  assert.match(h,/Load Pavia Test Scenario/);assert.match(m,/Development\/regression sample only/);
  assert.doesNotMatch(h,/Open Pavia project/);assert.doesNotMatch(h,/Pavia uses 48/);assert.doesNotMatch(h,/Pavia battlefield/);
});
test('generic runtime modules do not contain named Pavia logic',async()=>{
  const files=['src/modules/playtestEngine.js','src/modules/deploymentEditor.js','src/modules/scenarioPublisher.js','src/modules/aiBridge.js','src/modules/scenarioAnalyzer.js'];
  const banned=[/Mirabello/i,/Pescara/i,/Francis I/i,/Porta Pesc/i,/Antonio de Leyva/i,/Pavia Garrison/i];
  for(const f of files){const t=await read(f);for(const b of banned)assert.doesNotMatch(t,b,`${f} contains ${b}`);}
});
test('generic initial state is not derived from Pavia project',async()=>{
  const s=await read('src/app/state.js');assert.doesNotMatch(s,/paviaProject/);assert.match(s,/name:'Untitled Scenario'/);
});
test('generic startup loads map from project mapSource rather than a Pavia path',async()=>{
  const m=await read('src/main.js');assert.match(m,/state\.project\.mapSource/);assert.doesNotMatch(m,/\.\/projects\/pavia\/battlefield\.svg/);
});
