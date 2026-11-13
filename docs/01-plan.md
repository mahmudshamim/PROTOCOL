# PROTOCOL — Pre-Production Plan

Do the steps in order. Each ends with a deliverable. Stop at every **Gate** and wait for the owner's approval, then log it in `docs/decisions.md` and update "Current status" in `AGENTS.md`.

No gameplay code before Gate 4. The benchmark in Step 3 is the only code allowed earlier.

## Progress

- [ ] Step 0 — Setup
- [x] Step 1 — Game Design Document → **Gate 1 approved**
- [x] Step 2 — Visual direction (short)
- [x] Step 3 — Visual benchmark → **Gate 2 approved**
- [x] Step 4 — Visual Bible, environments, characters and vehicles
- [x] Step 5 — Asset catalogue and pipeline → **Gate 3 approved**
- [x] Step 6 — Production roadmap → **Gate 4 approved**. Production continues in `docs/08-roadmap.md`.

---

## Step 0 — Setup

1. Preview the skills: `npx skills add gamedev-skills/awesome-gamedev-agent-skills --list`. Read its output for the correct flag for your agent before installing.
2. Install only these: `threejs-scene-setup`, `threejs-gltf-loading`, `threejs-materials-lighting`, `create-game-assets`, `game-ai`, `ai-behavior-trees-utility-ai`, `level-design`, `camera-systems`, `physics-tuning`, `performance-optimization`. Skills are guidance, not a replacement for judgement.
3. Do not install Blender or other tools yet; that happens in Step 3, with the owner's permission.

## Step 1 — Game Design Document → `docs/01-gdd.md`

Before writing, ask the owner the two open Step 1 questions in `docs/decisions.md` (combat style; checkpoints).

Contents:

1. Refined concept, one page.
2. Full story across all stages (brief §2).
3. Branching mission-flow diagram in Mermaid: approaches A–D and how each leads into a different escape.
4. Guard perception: the 7 states, what moves a guard between them, detection inputs with rough numbers (view distance, FOV angle, time-to-identify in light and in shadow, hearing radius by player speed), and how information passes between guards.
5. Security levels 0–5: what triggers each, what each changes in the world, how levels fall back.
6. Mission state variables and the consequence table.
7. Combat system.
8. Vehicle gameplay: motorcycle, sports car, police pursuit, helicopter.
9. Success and failure conditions; full list of mission outcomes.

**Gate 1 — owner approves the GDD.**

## Step 2 — Visual direction → `docs/02-visual-direction.md`

Two pages at most: colour palette with hex values, lighting (desert sunset, emergency red, device blue), material targets, camera language, UI language. It is expanded in Step 4 once the benchmark shows what is achievable.

## Step 3 — Early visual benchmark → `benchmark/` and `docs/03-benchmark-report.md`

**Purpose:** find out what "cinematic realism" really looks like in Chrome on an 8 GB M1 Air, before the rest of the plan depends on it.

Build:

- A small Vite + TypeScript project in `benchmark/`, **vanilla Three.js**, no React, so the same scene runs on both `WebGLRenderer` and `WebGPURenderer`. A URL parameter or on-screen toggle switches renderer and quality level.
- Scene: a slice of the facility exterior, one character, the motorcycle, sunset lighting, shadows, dust, basic post-processing.
- Assets: Poly Haven (CC0) HDRI and PBR textures. Character and motorcycle from a licensed source if a good one exists; otherwise custom (Step 5 route). Labelled placeholders are acceptable only if the report says so clearly.
- Ask the owner before installing Blender (`brew install --cask blender`) and `@gltf-transform/cli`.

Measure, on both renderers, at two quality levels: FPS and frame time, draw calls, triangles, GPU and JS memory, download size, load time.

Report: screenshots, the numbers, and three recommendations with alternatives:

1. WebGL 2 or WebGPU renderer for production.
2. Vanilla Three.js or React Three Fiber for the game.
3. The honest quality ceiling on this machine, with a texture and memory budget.

Also include the technical architecture comparison and browser performance strategy here, based on the measured numbers.

**Gate 2 — owner approves the look and the three technical decisions.**

## Step 4 — Full design documents

- `docs/04-visual-bible.md`: palette, lighting, materials, character, vehicles, environments, camera, UI, effects. Built from Step 2 plus benchmark results.
- `docs/05-environments.md`: facility, desert highway, container yard, final escape zone. For each: major assets, secondary assets, small props, lighting, materials, VFX, audio, interactive objects, and a top-down layout sketch.
- `docs/06-characters-vehicles.md`: protagonist, guards, police; the five vehicles; complete animation list; what is missing and must be made.

## Step 5 — Asset catalogue and pipeline → `docs/07-asset-catalogue.md`

- One row per asset with every field in brief §11, plus a status: approved candidate / needs testing / rejected / custom production.
- Only links you have opened and checked. No real car brands.
- Custom route for anything not available at quality: AI 3D generation → rig → animate → Blender (headless) cleanup → `gltf-transform` (Meshopt or Draco, KTX2) → check in the benchmark scene.
  - Show the cost estimate and ask before each paid batch.
  - Generated hard-surface vehicles and human faces are often weak. If output is below the bar, say so and propose a paid asset.
- Include the environment assembly plan: how Blender scenes and separate GLB files are put together, LODs, instancing, streaming by area to fit 8 GB.

**Gate 3 — owner approves the catalogue.**

## Step 6 — Production roadmap → `docs/08-roadmap.md`

Full chain, built in this order, each milestone playable on its own:

1. Facility: movement, camera, stealth, guard AI, security levels, branching, device theft.
2. Motorcycle escape and desert highway.
3. Container yard and sports car.
4. Police pursuit, final escape, outcomes.
5. Audio, main menu, save/load, graphics settings.
6. Mobile controls and optimisation, with a lower visual target.

For each: dependencies, required assets, performance targets taken from the benchmark, tests, risks, definition of done.

**Gate 4 — owner approves the roadmap. Gameplay coding may begin.**

---

## Risks

- The full chain is a large scope for one person plus AI. Expect many milestones.
- 8 GB RAM limits texture resolution and how much world is loaded at once.
- Realistic humans are the hardest asset to get right. The benchmark tests this first.

## How to check each step

- Documents: owner reads and approves at the gate; approval logged.
- Benchmark: `npm run dev` inside `benchmark/`, open in Chrome, switch renderer and quality; numbers and screenshots in the report must match what runs.
- Assets: each catalogued asset loads in the benchmark scene before it is marked approved.
