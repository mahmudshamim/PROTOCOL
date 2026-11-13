# PROTOCOL — Characters and Vehicles

Visual rules are in `docs/04-visual-bible.md` §4–5. This file lists what must exist.

## Characters

| Character | Count on screen | Triangle budget | Notes |
|---|---|---|---|
| Wren (protagonist) | 1 | 30–50 k | Hero asset. One 2K texture set. |
| Facility guard | up to 8 | 15–20 k | One body, 2–3 head and gear variants, shared textures |
| Response squad | 3 | same model | Helmet variant |
| Police officer | 2–4, mostly in cutscenes and at roadblocks | 15–20 k | Can reuse the guard body with new textures |
| Yard worker | 2 | 10–15 k | Hi-vis variant |

All humans share **one skeleton standard** so every animation works on every character.

## Animation list

Status: **A** = usually available as a stock clip, **C** = must be custom-made or commissioned.

### Wren

| Animation | Status | Notes |
|---|---|---|
| Idle, idle look-around | A | |
| Walk, run, sprint | A | |
| Turn in place, start, stop | A | |
| Crouch idle, crouch walk (sneak) | A | |
| Take cover, peek left and right | A / C | Stock cover sets exist; quality varies |
| Silent takedown (two-person) | C | Paired with guard reaction |
| Struggle exchange (two-person) | C | 2–3 beats, win and lose endings |
| Hit reaction, stagger, shot reaction | A | |
| Captured / surrender | A | |
| Drag body | C | Paired with a limp guard |
| Pick up and throw object | A | |
| Open door, use console, cut fence | A / C | Generic "interact" clips can cover these at first |
| Pick up the device | C | Cinematic, hero moment |
| Mount, ride, dismount motorcycle | C | Riding pose plus lean left and right |
| Enter, drive, exit car | C | Entry is cinematic; driving is a seated pose |

### Guards and police

| Animation | Status |
|---|---|
| Idle, idle with radio, look around | A |
| Walk patrol, run, sprint | A |
| Aim, fire, reload | A |
| Suspicious turn, investigate walk, search sweep | A / C |
| Radio call | A |
| Grab (capture) | C, paired |
| Takedown victim, struggle partner | C, paired |
| Unconscious, dragged | C |
| Hit reaction | A |

### Yard workers

Idle, walk, work loop (clipboard, welding), startled, run away. All A.

**Custom total:** about 12 clips, most of them two-person. These are the animation budget's real cost and should be scoped before milestone 1.

## Vehicles

| Vehicle | Triangle budget | Must have |
|---|---|---|
| Motorcycle | 40–60 k | Separate wheels, steering fork, suspension travel, headlight and tail light, rider seat position |
| Sports car | 80–100 k | Separate wheels, steering, working lights, doors that open (driver side at least), simple interior, damage states ×3 |
| Police patrol car | 20–30 k | Separate wheels, light bar, two damage states |
| Police SUV | 25–35 k | Same |
| Police helicopter | 20–30 k | Spinning main and tail rotor, spotlight mount |
| Station pickup | 20–30 k | Appears at the facility and on the highway |
| Parked dressing (covered cars, trailers, forklift) | 5–15 k each | Static |

Rules: fictional designs, no real badges; wheels as separate objects so they can spin and steer; a consistent scale; an LOD pair for anything that appears in numbers.

## What is missing today

- **Wren:** no usable model found. Custom production.
- **Realistic guard:** candidates found, none inspected yet.
- **All paired animations:** custom.
- **Helicopter in fictional police livery:** only a real-brand model found; needs repaint or custom.
- **Vehicles:** candidates found for bike, car, patrol car and SUV; none inspected or tested yet.

See `docs/07-asset-catalogue.md`.
