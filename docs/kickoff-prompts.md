# Kickoff prompts

Copy one prompt at a time into the coding agent, opened in this folder. Move to the next only after the gate is approved.

## Start (Step 0 + Step 1)

```
Read AGENTS.md, then the docs it lists, in order. Follow every rule in AGENTS.md.
Do Step 0 of docs/01-plan.md. Then ask me the open Step 1 questions from docs/decisions.md,
wait for my answers, and write docs/01-gdd.md as Step 1 describes.
Write no code. Stop at Gate 1 and wait for my approval.
```

## After Gate 1 (Step 2 + Step 3)

```
Gate 1 is approved. Log it in docs/decisions.md and update Current status in AGENTS.md.
Do Step 2, then Step 3 of docs/01-plan.md. Read docs/tech-notes.md sections 4 and 5 first.
Ask me before installing anything or spending money or credits.
Only benchmark code is allowed, inside benchmark/. Stop at Gate 2.
```

## After Gate 2 (Step 4 + Step 5)

```
Gate 2 is approved. Log it, including the renderer and framework decisions, and update AGENTS.md.
Do Step 4, then Step 5 of docs/01-plan.md. Only list assets whose pages you opened and whose
licence you checked. Ask me before any spend. Stop at Gate 3.
```

## After Gate 3 (Step 6)

```
Gate 3 is approved. Log it and update AGENTS.md.
Do Step 6 of docs/01-plan.md. Use docs/tech-notes.md for the architecture. Stop at Gate 4.
```

## After Gate 4 (production)

```
Gate 4 is approved. Log it and update AGENTS.md. Do Step 0 of docs/01-plan.md if it is not done.
Build Milestone 0 from docs/08-roadmap.md only, in a new game/ folder. Follow docs/tech-notes.md
sections 1 to 3: simulation separate from rendering, typed events, missions as data, tests.
Ask me before installing anything. Commit often. Stop when Milestone 0 meets its definition of done.
```

For each later milestone:

```
Milestone N is approved. Log it and update AGENTS.md.
Build Milestone N+1 from docs/08-roadmap.md only. Greybox first, art after. Stop at its definition of done.
```

## When the agent is stuck

```
You are stuck. Follow docs/handoff/README.md: write the handoff note, commit it, and tell me the file name.
```

Then open Claude in this folder and say: `read docs/handoff/<file name>`.
