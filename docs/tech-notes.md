# PROTOCOL — Technical Notes

Guidance for the parts most likely to go wrong. Numbers here are **starting values to test**, not measured results. Library details are from memory as of late 2026: check the current Three.js and Rapier docs before relying on them.

## 1. Architecture shape

Three layers, strict direction: **simulation → events → presentation**.

- **Simulation** (plain TypeScript, no Three.js imports): mission state, security system, guard brains, perception maths. Runs on a fixed timestep (60 Hz) and can run headless in tests.
- **Event bus**: typed events are the only way systems talk. Nothing reads another system's private state.
- **Presentation**: Three.js scene, animation, audio, HUD. Listens to events and reads state. Never writes game state.

Why: branching logic is where bugs hide. If simulation runs without a renderer, each branch (A–D) can be covered by a fast automated test.

## 2. Events and mission state

```ts
type GameEvent =
  | { type: 'noise'; pos: Vec3; radius: number; source: 'footstep' | 'combat' | 'gunshot' | 'distraction' }
  | { type: 'playerSeen'; by: GuardId | CameraId; certainty: number; pos: Vec3 }
  | { type: 'bodyFound'; by: GuardId; pos: Vec3 }
  | { type: 'guardReport'; from: GuardId; fact: Fact }
  | { type: 'alarmRaised'; by: GuardId | CameraId | 'system' }
  | { type: 'deviceTaken' }
  | { type: 'deviceMissingNoticed'; by: GuardId }
  | { type: 'securityLevelChanged'; from: number; to: number }
  | { type: 'vehicleIdentified'; vehicle: 'motorcycle' | 'car' }
  | { type: 'zoneEntered'; zone: ZoneId };
```

`MissionState` is derived only from these events (a reducer). That gives save/load and replay for free: store the state, or store the event list.

Mission content is data, not code:

```ts
interface Rule {
  when: GameEvent['type'];
  if?: Condition;            // e.g. { deviceStolen: false, securityLevel: { gte: 3 } }
  then: Effect[];            // e.g. lockDoor('lab-main'), spawnSquad('backup-1'), setEscape('lockdown')
}
```

The four approaches are not four scripts. They fall out of rules reacting to the order events happen in. "Alarm before theft" and "theft before alarm" are the same rules seeing different state.

## 3. Guard perception

Each guard keeps a per-target **awareness meter** from 0 to 1. Do not jump states on a single frame of visibility.

Per tick, if the player is inside the vision cone **and** a line-of-sight ray is clear:

```
gain = base
     × distanceFactor   (1 at close range → 0 at max range)
     × lightFactor      (1.0 lit, ~0.35 in shadow)
     × motionFactor     (0.6 crouched still, 1.0 walking, 1.6 sprinting)
     × coneFactor       (1.0 centre of view, 0.5 peripheral)
awareness += gain × dt
```

Otherwise awareness decays slowly.

| Awareness | State |
|---|---|
| < 0.25 | Unaware |
| 0.25 – 0.6 | Suspicious (stops, looks) |
| 0.6 – 1.0 | Investigating (walks to the spot) |
| 1.0 | Identified |

`Searching`, `Alerted` and `Lost Target` are entered by events (lost sight after Identified, alarm raised, search timer expired), not by the meter.

Starting values: view range 22 m lit / 9 m dark; central cone 60°, peripheral 120°; about 1.2 s to identify at 10 m in light, about 4 s in shadow. Hearing radius: crouch 2 m, walk 6 m, sprint 12 m, melee 15 m, gunshot 60 m. Noise is blocked or halved by walls.

Performance: guards more than about 40 m away think at 5 Hz; near ones at 15–20 Hz. One or two rays per guard per think, aimed at head and torso. Use the Rapier query pipeline against a simplified collision world, not render meshes.

**Knowledge, not omniscience.** Each guard holds a list of `Fact { kind, pos, time, confidence }`. Facts spread only by: seeing or hearing directly, a radio report (takes about 2–3 s and can be interrupted by knocking the guard out), or the facility alarm. The security level is a facility-wide value; individual guards still only know the facts they hold.

