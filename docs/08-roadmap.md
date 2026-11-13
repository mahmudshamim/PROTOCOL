# PROTOCOL — Production Roadmap

Status: **approved 2026-11-13.** Milestone 0 built, waiting for the owner's check.

Decided already: `WebGPURenderer` with WebGL 2 fallback, vanilla Three.js, TypeScript, Vite, Rapier physics, architecture as in `docs/tech-notes.md`. Target machine: MacBook Air M1, 8 GB, Chrome.

## How milestones work

- Built in order. Each ends in something the owner can play.
- Each has a **definition of done**. The next milestone does not start until the owner has played this one and approved it.
- **Greybox first:** gameplay is built and tuned with simple shapes and placeholder models, then real assets replace them. Gameplay work never waits for art.
- Every milestone ends with a performance check against the budgets in `docs/03-benchmark-report.md`.
- When the working agent is stuck, it follows `docs/handoff/README.md`.

## Milestone 0 — Foundation

The empty game: everything later milestones stand on.

| Build | Notes |
|---|---|
| Project skeleton in `game/` | TypeScript, Vite, pinned Three.js, lint, unit test runner |
| Core loop | Fixed 60 Hz simulation step, separate render step |
| Event bus and mission-state reducer | Typed events, state derived only from events |
| Renderer wrapper | WebGPURenderer, fallback detection, High / Low profiles, dynamic resolution |
| Asset manager | GLB + KTX2 + Meshopt loading, per-stage load and dispose |
| Input | Keyboard and mouse, action mapping (so touch and remapping can be added later) |
| Debug tools | Frame-time and memory overlay, free camera, state inspector |
| Asset pipeline scripts | Blender headless + `gltf-transform`, one command per asset |

**Needs:** permission to install Blender and KTX-Software.

**Result, 2026-11-13 (headless Chrome, M1 Air):** test room at 97 fps High and 111 fps Low on WebGPU, 68 fps High on the WebGL 2 fallback; 51 draw calls; 5.5 MB of assets; 16 unit tests pass. Three props went through the compression script (crate 2.4 MB → 407 KB). Not built: Blender headless scripts and KTX2 (installs not yet permitted), and the free camera stands in for a fuller state inspector. Not yet seen by the owner in a visible browser.
**Done when:** a textured test room loads through the pipeline, runs at 60 fps on High, the overlay shows the numbers, and the reducer has passing tests.

## Milestone 1 — The facility

The heart of the game. The longest milestone.

| Part | Build |
|---|---|
| 1a. Movement | Capsule character controller, walk / sprint / sneak, third-person camera with wall collision, animation blending |
| 1b. World | Greybox station from `docs/05-environments.md`, collision mesh, navmesh, doors, lit and dark zones |
| 1c. Perception | Vision cone, awareness meter, hearing, cameras, facts and radio reports (GDD §4) |
| 1d. Guard brain | Patrol, suspicious, investigate, search, chase, lost target; navmesh movement; squad arrival |
| 1e. Security and rules | Levels 0–5, the rule list as data, door sealing, delayed discovery |
| 1f. Combat | Silent takedown, struggle, body drag, throwables, guards firing, health |
| 1g. Mission | Objectives, device theft cinematic, three ways in, three exits, checkpoints 1–3, capture and retry |
| 1h. HUD | Objective, security level, detection bar, prompts, Sable's lines as subtitles |
| 1i. Art pass | Replace greybox with the building kit, props, Wren, guards |

**Tests:** one automated simulation test per branch in the GDD flow (ghost, glimpsed, radio stopped, alarm before theft, delayed discovery, lockdown). Guards must never see through walls; a test covers it.

**Assets needed:** Wren, guard, building kit, device, fence, lamps, props, cameras. Stock locomotion and crouch clips; custom takedown, struggle, drag and device pickup.

**Done when:** the owner can finish the facility three different ways and get three different exit states; every branch test passes; 60 fps on High with eight guards active; no guard gets permanently stuck in a ten-minute run.

**Main risks:** Wren's model quality; paired animations; navigation in tight interiors.

## Milestone 2 — Motorcycle and highway

| Build | Notes |
|---|---|
| On-foot to bike transition | Mount cinematic, control handover |
| Motorcycle controller | Arcade body, visual lean, crash and remount |
| Highway streaming | 200 m segments loaded ahead, disposed behind |
| Hazards | Sand drifts, barrier gate, rocks |
| Station pickups | Chase AI along the road spline, only at medium pursuit and above |
| Chase camera | Speed-dependent distance and field of view |
| Checkpoint 4, stage hand-off | Mission state carries over from the facility |

**Assets needed:** motorcycle, pickup, road kit, poles, signs, rocks, night sky. Custom riding animations.
**Done when:** the ride feels good to the owner on keyboard; three crashes fail the stage; pursuit appears only when the facility state says it should; 60 fps on High.
**Main risk:** motorcycle handling. Budget time for tuning, and hand off early if it feels wrong.

## Milestone 3 — Container yard and sports car

| Build | Notes |
|---|---|
| Yard greybox, then art | Instanced containers, crane, warehouse |
| Yard stealth | Two workers, one guard, crane cameras: reuses milestone 1 systems |
| Police arrival timer | At medium and heavy pursuit |
| Car entry cinematic | |
| Car controller | Rapier vehicle, tuned for grip and fun; handbrake; damage affecting speed then steering |
| Checkpoints 5 and 6 | |

**Assets needed:** container, crane, forklift, warehouse, flood lights, sports car with opening door and three damage states, worker character.
**Done when:** the owner can find and take the car with and without being seen; the car is fun to drive on an empty road; 60 fps on High in the densest lane of the yard.

