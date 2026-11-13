# PROTOCOL — game

The production codebase. Currently at **Milestone 0 (foundation)**: no gameplay yet.

```bash
cd game
npm install
npm run dev        # http://localhost:5210
npm test           # unit tests
npm run typecheck
npm run asset -- <input.gltf|glb> <output.glb> [maxTextureSize]   # compress an asset
```

URL options: `?q=low` low profile · `?force=webgl` WebGL 2 fallback · `?perf=1` print a frame-time measurement to the console.

In the test room: WASD move, drag to look, Space/Q up and down, Shift fast, F1 overlay, F2 switch profile, keys 1–6 fire sample mission events, 0 resets them.

## Layout

```
src/core/      loop.ts (fixed 60 Hz step) · events.ts (typed bus) · missionState.ts (reducer) · tests
src/render/    renderer.ts: WebGPURenderer wrapper, profiles, dynamic resolution, bloom
src/assets/    assetManager.ts: GLB (Meshopt, KTX2-ready), PBR textures, HDRI, per-stage dispose
src/input/     input.ts: named actions, rebindable
src/debug/     overlay.ts: frame time, renderer numbers, mission state
src/stages/    testRoom.ts: Milestone 0 test stage, not part of the game
scripts/       optimize-asset.mjs: compression step of the asset pipeline
```

Rules: `src/core` never imports Three.js. Game state changes only through events and the reducer. See `docs/tech-notes.md`.