Guard brain: a small hierarchical state machine is enough for patrol / investigate / search / engage. Reach for behaviour trees or utility scoring only if squad tactics become unmanageable.

Navigation: build a navmesh offline from the level's collision mesh (`recast-navigation-js` is the usual choice, with crowd avoidance). Doors toggle navmesh links, which is how lockdown changes routes.

## 4. Renderer pitfalls (matters for the benchmark)

- `WebGPURenderer` is imported from `three/webgpu`, needs async init (use `setAnimationLoop`), and can be forced onto its WebGL 2 backend with `forceWebGL: true`. Test three paths: classic `WebGLRenderer`, `WebGPURenderer` on WebGPU, `WebGPURenderer` forced to WebGL 2.
- `WebGPURenderer` does **not** run raw GLSL `ShaderMaterial` or `onBeforeCompile` patches. Custom materials must be node materials written in TSL.
- Post-processing differs per renderer: `EffectComposer` and the pmndrs `postprocessing` library are for `WebGLRenderer` only; `WebGPURenderer` uses its own TSL post-processing stack. **This is why the renderer must be chosen before any shader or effect work.**
- React Three Fiber plus Drei helpers lean on the WebGL path. If WebGPU wins, vanilla Three.js is the lower-risk route.
- KTX2 textures need the Basis transcoder files served locally and `detectSupport(renderer)` called before loading.

Look per cost, in the order that pays off: HDRI image-based lighting + ACES or AgX tone mapping + one shadowed sun (cascades only if needed) → baked or screen-space AO → bloom on emissives (device, alarms, sirens) → fog and dust cards → colour grade. Skip screen-space reflections and real-time GI on this hardware.

## 5. Budgets for 8 GB M1 Air (starting targets)

| Item | High profile | Low profile |
|---|---|---|
| Frame rate | 60 fps at 0.75–1.0 render scale | 30 fps at 0.5–0.6 |
| Draw calls | under 300 | under 150 |
| Triangles on screen | under 1.5 M | under 500 k |
| GPU texture memory | under 700 MB | under 300 MB |
| JS heap | under 500 MB | under 300 MB |
| First playable download | under 60 MB | under 30 MB |

- Unified memory: GPU and browser share the 8 GB. Hero assets 2K textures, props 1K, 4K only for terrain or sky. KTX2 (UASTC for normals, ETC1S for colour) cuts GPU memory by roughly 4–6×.
- Hero character: 30–50 k triangles, one 2K set, under 70 bones. Guards 15–20 k with shared textures. Vehicles 60–100 k for the player's, 20–30 k for police.
- Instance containers, fences, poles, rocks. Merge static geometry per area.
- Load one stage at a time and dispose the previous one: facility → highway → yard → pursuit. Do not keep the whole world in memory.

## 6. Vehicles

- Start from Rapier's raycast vehicle controller for the car; tune for fun (strong grip, assisted steering, speed-sensitive turn rate), not realism.
- The motorcycle is the hard one: a true two-wheel physics bike falls over. Simulate it as an arcade body with lean applied visually from steering and speed.
- Police AI: steer along a road spline toward a predicted player position, with states for chase, flank, ram, roadblock. They can rubber-band slightly; nobody notices if it is subtle.

## 7. Character and animation

- One skeleton standard for all humans, so animations retarget. Mixamo's rig is the practical default and its animations are free to use in games; check the current licence text before recording it in the catalogue.
- Vehicle entry, cover and device pickup rarely exist as stock clips. Plan them as short custom or cutscene-only animations.
- Movement: kinematic capsule (Rapier character controller), animation chosen from velocity, blended with crossfades. No root motion to begin with.

## 8. Good moments to hand off to Claude

- Choosing the renderer from the benchmark numbers.
- Awareness meter feels unfair or guards see through walls.
- Branch rules conflict or a branch becomes unwinnable.
- Frame rate or memory misses the budgets above.
- Motorcycle or car handling feels wrong after tuning.
- A GLB loads broken (scale, skinning, materials, compression).
