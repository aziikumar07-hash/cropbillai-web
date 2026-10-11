export interface Manifest { version: string; mode: string; beats: number[]; variants: ('desktop' | 'mobile')[]; scenes: { frames: number; origin: string }[] }
export function parseManifest(raw: unknown): Manifest {
  const m = raw as Manifest;
  if (!m || !/^[a-f0-9]{12}$/.test(m.version) || !Array.isArray(m.scenes) || !m.scenes.length || !m.scenes.every(s => Number.isInteger(s.frames) && s.frames >= 2 && s.frames <= 1000) || !Array.isArray(m.beats) || m.beats.length !== 4 || m.beats[0] !== 0 || !m.beats.every((v,i) => Number.isFinite(v) && v >= 0 && v < 1 && (!i || v > m.beats[i-1])) || !Array.isArray(m.variants) || !m.variants.length || !m.variants.every(v => ['desktop','mobile'].includes(v))) throw new Error('Invalid cinematic manifest');
  return m;
}
export function pickVariant(width: number, dpr: number, saveData: boolean, variants: Manifest['variants']): 'mobile' | 'desktop' {
  const preferred = saveData || width*Math.min(dpr,2) <= 1000 ? 'mobile' : 'desktop';
  return variants.includes(preferred) ? preferred : variants[0];
}
export const frameUrl = (m: Manifest, variant: string, scene: number, index: number) => `/cinematic/${variant}/${m.version}/${scene}/${String(index).padStart(3,'0')}.webp`;
