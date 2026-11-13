# Decision log

Approved by the owner. Do not reopen without asking. Add new rows at the bottom.

| Date | Decision | Notes |
|---|---|---|
| 2026-11-12 | Scope is the **full chain**: facility → motorcycle → container yard → sports car → police pursuit → final escape. | Planned as one game, built in milestone order (see plan Step 6). |
| 2026-11-12 | Assets: **quality first**. Licensed assets where good ones exist, custom-made otherwise. | Any spend (paid asset, AI generation credits) needs approval first. |
| 2026-11-12 | Visual benchmark runs **early**, straight after the GDD and a short visual direction. | Replaces "Phase 7" in the original prompt. |
| 2026-11-12 | Old React Three Fiber prototype **deleted**. Start clean. | Recoverable from git commit `5e64ae6`; do not restore. |
| 2026-11-12 | Main work is done by another coding agent. Claude is used only for handoffs. | See `docs/handoff/README.md`. |
| 2026-11-12 | NFS Underground 2 web port is an architecture reference only. | No code, assets or branding from it. |
| 2026-11-13 | Owner asked Claude for a small playable **preview slice** in `preview/` before Gate 1. | Throwaway demo with placeholder models. Not the benchmark, not a base for production code. The no-gameplay-code rule still applies everywhere else. |
| 2026-11-13 | polyfork.dev low-poly models: allowed for greybox and placeholders only, never final assets. | Check each model's licence page first. |
| 2026-11-13 | Combat: **non-lethal melee only**. No firearm for the player; guards are armed. | A non-lethal gadget may be added later. |
| 2026-11-13 | **Checkpoints** at major moments, storing full mission state. | List in `docs/01-gdd.md` §9. |
| 2026-11-13 | **Gate 1 approved**: `docs/01-gdd.md`. | Owner said to proceed. |
| 2026-11-13 | **Gate 2 approved**: renderer `WebGPURenderer` with WebGL 2 fallback; vanilla Three.js; High 1080p / Low 720p profiles. | Owner said to proceed. See `docs/03-benchmark-report.md`. |

## Open decisions (owner must answer)

| Needed by | Question |
|---|---|
| Gate 3 | Approve `docs/07-asset-catalogue.md`; give permission to install Blender and gltf-transform. |
| Step 5 | Budget ceiling for paid assets and AI generation credits. |
