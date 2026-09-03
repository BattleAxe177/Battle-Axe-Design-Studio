import { cp, mkdir, rm, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectReleaseVersion, normalizeReleaseVersion } from './release-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const version=normalizeReleaseVersion(await readFile(path.join(root,'VERSION'),'utf8'));

function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function storedZip(files){const local=[],central=[];let offset=0;for(const file of files){const name=Buffer.from(file.name.replaceAll('\\','/')),data=Buffer.from(file.data),crc=crc32(data),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0,6);header.writeUInt16LE(0,8);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);local.push(header,name,data);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=header.length+name.length+data.length;}const centralData=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(centralData.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,centralData,end]);}

await rm(dist, {recursive:true, force:true});
await mkdir(dist, {recursive:true});
await copyFile(path.join(root,'index.html'), path.join(dist,'index.html'));
await cp(path.join(root,'src'), path.join(dist,'src'), {recursive:true});
await cp(path.join(root,'public'), dist, {recursive:true});
await cp(path.join(root,'scenarios'), path.join(dist,'scenarios'), {recursive:true});
const authoringNames=['BATTLE_AXE_SCENARIO_AUTHORING_GUIDE.md','SCENARIO_PROPOSAL_SCHEMA.json','SCENARIO_PROPOSAL_TEMPLATE.json','STARTING_PROMPT.md','SCENARIO_DESIGN_RESPONSE_CONTRACT.md','TACTICAL_PLAYTEST_REFERENCE.md'];
const authoringFiles=await Promise.all(authoringNames.map(async name=>({name,data:await readFile(path.join(root,'docs','ai',name))})));
await writeFile(path.join(dist,'Battle_Axe_AI_Authoring_Pack.zip'),storedZip(authoringFiles));
await writeFile(path.join(dist,'.nojekyll'),'');

const indexPath=path.join(dist,'index.html');
const sourceHtml=await readFile(indexPath,'utf8');
const html=injectReleaseVersion(sourceHtml,version);
await writeFile(indexPath,html,'utf8');

if (!html.includes('Battle Axe Design Studio')) throw new Error('Build validation failed: title missing');
if (!html.includes(`id="runtimeVersion">v${version}</span>`)) throw new Error(`Build validation failed: runtime version ${version} not injected`);
if (!html.includes(`./src/main.js?v=${version}`)) throw new Error(`Build validation failed: main-module cache key ${version} not injected`);
console.log(`Built static GitHub Pages site in dist/ for Battle Axe v${version}.`);