## Milestone 4 — Pursuit and final escape

| Build | Notes |
|---|---|
| Final highway | Four lanes, underpass, canyon, turn-off |
| Police AI | Patrol car and SUV: chase, flank, ram; road-spline steering |
| Roadblocks | Gap or weak point; scaled by pursuit strength |
| Helicopter | Spotlight, line-of-sight break in underpass and canyon |
| Pursuit meter | Rises in sight, falls out of sight; gates the turn-off |
| Pursuit strength from mission state | none / light / medium / heavy (GDD §6) |
| Outcomes | Ghost, Shadow, Hunted, Wreck, Captured; end screen with the night's summary |

**Assets needed:** patrol car, SUV, helicopter, roadblock set, flares, signs.
**Tests:** each pursuit strength reachable from a scripted facility state; turn-off opens only with an empty meter.
**Done when:** the whole game can be played start to finish; a quiet facility run and a loud one give visibly different pursuits and different endings; 60 fps on High with six police units on screen.

## Milestone 5 — Sound, menus, saving, polish

| Build | Notes |
|---|---|
| Audio system | Web Audio, positional sound, surface footsteps, engines, sirens, alarm |
| Adaptive music | Layers that follow mission state |
| Voice | Sable and guard lines: recorded, or generated with a licensed voice tool |
| Opening cinematic | 20–30 s, skippable |
| Main menu | New Game, Continue, Settings, Credits |
| Settings | Graphics profile and render scale, audio volumes, sensitivity, key remapping |
| Save and continue | Checkpoint state in browser storage |
| Loading screens, credits | Credits generated from the asset catalogue |
| Polish pass | Ambient occlusion if it fits, dust and smoke effects, camera shake, colour grade |

**Assets needed:** all audio, with licences recorded in the catalogue.
**Done when:** a new player can start from the menu, play to an ending and continue after closing the tab, with sound throughout; every shipped asset is in the credits.

## Milestone 6 — Browsers, mobile, release

| Build | Notes |
|---|---|
| Firefox and Safari | Real-browser tests of the WebGL 2 fallback; fix differences |
| Auto quality | Two-second measurement at first launch picks the profile |
| Touch controls | Virtual stick, contextual buttons, driving controls, touch HUD |
| Mobile profile | Lower resolution, fewer lights, simpler shadows, smaller textures |
| Loading | Compressed assets, staged download, first playable under 60 MB |
| Hosting | Static host with a CDN; a shareable link |

**Done when:** playable on the owner's phone at a stable 30 fps; desktop Chrome, Firefox and Safari all reach the main menu and complete the facility; the game runs from a public link.

## Order and dependencies

```
M0 foundation ──> M1 facility ──> M2 motorcycle ──> M3 yard + car ──> M4 pursuit ──> M5 polish ──> M6 release
                     │                                   │
                     └─ perception and guard systems ────┘ reused in the yard
        car controller (M3) ──> police vehicles (M4)
```

Art runs alongside from M1 onward, always one milestone behind gameplay.

## Asset delivery by milestone

| Needed by | Assets |
|---|---|
| M1 art pass | Wren, guard, building kit, device, facility props |
| M2 | Motorcycle, pickup, road kit, riding animations |
| M3 | Container, crane, warehouse, sports car, worker |
| M4 | Patrol car, SUV, helicopter, roadblocks |
| M5 | All audio, voice |

Wren and the paired animations are the long-lead items. Start them during M0.

## Performance targets

From the benchmark, checked at the end of every milestone on the M1 Air:

| | High | Low |
|---|---|---|
| Frame rate | 60 fps | 60 fps |
| Resolution | 1080p internal | 720p internal |
| Draw calls | under 400 | under 250 |
| Triangles incl. shadows | under 1.5 M | under 0.8 M |
| Texture memory, compressed | under 400 MB | under 200 MB |

A milestone that misses these is not done.

## Testing

- **Unit tests** for the reducer, rules, perception maths and pursuit strength.
- **Simulation tests:** scripted runs with no renderer, one per branch.
- **Manual playtest** by the owner at every definition of done.
- **Performance capture** saved per milestone so regressions are visible.

## Risks

| Risk | Effect | Response |
|---|---|---|
| Scope: six milestones for one person plus AI | Runs long, quality thins out | Gates after every milestone; M1 alone is a showable game, so stopping there is a valid outcome |
| Wren and human quality | Breaks the realism target | Covered face, test early, be ready to pay for or commission the model |
| Paired animations | Takedown and struggle look wrong | Start with one takedown; cut the struggle to a simpler contest if needed |
| Vehicle feel | Whole second half depends on it | Prototype controllers in greybox at the start of M2 and M3 before any art |
| WebGPU renderer changes or bugs | Rework | Pin the version; rendering is isolated from simulation, so classic WebGL stays a fallback |
| 8 GB memory | Crashes or stutter in big stages | Per-stage loading, KTX2, instancing, zone LODs |
| Asset provenance | Legal problem after release | Provenance check in the pipeline; prefer CC0; record everything |
| No budget set | Custom assets stall | Owner decision needed before M1's art pass |

## Not in this roadmap

Multiplayer, a second mission, cloud saves and leaderboards, controller support. Any of them can follow release.

## Still open

- Permission to install Blender and `gltf-transform` (blocks M0's pipeline scripts).
- A spending ceiling for paid assets, AI generation and commissioned animation (blocks the M1 art pass).
- Step 0: installing the agent skills for the working agent.
