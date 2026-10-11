import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DomWriter } from './domWriter.ts';
test('change-only string writes, kebab-case guard, originals restored',() => {
  const values=new Map<string,string>(),attrs=new Map<string,string>([['data-chapter','0']]),classes=new Set<string>(); let writes=0;
  const el={ style:{ getPropertyValue:(p: string) => values.get(p) ?? '', setProperty:(p: string,v: string) => { writes++; values.set(p,v); }, removeProperty:(p: string) => values.delete(p) }, getAttribute:(p: string) => attrs.get(p) ?? null, setAttribute:(p: string,v: string) => attrs.set(p,v), removeAttribute:(p: string) => attrs.delete(p), classList:{ contains:(p: string) => classes.has(p), toggle:(p: string,on: boolean) => on ? classes.add(p) : classes.delete(p) }, textContent:'original' } as unknown as HTMLElement;
  const w=new DomWriter(); w.style(el,'opacity','0.123'); w.style(el,'opacity','0.123'); assert.equal(writes,1); assert.throws(() => w.style(el,'clipPath','none'));
  w.attr(el,'data-chapter','3'); w.toggle(el,'exiting',true); w.text(el,'changed'); w.reset(); assert.equal(values.size,0); assert.equal(attrs.get('data-chapter'),'0'); assert.equal(classes.size,0); assert.equal(el.textContent,'original');
});
