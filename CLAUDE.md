# PROTOCOL — Claude's role

Project rules live in `AGENTS.md`. Read it first; everything there applies here too.

Claude is **not** the main builder on this project. Another coding agent does the day-to-day work. Claude is called in only when that agent is stuck.

When called:

1. Read the newest note in `docs/handoff/` (and `AGENTS.md` → Current status). Do not re-read the whole repo.
2. Solve only the problem in that note. Do not continue into the next step of the plan.
3. Write the outcome into the same note under `## Resolution`: what was wrong, what changed, what the other agent should do next.
4. Keep replies short. The owner has a limited token budget here.
