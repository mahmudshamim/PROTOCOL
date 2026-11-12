# PROTOCOL

**ONE DEVICE. NO WAY BACK.**

A single-player, third-person browser action escape game prototype. The current build focuses on the opening experience: main menu → cinematic intro → device theft → alarm → on-foot escape → motorcycle handoff.

## Run locally

Requirements: Node.js and npm.

```bash
cd "/Users/mahmud/Documents/PROTOCOL"
npm install
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>. Run through the Vite server; opening `index.html` directly with a `file://` URL will not work correctly.

To create a production build:

```bash
npm run build
npm run preview
```

## Current build

### Implemented

- Main menu with New Game, Continue, Settings, Credits, and Quit entries.
- A 24-second, skippable opening scene with a sunset desert, research facility, search helicopters, sports car, and camera changes.
- A procedural tactical protagonist with a simple walking animation.
- A hand-built experimental device with a glass-like chamber, metal end caps, copper coils, glowing energy core, and electrical arcs.
- On-foot movement using WASD or the arrow keys; hold Shift to sprint.
- Press E to take the device. This starts the alarm and moves the objective to the exit.
- HUD with mission objective, security status, interaction prompt, minimap, and pause menu.
- Facility and emergency lighting built from procedural Three.js geometry.

### Not implemented yet

- The character and vehicles are original, shape-based prototype models. They are not photorealistic imported models.
- The intro depicts the car and protagonist, but the car is not yet driveable.
- The motorcycle stage is a handoff/prototype view; motorcycle handling is not complete.
- No real sound, music, or working audio controls yet.
- Police pursuit, traffic, container yard, vehicle switching, roadblocks, helicopter pursuit, and later missions are planned, not implemented.
- Settings are visual controls only at this stage; they do not yet change game audio or camera behavior.

## Controls

| Input | Action |
| --- | --- |
| Enter | Start from the main menu |
| WASD / Arrow keys | Move on foot |
| Shift | Sprint |
| E | Pick up the device |
| Escape | Pause / resume |
| Skip Intro button | Skip the opening cinematic |

Vehicle controls shown in the HUD are placeholders until the vehicle driving milestone is implemented.

## Project structure

```text
src/
  app/App.tsx                         React app and Three.js canvas
  game/
    cinematic/CinematicScene.tsx      Sunset opening scene and camera beats
    player/Player.tsx                 Player movement and follow camera
    player/TacticalCharacter.tsx      Procedural protagonist model/animation
    state/gameStore.ts                Shared game phase and mission state
    ui/Overlay.tsx                    Menu, intro captions, HUD, pause/settings
    world/World.tsx                   Facility, desert, and scene composition
    world/ExperimentalDevice.tsx      Experimental energy device model
  styles.css                          Menu, cinematic captions, and HUD styling
```

## Technology

- Vite, React, and TypeScript
- Three.js with React Three Fiber and Drei
- Zustand for shared game state
- Rapier is installed for future physics work; it is not currently used by the prototype.

## Build status

`npm run build` succeeds. Vite currently reports a large JavaScript bundle because the Three.js rendering dependencies are included in the first build; code splitting can be added as the game grows.
