export class DomWriter {
  cache = new Map<HTMLElement, Map<string, string | null>>();
  originals = new Map<HTMLElement, Map<string, string | null>>();
  write(el: HTMLElement, key: string, value: string | null, read: () => string | null, apply: (v: string | null) => void) {
    if (!this.cache.has(el)) { this.cache.set(el,new Map()); this.originals.set(el,new Map()); }
    const map = this.cache.get(el)!;
    if (map.has(key) && map.get(key) === value) return;
    if (!this.originals.get(el)!.has(key)) this.originals.get(el)!.set(key,read());
    map.set(key,value); apply(value);
  }
  style(el: HTMLElement, prop: string, value: string) {
    if (/[A-Z]/.test(prop)) throw new Error('DomWriter: kebab-case only: '+prop);
    this.write(el,'s:'+prop,value,() => el.style.getPropertyValue(prop),v => v ? el.style.setProperty(prop,v) : el.style.removeProperty(prop));
  }
  attr(el: HTMLElement, name: string, value: string | null) { this.write(el,'a:'+name,value,() => el.getAttribute(name),v => v === null ? el.removeAttribute(name) : el.setAttribute(name,v)); }
  toggle(el: HTMLElement, name: string, on: boolean) { this.write(el,'c:'+name,String(on),() => String(el.classList.contains(name)),v => el.classList.toggle(name,v === 'true')); }
  text(el: HTMLElement, value: string) { this.write(el,'t:',value,() => el.textContent,v => { el.textContent = v; }); }
  reset() {
    for (const [el,map] of this.originals) for (const [key,v] of map) {
      const prop = key.slice(2);
      if (key.startsWith('s:')) { if (v) el.style.setProperty(prop,v); else el.style.removeProperty(prop); }
      else if (key.startsWith('a:')) { if (v === null) el.removeAttribute(prop); else el.setAttribute(prop,v); }
      else if (key.startsWith('c:')) el.classList.toggle(prop,v === 'true');
      else el.textContent = v;
    }
    this.cache.clear(); this.originals.clear();
  }
}
