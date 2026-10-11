import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, summarize, validateContact, isLocalPreview, cardTransform, contrast } from './math.ts';
import { inspectGlb } from './glb.ts';
test('Indian currency and crop arithmetic',() => {
  assert.equal(formatINR(48200),'₹48,200');
  for (const [sales,costs,profit] of [[80800,[12000,9800,6500,4300],48200],[105000,[18500,14200,8200,6100],58000],[92000,[21000,12800,9400,5800],43000]] as [number,number[],number][]) assert.equal(summarize({ sales,costs }).profit,profit);
});
test('contact validation accepts email and only plausible 10–15 digit phones',() => {
  assert.deepEqual(validateContact(' farmer@example.com '),{ ok:true,kind:'email' });
  assert.deepEqual(validateContact('+91 (98765) 43210'),{ ok:true,kind:'phone' });
  for (const value of ['', 'abc','1234','a1234567890','1234567890123456','a@b']) assert.equal(validateContact(value).ok,false);
});
test('local preview refusal covers loopback and local domains',() => {
  for (const hostname of ['localhost','127.0.0.1','::1','[::1]','0.0.0.0','preview.localhost']) assert.equal(isLocalPreview({ protocol:'http:',hostname }),true);
  assert.equal(isLocalPreview({ protocol:'https:',hostname:'cropbillai.me' }),false);
  assert.equal(isLocalPreview({ protocol:'file:',hostname:'' }),true);
});
test('carousel centre is sharp and outer cards fade',() => { assert.equal(cardTransform(0,300).filter,'none'); assert.equal(cardTransform(0,300).opacity,'1.000'); assert.equal(cardTransform(5,300).opacity,'0'); });
test('text token contrast meets AA',() => {
  for (const [a,b] of [['#f3f1e7','#101c15'],['#e9cd86','#101c15'],['#20362a','#f3f1e7'],['#56634c','#f3f1e7'],['#3d4a2e','#eef1e6'],['#5a674b','#e8ebdc'],['#973524','#f3f1e7']]) assert.ok(contrast(a,b) >= 4.5,`${a} on ${b}`);
});
test('GLB preflight rejects malformed and compressed binary',() => {
  const build=(json: object) => { const raw=new TextEncoder().encode(JSON.stringify(json)),size=Math.ceil(raw.length/4)*4,buf=new ArrayBuffer(20+size),v=new DataView(buf); v.setUint32(0,0x46546c67,true); v.setUint32(4,2,true); v.setUint32(8,buf.byteLength,true); v.setUint32(12,size,true); v.setUint32(16,0x4e4f534a,true); new Uint8Array(buf,20).fill(32); new Uint8Array(buf,20,raw.length).set(raw); return buf; };
  assert.equal(inspectGlb(new ArrayBuffer(10)).reason,'not-glb'); assert.equal(inspectGlb(build({ asset:{ version:'2.0' } })).ok,true);
  for (const extension of ['KHR_draco_mesh_compression','EXT_meshopt_compression']) assert.equal(inspectGlb(build({ extensionsRequired:[extension] })).reason,'compressed');
  const bad=build({}); new Uint8Array(bad)[20]=0; assert.equal(inspectGlb(bad).reason,'bad-json');
});
