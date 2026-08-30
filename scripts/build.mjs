import { cp, mkdir, rm, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectReleaseVersion, normalizeReleaseVersion } from './release-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const version=normalizeReleaseVersion(await readFile(path.join(root,'VERSION'),'utf8'));

await rm(dist, {recursive:true, force:true});
await mkdir(dist, {recursive:true});
await copyFile(path.join(root,'index.html'), path.join(dist,'index.html'));
await cp(path.join(root,'src'), path.join(dist,'src'), {recursive:true});
await cp(path.join(root,'public'), dist, {recursive:true});
await cp(path.join(root,'scenarios'), path.join(dist,'scenarios'), {recursive:true});
await writeFile(path.join(dist,'.nojekyll'),'');

const indexPath=path.join(dist,'index.html');
const sourceHtml=await readFile(indexPath,'utf8');
const html=injectReleaseVersion(sourceHtml,version);
await writeFile(indexPath,html,'utf8');

if (!html.includes('Battle Axe Design Studio')) throw new Error('Build validation failed: title missing');
if (!html.includes(`id="runtimeVersion">v${version}</span>`)) throw new Error(`Build validation failed: runtime version ${version} not injected`);
if (!html.includes(`./src/main.js?v=${version}`)) throw new Error(`Build validation failed: main-module cache key ${version} not injected`);
console.log(`Built static GitHub Pages site in dist/ for Battle Axe v${version}.`);
