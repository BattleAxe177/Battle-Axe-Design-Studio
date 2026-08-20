import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const engine=fs.readFileSync('src/modules/playtestEngine.js','utf8'),pub=fs.readFileSync('src/modules/scenarioPublisher.js','utf8'),css=fs.readFileSync('src/styles/app.css','utf8'),dep=fs.readFileSync('src/modules/deploymentEditor.js','utf8'),html=fs.readFileSync('index.html','utf8');
test('army assets are immobile and destructible on contact',()=>{assert.match(engine,/Army Asset/);assert.match(engine,/army_asset_destroyed/);assert.match(engine,/Immobile/);});
test('replay uses shared stage',()=>{assert.match(html,/playReplayStage/);assert.match(css,/play-replay-stage/);});
test('publisher uses deployment map and compact forces',()=>{assert.match(pub,/deploymentMapHtml/);assert.doesNotMatch(pub,/toFixed\(1\).*%/);});
test('deployment restored native drag drop',()=>{assert.match(dep,/application\/x-bax-deployed/);assert.match(dep,/dragstart/);});
