# PROTOCOL — Visual Benchmark Report

Status: **waiting for Gate 2 approval.** Date: 2026-11-13.

## What was tested

One scene, a slice of the facility front yard, rendered three ways from the same code (`benchmark/`):

1. **Classic `WebGLRenderer`** with `EffectComposer` bloom.
2. **`WebGPURenderer` on WebGPU** with node (TSL) bloom.
3. **`WebGPURenderer` forced onto its WebGL 2 backend**: what a browser without WebGPU would get.

Scene contents: HDRI sky and image-based lighting, one shadow-casting sun, four spot lights, one point light, fog, bloom, six animated skinned characters, 33 scanned props.

| Quality | Resolution | Shadow map | Bloom | Anisotropy |
|---|---|---|---|---|
| High | 1920×1080 | 2048 | on | 8 |
| Low | 1280×720 | 1024 | off | 2 |

### How it was measured

- Machine: MacBook Air M1, 8 GB. Chrome 159, **headless**, Metal backend, real GPU.
- Frame time = draw the frame, then wait until the GPU has finished it. 150 frames per run after a 210-frame warm-up.
- Three.js 0.172.

### Limits of these numbers

- Headless Chrome, not a visible window. Nobody has yet watched it run on screen; the owner should open it and compare.
- The two APIs need different "GPU finished" calls (`readPixels` on WebGL, `onSubmittedWorkDone` on WebGPU), so row 2 against rows 1 and 3 is approximate. Rows 1 and 3 use the same call and compare directly.
- One short run each. Treat differences under about 15% as noise.
- Load time was measured from a warm local server, so it says nothing about real download time and is left out.

## Results

| Path | Quality | Frame time | 95th pct | FPS | Draw calls | CPU per frame |
|---|---|---|---|---|---|---|
| Classic WebGL | High | 27.9 ms | 29.3 ms | **36** | 374 | 2.5 ms |
| Classic WebGL, no MSAA | High | 23.2 ms | 26.2 ms | 43 | 374 | 3.5 ms |
| WebGPU | High | 12.7 ms | 16.9 ms | **79** | 269 | 4.1 ms |
| WebGPU renderer on WebGL 2 | High | 14.7 ms | 15.5 ms | **68** | 269 | 3.9 ms |
| Classic WebGL | Low | 12.3 ms | 16.5 ms | 82 | 360 | 2.8 ms |
| WebGPU | Low | 12.1 ms | 12.9 ms | 83 | 257 | 4.2 ms |
| WebGPU renderer on WebGL 2 | Low | 14.4 ms | 19.2 ms | 69 | 257 | 4.0 ms |

Other figures, same on all paths:

- Triangles submitted per frame: about 0.9–1.1 million including the shadow pass. (The forced-WebGL 2 path reports 3.6 million; that is a counting difference in the library, the image is identical.)
- JS heap: 27–40 MB.
- Texture memory, uncompressed estimate: 164–176 MB for 32 textures at 1K.
- Assets on disk: 24 MB, uncompressed JPG and glTF.

Raw data and one screenshot per run: `benchmark/results/`.

### What the numbers say

- **All three paths produce the same picture.** Screenshots from classic WebGL and WebGPU are indistinguishable.
- **At Low, every path is around 70–83 fps.** The scene itself is cheap for this GPU.
- **At High, classic WebGL drops to 36 fps and the WebGPU renderer does not.** The cost is the classic post-processing stack: 4× MSAA on a floating-point target accounts for about 5 ms, its bloom for most of the rest. This is a property of that bloom implementation, not of WebGL: the WebGPU renderer running on WebGL 2 holds 68 fps with its own bloom. A cheaper bloom would close much of the gap on the classic path.
- **The WebGPU renderer costs about 1.5 ms more CPU per frame** at this scene size. Worth watching as draw calls grow.
- Memory is far inside the 8 GB budget at this scale. A full stage will have several times the textures, so compression is still needed.

## What it looks like, honestly

Works well:

- Scanned props (crates, barrels, generator, covered car, barriers, boulders) read as real objects under this lighting.
- HDRI sky light plus one warm sun gives a believable dusk without baking anything.
- Bloom on the device and lamps, fog swallowing the horizon.

Does not work yet:

- **Architecture.** Flat textured boxes look like a prototype. The building needs modelled detail: door frames, pipes, vents, signage, edge wear, decals.
- **Characters.** The stand-in soldier is a three.js sample, not our protagonist, and human quality is still untested. This remains the biggest visual risk.
- **Vehicles.** The motorcycle is a placeholder shape. No realistic vehicle has been tested.
- **Emptiness.** A real yard needs many more props and ground detail: tyre marks, cracks, sand drifting onto asphalt.
- **Ambient shadowing.** Objects sit a little flat on the ground. Ambient occlusion would fix this and was not tested.

