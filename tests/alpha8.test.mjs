import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const root=new URL('../',import.meta.url);
const read=async p=>fs.readFile(new URL(p,root),'utf8');

test('alpha.8 UI exposes manual scenario rules, playtest reset, log modes, and publisher', async()=>{
  const html=await read('index.html');
  assert.match(html,/id="addScenarioRule"/);
  assert.match(html,/id="resetPlaytest"/);
  assert.match(html,/id="playLogMode"/);
  assert.match(html,/id="publisherPreview"/);
  assert.match(html,/id="exportPublisherPdf"/);
});

test('AI bridge exports mandatory Studio protocol and canonical vocabulary', async()=>{
  const js=await read('src/modules/aiBridge.js');
  assert.match(js,/REQUIRED STUDIO RETURN PROTOCOL/);
  assert.match(js,/STUDIO OBJECT MODEL/);
  assert.match(js,/CANONICAL BATTLE AXE UNIT PROFILES/);
  assert.match(js,/parseLegacy/);
});

test('playtest engine records Defensive terrain armor and defender-first behavior', async()=>{
  const js=await read('src/modules/playtestEngine.js');
  assert.match(js,/effectiveArmor:defensive\?6/);
  assert.match(js,/defenderAttacksFirst/);
  assert.match(js,/tDef\.defensive&&!uDef\.defensive/);
});

test('scenario configuration fingerprint exists for stale-playtest detection', async()=>{
  const mod=await import(pathToFileURL(new URL('src/modules/playtestEngine.js',root).pathname).href+'?a8');
  assert.equal(typeof mod.scenarioConfigFingerprint,'function');
});
