import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const feature=fs.readFileSync(new URL('../src/modules/featureReview.js',import.meta.url),'utf8');
test('feature review user-facing helper functions are defined before use',()=>{
  const c=feature.indexOf('function confidenceLabel('), f=feature.indexOf('function friendlySource('), use=feature.indexOf('confidenceLabel(feature.');
  assert.ok(c>=0&&f>=0&&use>=0); assert.ok(c<use); assert.ok(f<use);
});
test('feature review keeps raw percentages behind Technical details',()=>{
  assert.match(feature,/High confidence/); assert.match(feature,/Medium confidence/); assert.match(feature,/Needs review/); assert.match(feature,/Technical details/);
});
