import { defineConfig } from 'vitest/config';

// The game uses WebGPURenderer, which lives in the three/webgpu build. Loaders and other
// addons import plain "three", so alias it to the same build: one copy of the library.
export default defineConfig({
  resolve: { alias: [{ find: /^three$/, replacement: 'three/webgpu' }] },
  build: { target: 'esnext' },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
