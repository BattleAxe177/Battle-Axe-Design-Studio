import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const main=read('src/main.js'),compiler=read('src/modules/structuredMapCompiler.js'),deploy=read('src/modules/deploymentEditor.js'),feature=read('src/modules/featureReview.js'),html=read('index.html'),css=read('src/styles/app.css'),play=read('src/modules/playtestCenter.js');

test('PPTX battlefield boundary is registered into SVG and preferred',()=>{assert.match(compiler,/registerPptxBoundaryToSvg/);assert.match(main,/registeredBoundary=registerPptxBoundaryToSvg/);assert.match(main,/boundary=registeredBoundary\|\|detected\.boundary/);});
test('map notes and historical description feed terrain context',()=>{assert.match(compiler,/contextTerrainEvidence/);assert.match(main,/historicalContext:state\.project\.historicalContext/);assert.match(main,/mapNotes:state\.project\.mapNotes/);});
test('force builder hides the redundant imported-force column and widens working area',()=>{assert.doesNotMatch(html,/Imported \/ historical forces/);assert.match(css,/force-workbench\{grid-template-columns:minmax\(0,1fr\) minmax\(260px,320px\)/);});
test('battlefield review hides detector metrics behind technical details',()=>{assert.match(feature,/Technical details/);assert.match(feature,/confidenceLabel/);});
test('deployment drag preserves grab offset',()=>{assert.match(deploy,/offsetX:cursor\.x-p\.x/);assert.match(deploy,/cursor\.x-dragPiece\.offsetX/);});
test('normal playtest language does not expose config hashes',()=>{assert.match(play,/Playtest is synchronized with the current scenario/);assert.doesNotMatch(play,/Current scenario \$\{currentHash\(\)\} differs/);});
test('top actions use high-contrast component classes',()=>{assert.match(html,/top-action-new/);assert.match(html,/top-action-open/);assert.match(html,/top-action-help/);});
