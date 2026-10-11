export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x: number) => { x = clamp(x); return x*x*(3-2*x); };
export const fmtOpacity = (x: number) => x.toFixed(3);
export const fmtPx = (x: number) => x.toFixed(1)+'px';
export const fmtRadius = (x: number) => Math.round(x)+'px';
export const filmProgress = (p: number) => clamp((p-.12)/.75);
export const exitProgress = (p: number) => smooth((p-.91)/.09);
export const progressFromRect = (top: number, height: number, stage: number) => clamp(-top/Math.max(1,height-stage));
export function framePosition(f: number, frames: number[]) {
  const scene = Math.min(frames.length-1, Math.floor(clamp(f)*frames.length));
  const local = clamp(f*frames.length-scene);
  return { scene, local, index: Math.round(local*(frames[scene]-1)), transition: scene > 0 ? smooth(local/.12) : 0 };
}
export function chapterAt(f: number, beats: number[]) {
  let active = 0;
  beats.forEach((b,i) => { if (f >= b) active = i; });
  return { active, local: clamp((f-beats[active])/((beats[active+1] ?? 1)-beats[active])) };
}
export function chapterAnchor(i: number, beats: number[]) { return .12+.75*(beats[i]+.4*((beats[i+1] ?? 1)-beats[i])); }
export function chapterOpacity(i: number, p: number, beats: number[]) {
  const { active, local } = chapterAt(filmProgress(p), beats);
  return i === active && p > .12 ? smooth((local-.08)/.16)*(i === beats.length-1 ? 1 : 1-smooth((local-.76)/.16))*(1-smooth(exitProgress(p)/.65)) : 0;
}
export const wordReveal = (local: number, n: number) => smooth((local-.1-n*.012)/.14);
