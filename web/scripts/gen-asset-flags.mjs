import { stat, mkdir, writeFile } from 'node:fs/promises';
const exists=async path => { try { const s=await stat(new URL('../public/'+path,import.meta.url)); if (s.size > (path.endsWith('glb') ? 5 : 2)*1024*1024) console.warn('Asset exceeds recommended size:',path); return s.isFile() && s.size > 0; } catch { return false; } };
await mkdir(new URL('../public/',import.meta.url),{ recursive: true });
await writeFile(new URL('../public/asset-flags.json',import.meta.url),JSON.stringify({ ambientAudio: await exists('audio/ambient.mp3'), mascotGlb: await exists('models/mascot.glb') }));
