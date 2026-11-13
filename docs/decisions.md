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

## Open decisions (owner must answer)

| Needed by | Question |
|---|---|
| Step 1 | Combat: lethal or non-lethal? Melee, firearms, or both? |
| Step 1 | Does the player get checkpoints / saves inside the mission, or restart on failure? |
| Step 3 | WebGL 2 or WebGPU renderer (decided from benchmark numbers). |
| Step 3 | Vanilla Three.js or React Three Fiber for the game (decided from benchmark). |
| Step 5 | Budget ceiling for paid assets and AI generation credits. |
