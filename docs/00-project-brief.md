# PROTOCOL — Project Brief

Condensed from the owner's Master Prompt. This is the design source of truth. Where it and `docs/decisions.md` differ, the decision log wins.

## 1. Identity

- **Title:** PROTOCOL. Tagline: "One device. No way back."
- **Genre:** third-person cinematic action, stealth, heist, vehicle escape.
- **Platform:** browser, single-player, no install. Desktop Chrome first; mobile is a separate, later strategy.
- **Visual target:** cinematic realism: detailed environments, realistic vehicles, atmospheric lighting, believable animation, dramatic camera. Quality must be shown in real-time gameplay, not claimed from concept art.
- **Core loop:** explore → plan → infiltrate → steal → fight or avoid → escape → drive → survive the pursuit.
- Think like a small professional studio, not a prototype generator.

## 2. Story

A professional thief is hired to steal a small, extremely powerful experimental device from a high-security research facility in a remote desert.

**Opening cinematic (20–30 s, skippable):** aerial view of the facility; fences, cameras, patrols, military-style vehicles; the protagonist near the perimeter; close-ups of face covering and gear; a brief glimpse of the device; cut to gameplay with the player standing **outside** the main building.

**Stages**

1. **Facility infiltration and theft** — enter, reach the secured lab, take the device.
2. **Facility escape** — quiet exit, guard pursuit, lockdown, combat escape, blocked main entrance, or alternative route, depending on mission state.
3. **Motorcycle escape** — a motorcycle waits outside; cinematic transition from on-foot to riding; desert highway.
4. **Container yard** — containers, warehouses, cranes, fencing, narrow passages; one open container holds a sports car. Player abandons the motorcycle.
5. **Sports car theft** — cinematic entry; the car must feel powerful and responsive.
6. **Police pursuit** — patrol cars, SUVs, roadblocks, helicopter; strength depends on security level and whether the vehicle was identified.
7. **Final escape** — outcomes: clean escape, crash, arrest/capture, or temporary escape that opens a new mission. No single fixed ending; the outcome reflects how the player played.

## 3. Branching mission design (most important)

Same mission, different experience depending on what the player does. Never a fixed "enter → fight → steal → run".

- **A. Stealth:** watch patrols, avoid cameras, use shadow and cover, side entrances, distractions, timing, low noise. Success delays the security response.
- **B. Combat first:** detected before the theft. Fighting has consequences (noise draws guards, backup called, cameras locate the player, alarm, more units, blocked routes) but the mission stays winnable.
- **C. Mixed:** starts quiet, discovered later; or partially seen and slips away; or fights near the lab and continues.
- **D. Steal first, discovered later:** theft is clean, then a guard notices the missing device, a camera flags movement, a door locks, or a patrol blocks the exit. This escape must differ from being caught before the theft.

Failed stealth creates a new challenge. It does not end the game.

## 4. Guard perception and security AI

No binary `detected` flag. Layered states:

`Unaware → Suspicious → Investigating → Searching → Identified → Alerted → Lost Target`

Detection inputs: distance, field of view, lighting/visibility, line of sight, player speed, noise, exposure time, distractions, cameras, reports from other guards.

Guards are **not omniscient**. They know only what they saw, heard, or were told. Examples to support: brief glimpse without identification; investigating a sound; finding an unconscious colleague; searching the last known position; passing information to nearby guards; losing the player and sweeping the area.

**Security levels (configurable, event-driven)**

| Level | Name | Effect |
|---|---|---|
| 0 | Normal | Regular patrols |
| 1 | Suspicion | Guards investigate |
| 2 | Local search | Limited-area search |
| 3 | Facility alert | Alarm; doors may change state |
| 4 | Full lockdown | Backup, blocked routes |
| 5 | External pursuit | Outside authorities informed |

## 5. Mission state and consequences

Track at least (names are examples): `playerDetected`, `deviceStolen`, `alarmTriggered`, `securityLevel`, `guardsAlerted`, `witnessCount`, `cameraRecordedPlayer`, `combatOccurred`, `escapeRouteBlocked`, `lastKnownPlayerPosition`, `vehicleStolen`, `policePursuitActive`.

| Player action | Consequence |
|---|---|
| Never detected | Delayed security response |
| Seen briefly | Local investigation |
| Seen clearly | Identification and alarm |
| Fight before theft | More guards alerted |
| Steal undetected | Delayed discovery |
| Alarm before theft | Harder lab access |
| Escape before alarm | Easier first escape |
| Vehicle identified | Stronger external pursuit |
| Lose pursuers | Temporary escape window |

Event-based and data-driven, so new branches can be added without rewriting code.

## 6. The device

Compact futuristic energy core: metal protective frame, glowing blue element, small moving internal parts, its own sound and light. Must read as important at a glance and stay recognisable during the escape.

Pickup cinematic: close-up, slow motion, mechanical unlock, blue light on the protagonist's hands, ambient sound drops, short musical transition.

