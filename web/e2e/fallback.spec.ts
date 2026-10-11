import { test, expect } from '@playwright/test';
test('missing manifest degrades to readable static story',async({ page }) => {
  const errors: string[]=[]; page.on('pageerror',e => errors.push(e.message)); await page.route('**/cinematic/manifest.json',route => route.fulfill({ status:503,body:'Unavailable' })); await page.goto('/'); await expect(page.locator('#story')).toHaveAttribute('data-cinematic','unavailable');
  expect(await page.locator('.chapter').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1' && getComputedStyle(el).position !== 'absolute'))).toBe(true); await expect(page.getByRole('heading',{ level:1,name:'Grow more. Guess less.' })).toBeVisible(); expect(errors).toEqual([]);
});
test('invalid local files show recoverable errors without sending a request',async({ page }) => {
  const posts: string[]=[]; page.on('request',r => { if(r.method() !== 'GET')posts.push(r.url()); }); await page.goto('/'); await page.locator('#bill-file').setInputFiles({ name:'not-a-photo.txt',mimeType:'text/plain',buffer:Buffer.from('test') }); await expect(page.locator('#bill-error')).toContainText('Please choose'); await page.getByRole('button',{ name:/Urea fertilizer/ }).click(); await expect(page.locator('#bill-error')).toBeEmpty(); await expect(page.locator('#demo [role=status]')).toContainText('Simulation result'); expect(posts).toEqual([]);
});
