import { readFile, access } from 'node:fs/promises';
const files=['dist/index.html','dist/src/main.js','dist/src/modules/battlefieldDetector.js','dist/projects/pavia/battlefield.svg','dist/.nojekyll'];
for(const f of files) await access(new URL(`../${f}`,import.meta.url));
const detector=await readFile(new URL('../dist/src/modules/battlefieldDetector.js',import.meta.url),'utf8');
for(const token of ['#69D9E5','#F2AA84','syntheticOpening','image,use','historical battlefield text is not used for detection']) if(!detector.includes(token)) throw new Error(`Detector check failed: missing ${token}`);
const css=await readFile(new URL('../dist/src/styles/app.css',import.meta.url),'utf8');
if(!css.includes('.map-panel{position:sticky')) throw new Error('Sticky map check failed');
console.log('Static deployment check passed.');