## 7. Cinematic direction

Third-person follow camera, controlled moves, smooth transitions, slow-motion moments, environmental shake, strong composition, dynamic music. Depth of field only in cutscenes; motion blur only where it helps. **Gameplay readability and responsive control always come first.** All cinematics skippable.

## 8. Environments (one coherent desert world)

- **A. Research facility:** exterior, main entrance, security gate, guard posts, fences, cameras, security lights, corridors, lab, secure lab doors, control room, device display, emergency lighting, interior props.
- **B. Desert highway:** asphalt, barriers, terrain, rocks, dunes, signs, utility poles, lighting, dust and wind, distant landmarks.
- **C. Container yard:** several container types, stacks, the open container, warehouse, cranes, fencing, loading equipment, yard lights, road network.
- **D. Final escape zone:** highway, roadblocks, police vehicles, helicopter, emergency lighting, escape checkpoint, destructible elements.

## 9. Characters and vehicles

**Protagonist:** professional thief, distinctive clothing, face covering, realistic proportions, good rig.

Animations: idle, walk, run, sprint, turn, crouch, sneak, take cover, basic combat, hit reaction, door interaction, device pickup, mount/dismount motorcycle, enter/exit car. Blend between them.

**Also needed:** guards, police officers.

**Vehicles:** motorcycle, sports car, police patrol car, police SUV, police helicopter. Correct proportions, realistic materials, turning wheels, suspension, lights, damage feedback where feasible, smooth camera, responsive controls. Fictional designs only.

## 10. Art direction (proposal until approved)

Palette: charcoal/black, emergency red, energy blue, desert sunset, industrial grey. Realistic metal, glass, concrete, asphalt, fabric. Controlled contrast, atmospheric dust, strong environmental light.

Avoid: cartoon characters, generic low-quality assets, mixed art styles, oversaturation, wrong vehicle proportions, cheap props, effects that hurt clarity.

## 11. Assets

- Sources to check: Fab, Sketchfab, Poly Haven, Quixel Megascans (via Fab), other reputable libraries.
- Record for each: name, URL, author, licence, commercial use, modification rights, format, poly count, texture resolution, material quality, rig, animations, file size, optimisation needed, intended use.
- Runtime format: GLB/glTF. Evaluate Draco, Meshopt, KTX2/Basis, LODs, atlasing, instancing, shadow settings.
- Blender for fixes, assembly, material and rig checks, export.
- Every asset is tested in the real browser renderer before approval.

## 12. Technology (to evaluate, not assumed)

TypeScript, Three.js, Vite; React only for surrounding UI if useful; Rapier 3D for physics; Web Audio; a light state store if justified; optional Supabase for cloud saves and leaderboards later.

- **Renderer:** compare WebGL 2 against `WebGPURenderer` (which can fall back to WebGL 2). Do not assume every shader or effect works on both paths. Test both.
- **Physics:** character movement, collision, rigid bodies, motorcycle, car, vehicle collisions, police vehicles. Fun and responsive beats strictly realistic.
- **Modules:** game loop, scene manager, asset manager, renderer, camera, input, player controller, animation, interaction, stealth, guard AI, security system, mission state, combat, vehicles, police AI, world, audio, UI/HUD, save/load, performance monitor. Game state separate from presentation. Missions configured as data.

## 13. Performance

Quality profiles Low / Medium / High / Ultra, auto-selected from hardware with manual override. Tune render resolution, dynamic resolution, shadows, textures, LOD, draw calls, instancing, post-processing, AO, reflections, particles, view distance, memory, load time. Profile, do not guess. Do not fix performance by making everything look cheap. Do not promise the same quality on every device.

## 14. Controls and UI

- **Desktop:** keyboard and mouse, remappable where practical, clear hints.
- **Mobile (later):** virtual joystick, contextual buttons, driving controls, camera control, a HUD designed for touch, not a shrunken desktop one.
- **Main menu:** New Game, Continue, Settings, Credits, Quit/return. Atmospheric, with a strong title identity.

## 15. Audio

Desert ambience, wind, facility machinery, footsteps, guard voices, radio chatter, alarm, doors, device, motorcycle and car engines, tyres, sirens, helicopter, impacts, music. Adaptive music follows mission state: stealth, suspicion, detection, combat, theft, escape, pursuit, final escape. No unlicensed music.

## 16. References

- Agent skills: `gamedev-skills/awesome-gamedev-agent-skills` (verified: 79 skills, Node 22.20+, Apache-2.0). Install the smallest useful set, listed in the plan.
- Also look at, unverified: `bindaksu/gamedev-skills`, `abagames/agentic-gamedev-skills`.
- `th0mk/nfsu2-web`: study only, for WASM, WebGPU, AudioWorklet, worker architecture, browser limits. It recompiles an existing game; PROTOCOL is original Three.js work.
