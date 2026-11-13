# PROTOCOL — Visual Bible

Expands `docs/02-visual-direction.md` (palette, lighting, camera and UI rules stay as written there) using what the benchmark showed. This file adds the rules an artist or agent needs to make or judge an asset.

## 1. The bar an asset must clear

The benchmark showed scanned props look real under our lighting and flat boxes do not. So:

- **Every surface needs a reason to catch light.** Bevelled edges, panel lines, bolts, dents. No perfectly sharp 90° corners on anything nearer than 30 m.
- **PBR only:** base colour, normal, roughness, metalness where needed. No baked-in lighting or shadows in the colour map.
- **Wear tells the story:** dust at the base, rust at edges and seams, scuffs at hand and boot height. Clean objects look fake in a desert.
- **Real-world scale**, in metres. A door is 2.1 m, a container 2.6 m high, Wren 1.78 m.
- **One art style.** Nothing low-poly, stylised or cartoon in the final game, however good it is on its own.

An asset is approved only after it has been seen in the benchmark scene next to the Poly Haven props. If it looks like it came from a different game, it is rejected.

## 2. Time of day by stage

| Stage | Sky | Key light | Mood |
|---|---|---|---|
| Arrival, infiltration | Last light of dusk | Low amber sun, long shadows | Calm, watchful |
| Inside the facility | n/a | Cool white tubes, device blue | Clinical, tense |
| Facility escape | Deep dusk | Sodium lamps, red if alarmed | Exposed |
| Motorcycle | Blue hour | Headlight, last glow on the horizon | Release, speed |
| Container yard | Night | Harsh white flood lights, hard shadows | Maze |
| Pursuit, final escape | Night | Headlights, police red and blue, helicopter spotlight | Chaos, then dark |

The sky gets darker each stage. By the end the only light is what vehicles carry.

## 3. Materials library

| Material | Where | Notes |
|---|---|---|
| Formed concrete | Facility walls, barriers | Formwork lines, tie holes, water stains under roof edges |
| Polished concrete | Interior floors | Slightly reflective, tyre and trolley marks |
| Asphalt | Yard apron, highway | Cracks, patches, faded paint lines, sand creeping in from edges |
| Desert ground | Everywhere outside | Sand with gravel patches and scattered stones; never one flat texture |
| Painted steel | Containers, doors, cranes | Chipped paint, rust bloom at seams, stencilled codes |
| Galvanised steel | Fence, poles, pipes | Dull, spangled, dusty |
| Glass | Lab windows, vehicles | The only clean reflective surface in the facility |
| Fabric and webbing | Wren, guards | Matte, visible weave close up |
| Vehicle paint | Sports car | Deep gloss: the one "expensive" surface, on purpose |
| Device cage | LATTICE | Brushed metal, precise, no wear at all |

## 4. Characters

- **Wren:** slim athletic build, dark charcoal layered clothing, soft hood, lower-face mask, gloves, small chest rig. No visible logos. Silhouette must read against both sand and concrete: slightly lighter than black, with an amber rim light outdoors.
- **Guards:** grey-blue uniform, plate carrier, cap or helmet, sidearm and radio on the chest. Bulkier silhouette than Wren. A chest light that shows awareness state can be considered later as a readability aid.
- **Police:** dark navy, hi-vis details, generic insignia. No real agency names.
- **Yard workers:** hi-vis vests, hard hats.

Faces are mostly covered or seen at distance by design. This is how the game stays inside what browser characters can do well.

## 5. Vehicles

- All fictional. No real maker's badge, grille or light signature. Names come from our own fiction.
- **Motorcycle:** matte dark dual-sport, practical not flashy, one round headlight.
- **Sports car:** low, wide, deep red or gunmetal, the most reflective object in the game. Reveal it under hard container-yard light.
- **Police:** white and dark with a light bar; the SUV visibly heavier than the patrol car.
- **Helicopter:** dark, seen mostly as a silhouette behind its own spotlight.

## 6. Effects

| Effect | Rule |
|---|---|
| Bloom | Real emitters only: lamps, device, sirens, headlights |
| Fog | Always on outdoors; thicker at night, lit by headlights |
| Dust | Feet, tyres, helicopter downwash |
| Ambient occlusion | Wanted; add when measured to fit the budget |
| Depth of field, slow motion | Cinematics only |
| Screen shake | Impacts only, small |
| Film grain, vignette | Very light, optional, off on Low |

## 7. UI and type

As in the visual direction: thin sans-serif, wide tracking, corner placement, palette-driven state colours. The title PROTOCOL is set in ultra-light capitals with very wide spacing. Menus sit over a slow live camera move of the facility, not a still image.

## 8. What changes after the benchmark

- Buildings will be assembled from modelled kit pieces, not textured boxes.
- Set dressing density roughly triples compared with the benchmark scene.
- Humans and vehicles get their own test before any is approved (see catalogue).
