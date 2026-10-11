export interface AssetFlags { ambientAudio: boolean; mascotGlb: boolean }
let cached: Promise<AssetFlags> | undefined;
export function getAssetFlags() {
  return cached ??= fetch('/asset-flags.json').then(r => { if (!r.ok) throw new Error('flags'); return r.json(); }).then(v => ({ ambientAudio: v.ambientAudio === true, mascotGlb: v.mascotGlb === true })).catch(() => ({ ambientAudio: false, mascotGlb: false }));
}
