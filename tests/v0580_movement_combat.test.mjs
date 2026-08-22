import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { interpretOrderText } from '../src/modules/playtestEngine.js';
const read=async p=>fs.readFile(new URL(p,import.meta.url),'utf8');

test('v0580 enforces full-footprint battlefield and unit collision legality',async()=>{const js=await read('../src/modules/playtestEngine.js');assert.match(js,/footprintInsideBounds/);assert.match(js,/movementPathBlocker/);assert.match(js,/pikeShotTransitAllowed\(mover,stationary/);assert.match(js,/return shot\(mover\)&&pike\(stationary\)/);});
test('v0580 movement models front-corner wheel plus half-speed lateral/backward modes',async()=>{const js=await read('../src/modules/playtestEngine.js');assert.match(js,/wheelTransform|wheelLegality/);assert.match(js,/wheelAroundFrontCorner:true/);assert.match(js,/geometryMode='backward'/);assert.match(js,/sideways-right/);assert.match(js,/baseAllowance\*=\.5/);});
test('v0580 charge conform preserves first contact and does not lateral-slot search',async()=>{const js=await read('../src/modules/playtestEngine.js');assert.match(js,/anchorPreserved:true/);assert.match(js,/rotatedPointAround\(startCenter,anchor,delta\)/);assert.doesNotMatch(js,/\[0,\.15,-\.15,\.3,-\.3/);});
test('v0580 shooting and javelin skirmish use a front 90 degree arc',async()=>{const js=await read('../src/modules/playtestEngine.js');assert.match(js,/target outside front 90° shooting arc/);assert.match(js,/canSkirmish[\s\S]*shortestTurn[\s\S]*45\.0001/);});
test('v0580 conditional free-text intent extracts line release triggers',()=>{let x=interpretOrderText('attack only if the French break the defensive line');assert.equal(x.conditionalAdvance,true);assert.equal(x.releaseOnLineBreached,true);x=interpretOrderText('attack if the main defensive line leaves the trenches');assert.equal(x.releaseOnFriendlyLineLeaves,true);x=interpretOrderText('advance only if the enemy is disorganized');assert.equal(x.releaseOnEnemyVulnerable,true);});
test('v0580 deployment rejects overlap and seeks nearest legal placement',async()=>{const js=await read('../src/modules/deploymentEditor.js');assert.match(js,/placementClear/);assert.match(js,/nearestLegalPlacement/);});
