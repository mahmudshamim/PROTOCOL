# PROTOCOL — Agent Instructions

You are working on **PROTOCOL**, an original cinematic third-person stealth / heist / vehicle-escape game that runs in the browser. Read this file first, then the docs in the order below.

## Read order

1. `docs/00-project-brief.md` — what the game is. The design source of truth.
2. `docs/01-plan.md` — the steps, in order, with the deliverable for each.
3. `docs/decisions.md` — what the owner has already decided. Do not reopen these.
4. `docs/tech-notes.md` — architecture, guard AI, renderer pitfalls, performance budgets. Read before the benchmark and before any game code.
5. `docs/handoff/README.md` — what to do when you are stuck.

## Current status

- Repo is empty on purpose. The old prototype was deleted (still in git history, commit `5e64ae6`, do not restore it).
- Next task: **Step 0, then Step 1** in `docs/01-plan.md`.
- Update this section whenever a step is finished or a gate is passed.

## Hard rules

1. **No gameplay code until Gate 4 is approved.** The only code allowed before that is the visual benchmark in `benchmark/` (Step 3).
2. Work one step at a time. Stop at every gate and wait for the owner's explicit approval. Log each approval in `docs/decisions.md`.
3. Keep the full scope: facility, motorcycle, container yard, sports car, police pursuit, final escape. Do not turn it into a generic racing game. Do not drop stealth or branching.
4. Never force one fixed mission path. Player actions must change gameplay, not only dialogue.
5. Assets: quality first. Use an asset only if you opened its page and checked its licence. Never invent links, prices, licences or compatibility. No assets from existing games. No real car brands or logos.
6. Placeholder shapes are fine in the benchmark only if labelled as placeholders. They are never final assets.
7. Never call concept art game footage. Never hide a technical limit; report it with alternatives.
8. Anything that costs money or account credits (paid assets, AI generation): show the estimate and ask first.
9. Do not add a library without a stated reason.
10. Explain technical choices in beginner-friendly language. When recommending, compare the alternatives.
11. If a major decision is missing, ask the owner one focused question. Do not assume.
12. Commit after each finished deliverable with a clear message.

## Owner and machine

- Owner replies in Bangla / Banglish; write docs in English, keep chat replies short.
- MacBook Air M1, **8 GB RAM**, Node 26, Chrome only. Blender and `gltf-transform` are not installed; ask before installing.
- 8 GB is the main performance constraint. Budget textures and loaded world size around it.

## When you are stuck

Do not guess and do not lower quality silently. Follow `docs/handoff/README.md`: write a handoff note and tell the owner to bring it to Claude.
