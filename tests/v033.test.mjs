import test from 'node:test'; import assert from 'node:assert/strict'; import {readFile} from 'node:fs/promises';
test('v0.3.3 uses geometry-first detector', async()=>{const s=await readFile(new URL('../src/modules/battlefieldDetector.js',import.meta.url),'utf8');assert.match(s,/Detected directly from long cyan source-map geometry/);assert.match(s,/historical battlefield text is not used for detection/);});
test('map review uses sticky battlefield panel',async()=>{const s=await readFile(new URL('../src/styles/app.css',import.meta.url),'utf8');assert.match(s,/\.map-panel\{position:sticky/);});
