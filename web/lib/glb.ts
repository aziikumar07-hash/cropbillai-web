export function inspectGlb(buffer: ArrayBuffer): { ok: boolean; reason?: string } {
  if (buffer.byteLength < 20) return { ok: false, reason: 'not-glb' };
  const view = new DataView(buffer), size = view.getUint32(12,true);
  if (view.getUint32(0,true) !== 0x46546c67 || view.getUint32(4,true) !== 2 || view.getUint32(8,true) !== buffer.byteLength || view.getUint32(16,true) !== 0x4e4f534a || size+20 > buffer.byteLength) return { ok: false, reason: 'not-glb' };
  try {
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,size)));
    if ([...(json.extensionsUsed ?? []),...(json.extensionsRequired ?? [])].some(x => ['KHR_draco_mesh_compression','EXT_meshopt_compression'].includes(x))) return { ok: false, reason: 'compressed' };
    return { ok: true };
  } catch { return { ok: false, reason: 'bad-json' }; }
}
