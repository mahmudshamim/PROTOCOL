// Asset pipeline, compression step: any glTF/GLB in -> game-ready GLB out.
//   npm run asset -- <input.gltf|glb> <output.glb> [maxTextureSize]
// Meshopt geometry compression + WebP textures. KTX2 will replace WebP once the
// KTX-Software tools are installed (needs the owner's permission; see docs/decisions.md).
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';

const [input, output, size = '1024'] = process.argv.slice(2);
if (!input || !output) { console.error('usage: npm run asset -- <input> <output.glb> [maxTextureSize]'); process.exit(1); }
const r = spawnSync('npx', ['gltf-transform', 'optimize', input, output, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', size], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`${output}: ${(statSync(output).size / 1024).toFixed(0)} KB`);
