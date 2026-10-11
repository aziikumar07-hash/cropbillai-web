import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { chapterAnchor } from '../lib/cinematic/timeline.ts';
const beats=[0,.30,.55,.76];
async function progress(page: Page,p: number,id='story') {
  await page.evaluate(({ p,id }) => { const root=document.getElementById(id)!,stage=root.querySelector<HTMLElement>(id === 'story' ? '.stage' : '.carousel-stage')!; window.scrollTo({ top:root.getBoundingClientRect().top+scrollY+p*(root.offsetHeight-stage.offsetHeight),behavior:'instant' }); },{ p,id });
  if (id === 'story') { await expect.poll(async() => Math.abs(Number(await page.locator('#story').getAttribute('data-target'))-p)).toBeLessThan(.002); await expect(page.locator('#story')).toHaveAttribute('data-settled','true'); await expect.poll(async() => { const drawn=await page.locator('#story canvas').getAttribute('data-drawn'); if (!drawn?.startsWith('0:')) return false; return Math.abs(Number(drawn.slice(2))-Math.round(Math.max(0,Math.min(1,(p-.12)/.75))*209)) <= 1; }).toBe(true); }
  await page.waitForTimeout(250);
}
test('hero, smooth scroll cue, frame variants, chapters, portal, reverse canvas and accessibility',async({ page },info) => {
  const errors: string[]=[],frames: string[]=[]; page.on('pageerror',e => errors.push(e.message)); page.on('console',m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('request',r => { if (/cinematic.*webp/.test(r.url())) frames.push(r.url()); });
  await page.goto('/'); await expect(page.getByRole('heading',{ level:1,name:'Grow more. Guess less.' })).toBeVisible();
  await page.evaluate(() => { const w=window as Window & { scrollSamples?: number[] }; w.scrollSamples=[]; document.querySelector('.scroll-cue')!.addEventListener('pointerdown',() => { const start=performance.now(); w.scrollSamples!.push(scrollY); const sample=(t: number) => { w.scrollSamples!.push(scrollY); if(t-start<1500)requestAnimationFrame(sample); }; requestAnimationFrame(sample); },{ once:true }); });
  await page.getByRole('link',{ name:'Scroll to see what grows' }).click(); await expect(page.locator('#chapter-1')).toBeFocused(); await expect.poll(() => page.locator('#chapter-1').evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.9);
  await page.waitForTimeout(1600); const samples=await page.evaluate(() => ({ values:(window as Window & { scrollSamples: number[] }).scrollSamples,end:scrollY })); expect(samples.values.some(y => y>2 && y<samples.end-2),JSON.stringify(samples)).toBe(true);
  for (const [i,b] of beats.entries()) { await progress(page,chapterAnchor(i,beats)); await expect(page.locator('#story')).toHaveAttribute('data-chapter',String(i)); await expect.poll(() => page.locator(`#chapter-${i+1}`).evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.95); }
  for (const p of [.06,.13,.3,.6,.85,.3,.95]) {
    await progress(page,p);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (p === .06) expect(await page.locator('.film').evaluate(el => getComputedStyle(el).clipPath)).toMatch(/^circle\([1-9]/);
    if (p === .13 || p === .3) expect(await page.locator('.film').evaluate(el => getComputedStyle(el).clipPath)).toBe('none');
    if ([.3,.6,.85].includes(p)) {
      const stats=await page.locator('#story canvas').evaluate(el => { const c=el as HTMLCanvasElement,ctx=c.getContext('2d')!,values: number[]=[]; for(let x=0;x<16;x++)for(let y=0;y<16;y++){const d=ctx.getImageData(Math.floor(x*c.width/16),Math.floor(y*c.height/16),1,1).data;values.push(.2126*d[0]+.7152*d[1]+.0722*d[2]);}const mean=values.reduce((a,b)=>a+b,0)/values.length;return { bright:values.filter(x=>x>16).length/256,variance:values.reduce((a,b)=>a+(b-mean)**2,0)/256 }; }); expect(stats.bright).toBeGreaterThan(.05); expect(stats.variance).toBeGreaterThan(20);
    }
  }
  await expect(page.locator('.stage')).toHaveClass(/exiting/); expect(await page.locator('.film').evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThan(0);
  await expect(page.getByRole('heading',{ level:1,name:'Grow more. Guess less.' })).toHaveCount(1);
  for (const title of ['Every season starts with a stack of bills.',"Snap a bill. That's the whole job.",'AI files it under crop and season.','See what each crop really earned.']) await expect(page.getByRole('heading',{ level:2,name:title,exact:true })).toHaveCount(1);
  expect(await page.locator('h1,.chapter,.hero-layer,.hero-content,.site-header,nav').evaluateAll(els => els.every(el => { let node: Element | null=el; while(node){const s=getComputedStyle(node);if(node.hasAttribute('inert')||node.getAttribute('aria-hidden')==='true'||s.visibility==='hidden'||(s.display==='none' && !node.matches('nav')))return false;node=node.parentElement;}return true;}))).toBe(true);
  expect(frames.length).toBeGreaterThan(1); expect(frames.every(url => url.includes(`/cinematic/${info.project.name === 'mobile' ? 'mobile' : 'desktop'}/`))).toBe(true); expect(errors).toEqual([]);
});
test('local-only bill demo, crop arithmetic, carousel buttons and keyboard',async({ page }) => {
  const posts: string[]=[]; page.on('request',r => { if (['POST','PUT'].includes(r.method())) posts.push(r.url()); }); await page.goto('/');
  await page.getByRole('button',{ name:/Urea fertilizer/ }).click(); await expect(page.locator('#demo [role=status]')).toContainText('₹2,680'); await expect(page.locator('#demo [role=status]')).toContainText('Fertilizer');
  await page.locator('#bill-file').setInputFiles({ name:'bill.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8s8AAAAASUVORK5CYII=','base64') }); await expect(page.locator('#demo [role=status]')).toContainText('was not read or uploaded'); await expect(page.locator('#demo dd').first()).toHaveText('Not read in this preview');
  await progress(page,.4,'categories'); await expect.poll(() => page.locator('#categories').getAttribute('data-active-index')).toBe('4');
  await page.getByRole('button',{ name:'Next category' }).click(); await expect(page.locator('#categories')).toHaveAttribute('data-active-index','5'); await page.getByRole('button',{ name:'Previous category' }).click(); await expect(page.locator('#categories')).toHaveAttribute('data-active-index','4');
  const active=page.locator('.glass-card[data-active=true]'); await active.focus(); await active.press('ArrowRight'); await expect(page.locator('#categories')).toHaveAttribute('data-active-index','5');
  await page.locator('#dashboard').scrollIntoViewIfNeeded(); await expect(page.locator('.profit-value')).toHaveText('₹48,200'); await page.getByRole('button',{ name:'Rice',exact:true }).click(); await expect(page.locator('.profit-value')).toHaveText('₹58,000'); await expect(page.getByRole('button',{ name:'Rice',exact:true })).toHaveAttribute('aria-pressed','true'); expect(posts).toEqual([]);
});
test('waitlist validation, localhost refusal, privacy and missing optional sound',async({ page },info) => {
  await page.goto('/'); await expect(page.getByRole('button',{ name:'Sound unavailable' })).toHaveAttribute('aria-disabled','true'); await expect(page.getByRole('button',{ name:'Sound unavailable' })).toHaveAttribute('aria-pressed','false');
  if (info.project.name === 'mobile') await expect(page.getByTestId('custom-cursor')).toHaveCount(0); else await expect(page.getByTestId('custom-cursor')).toHaveCount(1);
  await page.locator('#waitlist').scrollIntoViewIfNeeded(); const submit=page.getByRole('button',{ name:'Keep me in the loop' }),input=page.locator('#contact'); await submit.click(); await expect(page.locator('#contact-error')).toHaveText('Enter your email or phone number.'); await expect(input).toBeFocused(); await expect(input).toHaveAttribute('aria-invalid','true');
  await input.fill('abc'); await submit.click(); await expect(page.locator('#contact-error')).toContainText('10–15 digits'); await expect(page.locator('#waitlist [role=status]')).toBeEmpty();
  await input.fill('farmer@example.com'); await submit.click(); await expect(page.locator('#waitlist [role=status]')).toContainText('nothing was submitted'); await expect(page.locator('#contact-error')).toBeEmpty();
  await page.locator('.consent a').click(); await expect(page.getByRole('heading',{ level:1,name:'Privacy notice' })).toBeVisible(); for (const text of ['Netlify Forms','retention','privacy@cropbillai.me','DPDP']) await expect(page.locator('main')).toContainText(text);
});
test('reduced motion static story, scroll-snap categories, runtime motion restoration and no overflow',async({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' }); await page.goto('/'); await expect(page.getByTestId('custom-cursor')).toHaveCount(0);
  expect(await page.locator('#story').evaluate(el => el.getBoundingClientRect().height <= el.querySelector('.stage')!.getBoundingClientRect().height+1)).toBe(true);
  expect(await page.locator('.stage').evaluate(el => getComputedStyle(el).position)).toBe('relative'); await expect(page.locator('.film')).toBeHidden();
  for (const el of await page.locator('.chapter').all()) { expect(await el.evaluate(el => getComputedStyle(el).opacity)).toBe('1'); expect(await el.evaluate(el => getComputedStyle(el).position)).not.toBe('absolute'); }
  expect(await page.locator('.carousel-track').evaluate(el => getComputedStyle(el).overflowX)).toBe('auto'); expect(await page.locator('.carousel-item').first().evaluate(el => getComputedStyle(el).transform)).toBe('none');
  for (const id of ['story','demo','categories','dashboard','finale','waitlist']) { await page.locator('#'+id).scrollIntoViewIfNeeded(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await page.evaluate(() => window.scrollTo({ top:0,behavior:'instant' })); await page.emulateMedia({ reducedMotion:'no-preference' }); await expect(page.locator('#story canvas')).toHaveAttribute('data-drawn',/\d+:\d+/); expect(await page.locator('#story').evaluate(el => el.getBoundingClientRect().height > el.querySelector('.stage')!.getBoundingClientRect().height*3)).toBe(true);
});
test('no-JS copy and skip links remain readable',async({ browser,baseURL },info) => {
  const context=await browser.newContext({ javaScriptEnabled:false,viewport:info.project.name === 'mobile' ? { width:390,height:844 } : { width:1440,height:900 } }),page=await context.newPage(); await page.goto(baseURL!);
  await expect(page.getByRole('heading',{ level:1,name:'Grow more. Guess less.' })).toBeVisible(); expect(await page.locator('.chapter').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1'))).toBe(true); await expect(page.locator('.film')).toBeHidden(); await context.close();
});
test('finale is lazy, mounts sprout, screenshot review set and no runtime errors',async({ page },info) => {
  const errors: string[]=[]; page.on('pageerror',e => errors.push(e.message)); page.on('console',m => { if (m.type() === 'error') errors.push(m.text()); });
  await mkdir('test-artifacts',{ recursive:true }); await page.goto('/'); await page.waitForTimeout(700); await expect(page.locator('#finale')).not.toHaveAttribute('data-finale-loaded',''); await page.screenshot({ path:`test-artifacts/${info.project.name}-hero.png` });
  await progress(page,chapterAnchor(2,beats)); await page.screenshot({ path:`test-artifacts/${info.project.name}-mid-cinematic.png` }); await progress(page,4/9,'categories'); await page.screenshot({ path:`test-artifacts/${info.project.name}-carousel.png` });
  await page.locator('#finale').scrollIntoViewIfNeeded(); await expect(page.locator('#finale')).toHaveAttribute('data-finale-loaded',''); await expect(page.locator('#finale canvas').or(page.getByTestId('mascot-poster'))).toBeVisible(); await page.waitForTimeout(2000); console.log(info.project.name,'finale:',await page.locator('#finale canvas').count() ? 'WebGL canvas' : 'SVG fallback'); await page.screenshot({ path:`test-artifacts/${info.project.name}-finale.png` });
  await page.locator('#waitlist').scrollIntoViewIfNeeded(); await page.waitForTimeout(800); await page.screenshot({ path:`test-artifacts/${info.project.name}-waitlist.png` }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
});
test('first-load encoded bytes stay within budget under production CSP',async({ page },info) => {
  test.skip(info.project.name !== 'desktop'); let total=0,images=0; const pending: Promise<void>[]=[];
  page.on('requestfinished',request => { pending.push((async() => { const size=await request.sizes(); const n=size.responseBodySize+size.responseHeadersSize; total+=n; if (request.resourceType() === 'image') images+=n; })()); });
  const response=await page.goto('/'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(2000); await Promise.all(pending);
  expect(response!.headers()['content-encoding']).toMatch(/br|gzip/); expect(response!.headers()['content-security-policy']).toContain("frame-ancestors 'none'"); console.log({ total,images,encoding:response!.headers()['content-encoding'] }); expect(total).toBeLessThan(1500000); expect(images).toBeLessThan(600000);
});
