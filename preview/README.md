# PROTOCOL — preview

**Play it:** https://protocolgame.vercel.app

A playable, start-to-finish version of the planned game with placeholder 3D. Built to judge story, flow and feel before real assets are made in Blender. It is **not** the production codebase (`game/` is).

## Run

```bash
cd preview
npm install
npm run dev -- --port 5199
```

Open http://localhost:5199 in Chrome. On a phone, open the same address from your computer's network IP (`npm run dev -- --host --port 5199`) and hold the phone sideways.

## The night, in order

1. **Halden Research Station** (dusk, on foot): get in, take the device from the lab, reach the motorcycle beyond the west fence.
2. **Desert highway** (blue hour, motorcycle): 2.4 km to the container yard. Rocks, sand drifts, a barrier gate. If the station saw the bike leave, two pickups chase you.
3. **Container yard** (night, on foot): find container HLX-7 in the north-east row and take the car. If the police were told, they arrive at the gate after 75 s.
4. **Pursuit** (night, sports car): lose the police, then take an exit. Exits only open when nobody is on you. Underpasses and canyons hide you from the helicopter.
5. **Ending**: Ghost / Shadow / Hunted, plus Wreck if the car is badly damaged.

What you do in the station decides how hard the rest is (GDD section 6): no alarm → no pursuit; alarm only → light; alarm plus your description or the bike seen → medium; both, or the device taken during an alarm → heavy, with roadblocks and a helicopter.

## Controls

| | Desktop | Phone |
|---|---|---|
| Move / steer | WASD | left thumb |
| Look | mouse | right thumb drag |
| Sprint / sneak | Shift / C | RUN / SNEAK |
| Interact / takedown / throw stone | E / F / G | ACT / GRAB / THROW |
| Handbrake | Space | BRAKE / DRIFT |
| Pause | Esc | II |
| Retry checkpoint / restart (after a fail) | R / Enter | buttons |

Checkpoints: start of each stage, and right after the theft.

## Stealth rules in the station and the yard

- Guards fill an awareness meter from distance, light, movement and angle. Sprinting is loud.
- A guard who identifies you takes 2.5 s to radio it in. Take him down first and the alarm never goes out.
- Cameras sweep. If one sees you, the control room calls it in after 3 s, unless the control room guard is down.
- Guards are armed: once they chase you they shoot. Three hits and you are down.
- Throw a stone to send guards to look somewhere else (3 per mission).
- A guard who finds an unconscious colleague radios it in.

## Quality

Desktop keeps the full look: bloom, soft 2048 shadows, 1.5× resolution. Phones switch to a low profile automatically (no bloom, 1024 shadows, 1× resolution). Force either with `?q=high` or `?q=low`.

## Testing shortcuts

`?stage=facility|highway|yard|pursuit` jumps to a stage. Extra flags: `alarm`, `id`, `bike`, `stolen` set mission state; `pursuit=none|light|medium|heavy` forces pursuit strength; `drive` turns on an autopilot for the vehicle stages; `sim=N` runs N seconds of simulation before the first frame; `log` prints state to the console; `at=x,z` starts the facility on foot elsewhere; `touch` shows phone controls on desktop.

## Placeholder content

- Character: `Soldier.glb` from the three.js examples (Mixamo). Stand-in only.
- Buildings, containers, all vehicles, mesas: simple shapes.
- Sky and ground/concrete textures, and the crate, barrel, generator, barrier, boulder, covered car and searchlight models: Poly Haven, CC0.
- Sound: generated tones and noise, no audio files.

## Code

```
src/core.js       renderer, sky, assets, collision world, characters
src/state.js      mission state, checkpoints, pursuit strength, outcome
src/input.js      keyboard, mouse, touch joystick and buttons
src/hud.js        HUD, waypoint marker, fades, end screens
src/audio.js      generated sound
src/stealth.js    guards, cameras, perception, alarms
src/onfoot.js     on-foot player and camera
src/vehicles.js   vehicle models and arcade driving
src/road.js       streamed desert highway
src/stages/       facility, highway, yard, pursuit
src/main.js       stage flow, menu, pause, endings
```
