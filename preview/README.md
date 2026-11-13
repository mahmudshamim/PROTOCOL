# PROTOCOL — preview slice

A throwaway playable demo the owner asked for, to judge mood and the stealth loop early.
It is **not** the production codebase and **not** the Step 3 benchmark. Do not build the game on top of it.

## Run

```bash
cd preview
npm install
npm run dev
```

Open the printed URL in Chrome.

## What it shows

Start outside the gate → get into the facility → steal the device → reach the motorcycle beyond the west fence.

- Guards have a vision cone and an awareness meter (distance, light, movement, angle). Sprinting makes noise.
- A guard who identifies you needs about 2.5 s to radio it in. Take him down first (F) and the alarm never goes out.
- Alarm before the theft seals the main door; the east side door still works.
- Steal quietly and the lab guard notices the empty pedestal 35 s later, unless he is down.
- The ending screen (Ghost / Shadow / Hunted) depends on what happened.

Controls: WASD move, mouse look, Shift sprint, C sneak, E interact, F takedown, R restart.

## What is placeholder

- Character: `Soldier.glb` from the three.js examples (a Mixamo character). Stand-in only, not a final asset.
- Building, containers, motorcycle, mesas: simple shapes.
- Sound: generated tones, no audio files.
- Sky and ground/concrete textures: Poly Haven, CC0 (`qwantani_dusk_2`, `sand_01`, `concrete_wall_008`, `concrete_floor_02`).

Guards steer with a hand-placed node list, no navmesh, so they can get stuck on corners.
