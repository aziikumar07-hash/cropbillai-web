# Optional mascot

Replace the original procedural seed-and-sprout character by adding `mascot.glb` here, then rebuild. Use an original or commercially licensed glTF 2.0 binary, Y-up, origin at the feet, about one unit tall, embedded textures, under 5 MB. The scene automatically fits the model.

Draco and Meshopt compression are deliberately unsupported (no external decoders or WebAssembly under the CSP). Use `npx @gltf-transform/cli copy input.glb mascot.glb` with an uncompressed source/export, and verify the result contains neither `KHR_draco_mesh_compression` nor `EXT_meshopt_compression`. Broken/unavailable models use the procedural sprout. The loading and no-WebGL SVG poster remains the sprout even after a GLB swap.
