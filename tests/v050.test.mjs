import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=async p=>readFile(new URL(p,root),'utf8');

test('v0.5 workflow uses six stabilized top-level stages',async()=>{const html=await read('index.html');for(const label of ['Project</button>','Battlefield</button>','Scenario</button>','Deployment</button>','Playtest</button>','Publish</button>'])assert.ok(html.includes(label));assert.ok(html.includes('Sources & context'));});
test('deployment restores direct pointer dragging and distinct command palette',async()=>{const js=await read('src/modules/deploymentEditor.js');assert.ok(js.includes("el.addEventListener('pointerdown'"));assert.ok(js.includes("dragPiece={kind,id"));assert.ok(js.includes("#164A7A"));assert.ok(js.includes("#2376BD"));});
test('playtest renders facing vector and unit rotation',async()=>{const js=await read('src/modules/playtestCenter.js');assert.ok(js.includes('class="facing-arrow"'));assert.ok(js.includes('rotate(${Number(u.facing||0)}deg)'));});
test('force builder consults effective ruleset for camp limits',async()=>{const builder=await read('src/modules/scenarioBuilder.js'),rules=await read('src/rules/ruleset.js');assert.ok(builder.includes('effectiveArmyAssetPolicy(scenario(),faction)'));assert.ok(builder.includes('policy.campMax'));assert.ok(rules.includes('twoCampRule'));});
test('publisher labels may extend outside true unit footprint',async()=>{const js=await read('src/modules/scenarioPublisher.js');assert.ok(js.includes('.dep-piece>span'));assert.ok(js.includes('overflow:visible'));});
test('replay stage shares one square transform',async()=>{const css=await read('src/styles/app.css');assert.ok(css.includes('One authoritative square replay stage'));assert.ok(css.includes('.play-replay-stage .play-replay-pieces,.play-replay-stage #playHeatCanvas'));});
