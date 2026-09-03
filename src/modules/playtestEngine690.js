import { applyPlaytestEngine690Patch } from './playtestEngine690Patch.js?v=0.6.9.1';

const baseUrl=new URL('./playtestEngine.js?v=0.6.9.1',import.meta.url);
const response=await fetch(baseUrl,{cache:'no-store'});
if(!response.ok)throw new Error(`Battle Axe v0.6.9.1 could not load the v0.6.8.1 playtest engine baseline (HTTP ${response.status}).`);
const patchedSource=applyPlaytestEngine690Patch(await response.text(),{baseUrl});
const moduleUrl=URL.createObjectURL(new Blob([`${patchedSource}\n//# sourceURL=battle-axe-playtest-engine-v0.6.9.1.js\n`],{type:'text/javascript'}));
let engine;
try{engine=await import(moduleUrl);}finally{setTimeout(()=>URL.revokeObjectURL(moduleUrl),15000);}

export const resolveRoadMovementTerrain=engine.resolveRoadMovementTerrain;
export const interpretOrderText=engine.interpretOrderText;
export const buildAutoTacticalPlan=engine.buildAutoTacticalPlan;
export const scenarioConfigFingerprint=engine.scenarioConfigFingerprint;
export const initialDeploymentIssues=engine.initialDeploymentIssues;
export const buildRuntimeFromStudio=engine.buildRuntimeFromStudio;
export const runPlaytest=engine.runPlaytest;
export const runBatch=engine.runBatch;
export const toPctSnapshot=engine.toPctSnapshot;
export const __conformance=engine.__conformance;
export const __engine690={patched:true,version:'0.6.9.1',baseline:'0.6.8.1'};
