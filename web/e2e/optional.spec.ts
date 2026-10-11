import { test, expect } from '@playwright/test';
function wav() {
  const size=8000,buf=Buffer.alloc(44+size); buf.write('RIFF'); buf.writeUInt32LE(36+size,4); buf.write('WAVEfmt ',8); buf.writeUInt32LE(16,16); buf.writeUInt16LE(1,20); buf.writeUInt16LE(1,22); buf.writeUInt32LE(8000,24); buf.writeUInt32LE(8000,28); buf.writeUInt16LE(1,32); buf.writeUInt16LE(8,34); buf.write('data',36); buf.writeUInt32LE(size,40); buf.fill(128,44); return buf;
}
test('optional ambient audio toggles and stores preference',async({ page }) => {
  await page.route('**/asset-flags.json',r => r.fulfill({ json:{ ambientAudio:true,mascotGlb:false } })); await page.route('**/audio/ambient.mp3',r => r.fulfill({ contentType:'audio/wav',body:wav() }));
  await page.goto('/'); const sound=page.getByRole('button',{ name:'Ambient sound' }); await expect(sound).toHaveAttribute('aria-pressed','false'); await sound.click(); await expect(sound).toHaveAttribute('aria-pressed','true'); expect(await page.evaluate(() => localStorage.getItem('cropbill:ambient'))).toBe('on'); await sound.click(); await expect(sound).toHaveAttribute('aria-pressed','false'); expect(await page.evaluate(() => localStorage.getItem('cropbill:ambient'))).toBe('off');
});
test('flagged but unavailable sound fails gracefully',async({ page }) => {
  const errors: string[]=[]; page.on('pageerror',e => errors.push(e.message)); await page.route('**/asset-flags.json',r => r.fulfill({ json:{ ambientAudio:true,mascotGlb:false } })); await page.route('**/audio/ambient.mp3',r => r.fulfill({ status:404 })); await page.goto('/'); await page.getByRole('button',{ name:'Ambient sound' }).click(); await expect(page.getByRole('button',{ name:'Sound unavailable' })).toHaveAttribute('aria-disabled','true'); expect(errors).toEqual([]);
});
function glb() {
  const json={ asset:{ version:'2.0' },scene:0,scenes:[{ nodes:[0] }],nodes:[{ mesh:0 }],meshes:[{ primitives:[{ attributes:{ POSITION:0 } }] }],buffers:[{ byteLength:36 }],bufferViews:[{ buffer:0,byteOffset:0,byteLength:36,target:34962 }],accessors:[{ bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-.5,0,0],max:[.5,1,0] }] };
  const raw=Buffer.from(JSON.stringify(json)),size=Math.ceil(raw.length/4)*4,buf=Buffer.alloc(20+size+8+36); buf.write('glTF'); buf.writeUInt32LE(2,4); buf.writeUInt32LE(buf.length,8); buf.writeUInt32LE(size,12); buf.write('JSON',16); buf.fill(32,20,20+size); raw.copy(buf,20); buf.writeUInt32LE(36,20+size); buf.write('BIN\0',24+size); [-.5,0,0,.5,0,0,0,1,0].forEach((n,i) => buf.writeFloatLE(n,28+size+i*4)); return buf;
}
for (const valid of [true,false]) test(`optional GLB ${valid ? 'valid' : 'missing'} uses scene without application errors`,async({ page },info) => {
  test.skip(info.project.name !== 'desktop'); const errors: string[]=[]; page.on('pageerror',e => errors.push(e.message)); page.on('console',m => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });
  await page.route('**/asset-flags.json',r => r.fulfill({ json:{ mascotGlb:true,ambientAudio:false } })); await page.route('**/models/mascot.glb',r => r.fulfill(valid ? { contentType:'model/gltf-binary',body:glb() } : { status:404 })); await page.goto('/'); await page.locator('#finale').scrollIntoViewIfNeeded(); await expect(page.locator('#finale')).toHaveAttribute('data-finale-loaded',''); await page.waitForTimeout(3000); await expect(page.locator('#finale canvas').or(page.getByTestId('mascot-poster'))).toBeVisible(); expect(errors).toEqual([]);
});
test('skip link focuses main on both pages; visible text is at least 12px',async({ page }) => {
  for (const path of ['/','/privacy']) { await page.goto(path); await page.keyboard.press('Tab'); await expect(page.getByRole('link',{ name:'Skip to content' })).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('main#main')).toBeFocused(); }
  await page.goto('/'); for (const target of ['#story','#demo','#waitlist']) { await page.locator(target).scrollIntoViewIfNeeded(); const small=await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => { const r=el.getBoundingClientRect(),s=getComputedStyle(el); return r.width>1 && r.height>1 && r.bottom>0 && r.top<innerHeight && s.visibility!=='hidden' && s.display!=='none' && s.opacity!=='0' && !el.classList.contains('sr-only') && [...el.childNodes].some(n => n.nodeType===Node.TEXT_NODE && n.textContent?.trim()) && parseFloat(s.fontSize)<12; }).map(el => el.tagName+':'+el.textContent?.slice(0,40))); expect(small).toEqual([]); }
});
test('three scene code is not fetched until finale is near the viewport',async({ page },info) => {
  test.skip(info.project.name !== 'desktop'); const scripts: { url:string; body:string }[]=[],pending: Promise<void>[]=[];
  page.on('response',response => { if (response.request().resourceType() === 'script') pending.push(response.text().then(body => { scripts.push({ url:response.url(),body }); })); });
  await page.goto('/'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(2000); await Promise.all(pending); expect(scripts.some(s => s.body.includes('CROPBILL_THREE_SCENE'))).toBe(false);
  await page.locator('#finale').scrollIntoViewIfNeeded(); await expect(page.locator('#finale')).toHaveAttribute('data-finale-loaded',''); await expect.poll(() => scripts.some(s => s.body.includes('CROPBILL_THREE_SCENE'))).toBe(true);
});
