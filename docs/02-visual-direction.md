# PROTOCOL — Visual Direction (short)

Status: **proposal, reviewed at Gate 2** together with the benchmark. Expanded into the full Visual Bible in Step 4.

## One line

A desert at the last minute of dusk: warm low sun outside, cold hard light inside, and one small blue thing that does not belong to either.

## Palette

| Role | Colour | Hex | Used for |
|---|---|---|---|
| Night base | Charcoal | `#15171A` | Shadows, asphalt, Wren's clothing, UI panels |
| Structure | Industrial grey | `#6E7379` | Concrete, steel, fencing |
| Land | Desert ochre | `#C8946A` | Sand, rock, dust |
| Sun | Dusk amber | `#FFA56B` | Key light outdoors, rim light on characters |
| Sky | Dusk violet | `#7D6A72` | Horizon haze and fog |
| Danger | Emergency red | `#FF3B30` | Alarm lighting, sirens, alert UI |
| The device | Lattice blue | `#38B6FF` | The device only, and things it lights |
| Safe | Signal green | `#7CFF9A` | "Unseen" UI state only |

Rules: blue is reserved for the device, so the player can always find it in a frame. Red appears only when something has gone wrong. Everything else stays desaturated.

## Lighting

- **Outdoors:** one low amber sun with long shadows, image-based sky light, thin violet fog that swallows the distance. Pools of warm sodium light under lamp posts; real darkness between them, because darkness is a gameplay tool.
- **Indoors:** cool white tubes, darker than outside, with the device as the brightest thing in the lab.
- **Alarm:** lamps and strips turn red and pulse; white interior light drops. The world should feel like it changed its mind about you.
- **Vehicles:** headlights and tail lights carry the scene once the sun is gone. Police red-and-blue is the only place blue is allowed besides the device.

## Materials

Rough concrete with formwork lines, brushed and painted steel, chain-link, dusty asphalt, wind-worn rock, matte fabric and webbing on Wren, painted metal on containers with rust at the edges. Nothing glossy except glass, the car, and the device cage. Dust on everything near the ground.

## Camera

- **On foot:** third person over the shoulder, about 5 m back, lower and closer when sneaking. Never cuts during play.
- **Driving:** low chase camera that pulls back and widens with speed; small shake on impacts only.
- **Cinematics:** wide establishing shot, then long lens close-ups. Letterbox bars mark that control is away. Slow motion only for the theft and one moment in the pursuit.
- Depth of field in cinematics only. Motion blur only at high vehicle speed.

## UI

Thin sans-serif, wide letter spacing, small caps labels. Corners of the screen only: objective top left, security level top right, a single detection bar top centre. Colour follows the palette states (green, amber, red). No minimap in the first version; Sable's voice and world lighting do the guiding.

## Effects

Dust kicked up by feet and tyres, heat-haze-like fog at distance, bloom on real light sources only, electrical flicker when the device leaves its cradle, tyre smoke and sparks in the pursuit.

## What the benchmark showed about this direction

See `docs/03-benchmark-report.md`. In short: the lighting model and scanned props hold up well in the browser. Flat walls, box containers and the stand-in character do not, and need real assets and more set dressing to reach this target.
