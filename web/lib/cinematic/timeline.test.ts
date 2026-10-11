import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smooth, progressFromRect, chapterAnchor, chapterAt, chapterOpacity, filmProgress, framePosition, fmtOpacity } from './timeline.ts';
import { parseManifest, frameUrl, pickVariant } from './manifest.ts';
const beats=[0,.3,.55,.76];
test('timeline boundaries and finite zero-height guard',() => { assert.equal(smooth(-1),0); assert.equal(smooth(2),1); assert.equal(filmProgress(.12),0); assert.equal(filmProgress(.87),1); assert.ok(Number.isFinite(progressFromRect(-10,900,900))); });
test('each chapter anchor selects exactly one fully visible chapter',() => { beats.forEach((_,i) => { const p=chapterAnchor(i,beats); assert.equal(chapterAt(filmProgress(p),beats).active,i); assert.equal(chapterOpacity(i,p,beats),1); beats.forEach((_,j) => { if (i !== j) assert.equal(chapterOpacity(j,p,beats),0); }); }); });
test('frame mapping clamps end and generalises lens across scenes',() => { assert.deepEqual(framePosition(1,[210]),{ scene:0,local:1,index:209,transition:0 }); const p=framePosition(.27,[90,80,70,60]); assert.equal(p.scene,1); assert.ok(p.transition > 0 && p.transition < 1); });
test('formatters quantise before writer comparison',() => assert.equal(fmtOpacity(.12341),fmtOpacity(.12339)));
test('manifest validates and chooses actual hash-versioned URLs',() => {
  const m=parseManifest({ version:'abcdef012345',mode:'continuous',beats,variants:['desktop','mobile'],scenes:[{ frames:210,origin:'video' }] });
  assert.equal(frameUrl(m,'mobile',0,4),'/cinematic/mobile/abcdef012345/0/004.webp'); assert.equal(pickVariant(390,2,false,m.variants),'mobile'); assert.equal(pickVariant(1440,1,false,m.variants),'desktop'); assert.equal(pickVariant(1440,2,true,m.variants),'mobile');
  assert.throws(() => parseManifest({ ...m,beats:[0,.4,.3,.7] })); assert.throws(() => parseManifest({ ...m,version:'../escape' }));
});
