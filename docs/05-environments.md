# PROTOCOL — Environment Breakdown

Four environments, loaded one at a time. Sizes and counts are planning targets, to be confirmed against the budgets in `docs/03-benchmark-report.md`.

## A. Halden Research Station

Playable area about 120 × 90 m outdoors plus a 40 × 30 m building.

```
                 N
   +--------------------------------------------+   fence
   |              [ LAB ]  device               |
   |        +-----------------------+ side door |
   |        |  lab     |  control   |==         |
   |        |----------+   room     |           |
   |        |   main hall           |           |
   |        +--------[door]---------+           |
 hole  yard: containers, crates, lamps, vehicles|
 in ===                                         |
 fence     guard post                 generator |
   |                [ GATE ]  booth             |
   +----------------==    ==--------------------+
 bike                 road in
```

| Layer | Contents |
|---|---|
| Major | Main building (hall, control room, lab), perimeter fence, gate with booth and barrier arm, guard post, water tank, antenna mast |
| Secondary | 6–8 shipping containers, parked pickup and covered vehicles, generator shed, pipe runs, roof vents and AC units, lamp posts |
| Props | Crates, barrels, pallets, barriers, searchlights, cable reels, signage, bins, desks, server racks, lab benches, microscope, trolleys |
| Lighting | Dusk sun; four to six sodium lamps making lit pools; interior tubes; red alarm state; device blue |
| Materials | Formed concrete, polished concrete, asphalt, sand, galvanised and painted steel |
| VFX | Dust, lamp insects or haze, alarm strobes, device flicker |
| Audio | Wind, generator hum, fence rattle, footsteps by surface, radio chatter, tube buzz, siren |
| Interactive | Doors (main, side, lab, control room), fence cut, cameras ×6, control-room console, device cradle, throwable objects, hiding spots, bodies |

Routes in: gate (timed), west fence cut, service side door. Each must be usable at level 0 and at least one at level 4.

## B. Desert highway

A two-lane road about 3 km long, built from repeating 200 m segments streamed ahead of the bike.

| Layer | Contents |
|---|---|
| Major | Road, shoulders, a dry wash with a low bridge, one rock cut, distant mesas |
| Secondary | Utility poles and wires, crash barriers on bends, a closed barrier gate, an abandoned fuel stop |
| Props | Road signs, reflector posts, tyres, rocks, scrub, a wrecked car |
| Lighting | Blue hour; headlight; far glow of the facility behind and the yard ahead |
| VFX | Sand drifting across the road, dust trail, speed lines of reflector posts |
| Audio | Engine, wind rush, tyre on asphalt and on sand, Sable on the radio |
| Interactive | Sand drifts (grip loss), barrier gate (go round or through the gap), pursuing pickups at medium pursuit and above |

## C. Container yard

About 150 × 120 m. A grid of stacks forming lanes, some blocked.

```
   +------------------------------------------+
   | warehouse |  [][][]  [][][]  [][][]      |
   |           |  [][][]  [][][]  [][]X  <- the container
   |  office   |                              |
   |-----------+  [][][]   crane   [][][]     |
   |              [][][]  ======   [][][]     |
   |  gate ==                        exit ==  |
   +------------------------------------------+
```

| Layer | Contents |
|---|---|
| Major | Container stacks (1–3 high), gantry crane, warehouse with open bay, yard office, fence and two gates |
| Secondary | Reach stacker or forklift, flatbed trailers, light towers, fuel tank |
| Props | Pallets, straps, cones, barrels, tool carts, signage, wheel chocks |
| Lighting | Night; harsh white flood lights, deep shadow in the lanes |
| VFX | Light shafts in dust, sparks from a worker welding |
| Audio | Reversing beeper, metal creak, distant highway, radio in the office |
| Interactive | Two workers and one guard (same perception rules), crane cameras, the marked container and its door, the sports car |

Uses instancing heavily: a few container models in several colours make the whole yard.

## D. Final escape zone

The same highway kit as B, 5 km, wider, with more structure.

| Layer | Contents |
|---|---|
| Major | Four-lane section, an underpass, a canyon section, the handoff turn-off |
| Secondary | Roadblock sets, overhead sign gantries, a service area |
| Props | Cones, flares, spike strips, concrete barriers, wrecks |
| Lighting | Night; headlights, police red and blue, helicopter spotlight, flares |
| VFX | Tyre smoke, sparks, dust, light bars sweeping the fog |
| Audio | Engine, sirens with distance and direction, helicopter, police radio, music peak |
| Interactive | Roadblocks with a gap or weak point, underpass and canyon (break the helicopter's line of sight), destructible barriers and signs, the turn-off |

## Shared kit

Built once, used in all four: desert ground set, rocks and scrub, road pieces, fence, poles and lamps, barriers, containers, signage, dust effects.

## Continuity

One sky that darkens stage by stage, the same sand and rock everywhere, the facility's glow visible behind you on the highway and the yard's lights visible ahead.
