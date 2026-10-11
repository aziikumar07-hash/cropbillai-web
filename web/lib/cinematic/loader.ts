export type FrameKey = `${number}:${number}`;
export interface FrameImage { src: string; onload: ((event: Event) => unknown) | null; onerror: ((event: Event | string) => unknown) | null }
export const frameKey = (s: number, f: number): FrameKey => `${s}:${f}`;
export const parseKey = (key: FrameKey) => key.split(':').map(Number);
export function buildRequests(pos: { scene: number; local: number; index: number }, frames: number[]) {
  const out = [0,1,-1,2,-2,3,-3,5,-5,8,-8].map(d => frameKey(pos.scene,Math.max(0,Math.min(frames[pos.scene]-1,pos.index+d))));
  if (pos.scene > 0 && pos.local < .12) out.push(frameKey(pos.scene-1,frames[pos.scene-1]-1));
  if (pos.scene < frames.length-1 && pos.local > .85) out.push(frameKey(pos.scene+1,0));
  return [...new Set(out)];
}
export function createLoader<I extends FrameImage>(deps: { createImage(): I; url(k: FrameKey): string; canLoad(): boolean; onLoaded(k: FrameKey): void; current(): { scene: number; index: number }; setTimeout(fn: () => void, ms: number): number; clearTimeout(id: number): void }, cfg: { concurrency: number; cacheSize: number; retryDelayMs: number }) {
  let requests: FrameKey[] = [], planned = new Set<FrameKey>();
  const cache = new Map<FrameKey,I>(), pending = new Map<FrameKey,I>(), failed = new Map<FrameKey,number>(), timers = new Map<FrameKey,number>();
  function pump() {
    if (!deps.canLoad()) return;
    while (pending.size < cfg.concurrency && requests.length) {
      const key = requests.shift()!;
      if (cache.has(key) || pending.has(key) || failed.get(key) === 2 || timers.has(key)) continue;
      const image = deps.createImage(); pending.set(key,image);
      image.onload = () => {
        pending.delete(key); failed.delete(key); cache.set(key,image);
        while (cache.size > cfg.cacheSize) {
          const victim = [...cache.keys()].find(k => !planned.has(k) && k !== key) ?? cache.keys().next().value!;
          cache.delete(victim);
        }
        image.onload = image.onerror = null; deps.onLoaded(key); pump();
      };
      image.onerror = () => {
        pending.delete(key); image.onload = image.onerror = null;
        const tries = (failed.get(key) ?? 0)+1; failed.set(key,tries);
        if (tries === 1) timers.set(key,deps.setTimeout(() => {
          timers.delete(key); const [s,f] = parseKey(key), cur = deps.current();
          if (s === cur.scene && Math.abs(f-cur.index) <= 8) { requests.unshift(key); pump(); }
        },cfg.retryDelayMs));
        pump();
      };
      image.src = deps.url(key);
    }
  }
  function get(key: FrameKey) { const img = cache.get(key); if (img) { cache.delete(key); cache.set(key,img); } return img; }
  function nearest(scene: number, index: number) {
    const exact = get(frameKey(scene,index)); if (exact) return exact;
    let best: I | undefined, distance = Infinity;
    for (const [key,img] of cache) { const [s,f] = parseKey(key); if (s === scene && Math.abs(f-index) < distance) { best=img; distance=Math.abs(f-index); } }
    return best;
  }
  function reset() {
    pending.forEach(img => { img.onload = img.onerror = null; }); timers.forEach(id => deps.clearTimeout(id));
    requests=[]; planned.clear(); pending.clear(); cache.clear(); failed.clear(); timers.clear();
  }
  return { setRequests(keys: FrameKey[]) { planned=new Set(keys); requests=[...planned]; pump(); }, pump, get, nearest, reset, destroy: reset };
}