**Verdict on the quality ceiling:** the target "cinematic realism" is reachable for environments and props on this hardware in the sense of a good-looking modern indie game. It is not film photorealism, and it will not be for humans. The limit is assets and set dressing, not the renderer.

## Recommendations for approval

### 1. Renderer: `WebGPURenderer`, with its built-in WebGL 2 fallback

| | WebGPURenderer (recommended) | Classic WebGLRenderer |
|---|---|---|
| What it is | Newer Three.js renderer. Uses WebGPU where available, WebGL 2 otherwise. | The long-standing renderer. WebGL 2 only. |
| Measured here | 79 fps High; 68 fps on its fallback | 36 fps High with stock post-processing |
| Custom shaders | Written once in TSL, run on both backends | Raw GLSL |
| Post-processing | Built-in node effects | `EffectComposer`, or the pmndrs library |
| Maturity | Newer; APIs still change between releases | Very stable, most tutorials and examples |

Why: one code path covers both kinds of browser, it measured faster with effects on, and it is where Three.js development is going.

Limits and what they mean for PROTOCOL:

- Every custom material and effect must be written in TSL. Raw GLSL snippets and WebGL-only libraries cannot be used.
- Pin the Three.js version and upgrade deliberately; behaviour changes between releases.
- The fallback was tested here only by forcing it in Chrome. Firefox and Safari must be tested on real browsers before release.
- If a blocking bug appears, classic WebGL is the fallback plan. Keeping game logic separate from rendering (tech notes §1) keeps that switch affordable.

### 2. Framework: vanilla Three.js. React only for menus, if at all

The game needs a fixed-step simulation loop it fully controls, and React Three Fiber leans on the classic renderer and its helper libraries. Plain Three.js with plain HTML/CSS for the HUD (as the preview and benchmark both do) has the fewest moving parts. React can be added later for the settings and menu screens without touching the game.

### 3. Quality profiles and budgets

Starting targets for the M1 Air, to be re-measured as real stages are built:

| | High | Low |
|---|---|---|
| Internal resolution | 1080p, scaled to fit the window | 720p |
| Target | 60 fps | 60 fps |
| Draw calls | under 400 | under 250 |
| Triangles incl. shadows | under 1.5 M | under 0.8 M |
| Shadow map | 2048 | 1024 |
| Post | bloom, AO if it fits | none |
| Texture memory after compression | under 400 MB | under 200 MB |

Do not render at the laptop's full Retina resolution; render at the profile resolution and let the browser scale.

## Architecture and performance strategy

- **Structure:** simulation → typed events → presentation, as in `docs/tech-notes.md` §1–2. Unchanged by this benchmark.
- **Assets:** GLB with Meshopt geometry compression and KTX2 textures. This benchmark used uncompressed 1K JPGs; KTX2 should cut GPU texture memory by roughly 4–6×, which is what makes 2K hero textures affordable.
- **Per-stage loading:** load one stage, dispose the last. Never hold the whole world.
- **Instancing:** the six barriers and eight barrels here are separate draw calls. Repeated props must be instanced in production.
- **Dynamic resolution:** drop internal resolution when frame time exceeds budget, before dropping effects.
- **Auto profile:** pick High or Low from a two-second measurement at first launch; always allow manual override.

## Assets used

All Poly Haven, CC0: `qwantani_dusk_2` (sky), `sand_01`, `concrete_wall_008` (textures), and models `concrete_road_barrier_02`, `Barrel_01`, `old_military_crate`, `portable_generator`, `namaqualand_boulders_01`, `covered_car`, `portable_searchlight`.

Placeholders, not for production: `Soldier.glb` (three.js sample character), box containers, the motorcycle shape, the building.

No Blender or other tools were installed, and nothing was spent.

## Not tested, still open

- A realistic human character and a realistic vehicle.
- Ambient occlusion, reflections, depth of field.
- KTX2 and Meshopt compression.
- Real Firefox and Safari; any phone.
- A visible Chrome window at the laptop's native resolution.

## Run it yourself

```bash
cd benchmark
npm install
npm run dev          # classic WebGL  → http://localhost:5201
npm run dev:webgpu   # WebGPU         → http://localhost:5202   (add ?force=webgl for its fallback)
```

Add `?q=low` for the low profile. The panel in the corner shows live numbers and links between paths. Add `?bench=1` to measure and save into `benchmark/results/`.
