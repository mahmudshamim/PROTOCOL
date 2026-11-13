# PROTOCOL — Asset Catalogue and Pipeline

Status: **waiting for Gate 3 approval.** Researched 2026-11-13.

## How to read this

**What was checked.** Every row below came back from the source's own API on the research date: the asset exists, is downloadable, and carries the licence shown. Poly Haven rows are CC0 by site policy.

**What was not checked.** For Sketchfab rows nobody has yet opened the model to look at it, checked texture resolution, rig quality or file size, or confirmed the uploader actually owns it. Free uploads on Sketchfab are sometimes copied from commercial games; a CC-BY label does not make those legal to use. That provenance check is part of testing.

**Status values:** `In use` (already loaded in the benchmark) · `Candidate` (looks suitable on paper, untested) · `Needs work` (usable only after changes) · `Custom` (nothing suitable found) · `Rejected`.

**Licences:** CC0 = no conditions. CC-BY 4.0 = free for commercial use and modification, with credit to the author in the game's credits.

## 1. Sky and textures — Poly Haven, CC0

| Asset | Type | Use | Status |
|---|---|---|---|
| `qwantani_dusk_2` | HDRI | Facility dusk sky | In use |
| `aarfontein_dusk` | HDRI | Alternative dusk | Candidate |
| `dikhololo_night`, `clarens_night_01` | HDRI | Yard and pursuit night sky | Candidate |
| `sand_01`, `red_sand`, `gravelly_sand` | Texture | Desert ground blend | `sand_01` in use |
| `concrete_wall_008`, `precast_concrete_wall`, `ribbed_concrete_wall` | Texture | Facility walls | `008` in use |
| `concrete_floor_02`, `hangar_concrete_floor`, `concrete_floor_worn_001` | Texture | Interior and warehouse floors | `02` in use |
| `asphalt_02`, `road_damaged`, `aerial_asphalt_01` | Texture | Yard apron, highway | Candidate |
| `container_side`, `corrugated_iron`, `painted_metal_shutter` | Texture | Containers, sheds, roller doors | Candidate |
| `metal_plate`, `green_metal_rust`, `metal_grate_rusty` | Texture | Steel, walkways, wear | Candidate |

Source: https://polyhaven.com (API: `api.polyhaven.com`).

## 2. Environment props — Poly Haven, CC0

| Asset | Triangles | Use | Status |
|---|---|---|---|
| `concrete_road_barrier_02` | 42 k | Gate, roadblocks | In use; needs LOD |
| `Barrel_01` | 2.7 k | Yard dressing | In use |
| `old_military_crate` | 10 k | Yard, lab stores | In use |
| `portable_generator` | 26 k | Facility | In use |
| `namaqualand_boulders_01` | 77 k | Desert rocks | In use; needs LOD |
| `covered_car` | 13 k | Parked dressing | In use |
| `portable_searchlight` | 19 k | Gate, yard | In use |
| `modular_chainlink_fence` | 89 k | Perimeter fence | Candidate; replace the flat fence |
| `modular_electricity_poles` | 201 k | Highway poles | Candidate; needs LOD |
| `modular_industrial_pipes_01` | 12 k | Facility pipe runs | Candidate |
| `flood_lights` | 77 k | Container yard lighting | Candidate; needs LOD |
| `mounted_fluorescent_lights` | 18 k | Interior tubes | Candidate |
| `industrial_microscope`, `metal_office_desk`, `industrial_storage_cart` | 7–19 k | Lab, control room | Candidate |
| `hand_truck`, `plastic_crate_01`–`03`, `propane_tank`, `portable_welding_cart` | 4–29 k | Yard and warehouse dressing | Candidate |
| `namaqualand_boulder_02`–`06`, `namaqualand_rocks_01` | 110–205 k | Desert rocks | Candidate; must be decimated |

## 3. Vehicles and structures — Sketchfab

| Use | Asset | Author | Licence | Faces | Link | Status |
|---|---|---|---|---|---|---|
| Motorcycle | Cyberpunk Bike Concept Design | Berk Gedik | CC-BY | 83 k | [open](https://sketchfab.com/3d-models/none-99290272e69d4cd8a56af2d2e1274e0d) | Candidate; may be too sci-fi |
| Motorcycle | Scifi Motorcycle Project_MX | JonnyMANSON | CC-BY | 306 k | [open](https://sketchfab.com/3d-models/none-689d42690adf436fa781aee367d533e3) | Needs work: heavy decimation |
| Sports car | Fictional supercar – V12 Goblin | ollitei | CC-BY | 87 k | [open](https://sketchfab.com/3d-models/none-0a20e49ad5774d778567cb5c3f345786) | Candidate; best fit on paper |
| Sports car | Patriot P10-XR | Swiss_Fox | CC-BY | 72 k | [open](https://sketchfab.com/3d-models/none-d87ddc3e30134ff2990d8ee4d2586bdd) | Candidate |
| Sports car | Tokii Abyss GT.7 V12 | Glas'kavin | CC-BY | 158 k | [open](https://sketchfab.com/3d-models/none-c399568541104e0e903cf138b1e24908) | Needs work: decimation |
| Police car | Fairheaven LT '80 Cop Cruiser | Daniel Zhabotinsky | CC-BY | 20 k | [open](https://sketchfab.com/3d-models/none-61766c1e6e1e4b2b803c174f33433a74) | Candidate; labelled low poly, check it matches the style |
| Police car | Generic civil service vehicles pack | Comrade1280 | CC-BY | 93 k | [open](https://sketchfab.com/3d-models/none-8ff2a13f30914932a70c7950cfa58465) | Candidate |
| Police SUV | Lowpoly Generic SUV Police | mk2design | CC-BY | 9 k | [open](https://sketchfab.com/3d-models/none-259fc16c23d548ba8d5802c563d8ebdc) | Candidate; likely too simple up close |
| Helicopter | Eurocopter ec135 Politia – High-poly | solid3DDD | CC-BY | 200 k | [open](https://sketchfab.com/3d-models/none-02373bff3f7f48bf8649805455fe4260) | Needs work: real aircraft and real livery, repaint and decimate, or go custom |
| Container | Classic Shipping Container (Free/Gameready) | Sebastian Webster | CC-BY | 17 k | [open](https://sketchfab.com/3d-models/none-772f4be391a245f699c54e6cf157c58d) | Candidate; test first, it replaces the box placeholders |
| Crane | Gantry crane | Randonavt | CC-BY | 23 k | [open](https://sketchfab.com/3d-models/none-de8c4164d41742b395f78c20231d18b8) | Candidate |
| Crane | Bridge gantry crane | Potato_Mine | CC-BY | 15 k | [open](https://sketchfab.com/3d-models/none-b50fabdcf2ff4f1eac82c891fe8127e6) | Candidate |
| Forklift | Forklift | alban | CC-BY | 173 k | [open](https://sketchfab.com/3d-models/none-e79f0768aec6431d8e6f3874e5acc5f2) | Needs work: decimation |
| Warehouse | Warehouse FBX Model Free | Nicholas-3D | CC-BY | 11 k | [open](https://sketchfab.com/3d-models/none-daa7fd3ff88945298d00045ca40a4c03) | Candidate |
| Lab interior | Location underground laboratory | bazz4r | CC-BY | 224 k | [open](https://sketchfab.com/3d-models/none-7f70eebd1f044277b91c197fb17c513e) | Candidate as a parts source |
| CCTV | Security Camera (with Animations & Textures) | TampaJoey | CC-BY | 6.7 k | [open](https://sketchfab.com/3d-models/none-631834aba23f43a482e4de7120d68d19) | Candidate; has a sweep animation |
| CCTV | CCTV Camera | Smoggybeard | CC-BY | 3.2 k | [open](https://sketchfab.com/3d-models/none-e69d5eb37ffb4f188e4d3c84a5d79cdc) | Candidate |

Rejected while searching: real-brand cars (Lamborghini, Tesla, Jeep, Ford, Harley-Davidson) and anything tagged low-poly city or PSX style.

## 4. Characters

| Use | Asset | Author | Licence | Faces | Link | Status |
|---|---|---|---|---|---|---|
| Guard | Security Guard – Rigged 3D Model | Q.SARDOR | CC-BY | 13 k | [open](https://sketchfab.com/3d-models/none-1e3307732bbf4453b30f021bfec5bcaf) | Candidate; rigged, one animation |
| Guard / squad | S.W.A.T. Operator | SpatialNeglect | CC-BY | 107 k | [open](https://sketchfab.com/3d-models/none-9e82fabf26194896b5ad4a364d864eab) | Needs work: decimation; **provenance must be checked first** |
| Guard / squad | FSB Operator | SpatialNeglect | CC-BY | 114 k | [open](https://sketchfab.com/3d-models/none-43a561e941704eefb1ab0614be4f0049) | Same |
| Wren | — | — | — | — | — | **Custom.** No suitable licensed model found. |
| Police officer | — | — | — | — | — | Custom or retexture of the approved guard |
| Yard worker | — | — | — | — | — | Not searched yet |
| Stand-in | `Soldier.glb` (three.js sample) | — | — | — | — | Placeholder only. Never ships. |

**Animations.** Mixamo (Adobe) is the usual free source of stock locomotion, crouch, cover and reaction clips, and its rig is the practical skeleton standard. It needs an Adobe login, so its licence terms and clip list were **not verified in this research**; confirm both before relying on it. The roughly 12 paired and vehicle clips in `docs/06-characters-vehicles.md` are custom regardless.

## 5. Audio

Not researched yet. Needed before milestone 5. Sources to check then: Freesound (filter to CC0), Sonniss GDC bundles, Pixabay. No music or effect is approved until its licence is recorded here.

## 6. Custom production list

| Asset | Why custom | Suggested route |
|---|---|---|
| Wren | Nothing suitable; hero asset | AI generation → manual cleanup, or commission |
| Facility building kit (walls, door frames, roof details) | Boxes failed the benchmark | Model in Blender from Poly Haven textures |
| LATTICE device and cradle | Unique story object | Model in Blender; small and hard-surface, well suited to hand modelling |
| Police helicopter, fictional livery | Only a real-brand model found | Repaint the candidate, or generate |
| Paired and vehicle animations | Do not exist as stock | Hand-key in Blender, or commission |
| Road and highway kit | Simple, must tile exactly | Model in Blender |

## 7. Pipeline

For every asset, in this order:

1. **Record** it here with source, author, licence.
2. **Provenance check** for anything not CC0: look at the author's other uploads and the description. If it looks lifted from a game, reject.
3. **Import to Blender:** fix scale to metres, origin at ground centre, apply transforms, remove hidden geometry, check normals.
4. **Budget pass:** decimate or retopologise to the triangle budget; make one LOD for anything used in numbers; merge materials where possible.
5. **Rig check** (characters): retarget to the project skeleton, test walk and crouch for deformation problems.
6. **Export GLB**, then `gltf-transform`: Meshopt geometry compression, KTX2 textures (UASTC for normals, ETC1S for colour), resize to budget.
7. **Scene test:** load in the benchmark scene beside the Poly Haven props. Check look, scale, frame time.
8. **Status update** here: approved or rejected, with the measured triangle count and file size.

### Custom assets by AI generation

AI 3D generation → auto-rig → Blender cleanup → steps 4–8 above.

- It costs account credits. Show the estimate and get approval before each batch.
- Expect good results for rocks, props and rough clothing; weak results for hard-surface vehicles, faces and hands. Wren's covered face helps.
- If a generated asset fails step 7, say so and propose a paid asset or a commission.

### Tools to install (needs the owner's permission)

- **Blender**, used headless through Python scripts.
- **`@gltf-transform/cli`** for compression.

Neither is installed yet.

### Environment assembly

- Each stage is a Blender scene used for layout only. It exports **placements** (which asset, where, rotation, scale) as data, plus a simplified collision mesh and the navmesh source.
- Assets are separate GLB files loaded once and instanced from the placement data. A container used 40 times is one download and one draw batch.
- Each stage is split into zones; far zones swap to LODs or unload.
- Lighting is real-time plus baked ambient occlusion per static asset.

## 8. Cost so far and what is open

- Spent: nothing. All assets in use are CC0.
- Open decision: a budget ceiling for paid assets, AI generation and any commissioned animation. The custom list in §6 cannot move without it.

## 9. Credits owed

If any CC-BY asset above ships, its author and licence go in the in-game credits. Keep this file as the source for that list.
