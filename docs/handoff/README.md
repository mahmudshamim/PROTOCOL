# Handoff to Claude

Use this when the working agent cannot get past a problem.

## When to hand off

- The same problem is still failing after two real attempts.
- A decision needs deeper technical judgement: renderer choice, performance on 8 GB, shader or post-processing bugs, physics / vehicle handling, guard AI architecture, asset pipeline (rigging, export, compression).
- A result looks wrong and you cannot tell why.

Do **not** hand off decisions that belong to the owner (story, look, money). Ask the owner those directly.

## How

1. Create `docs/handoff/YYYY-MM-DD-short-title.md` from the template below.
2. Commit it.
3. Tell the owner: "Stuck. Open Claude in this folder and say: read `docs/handoff/<file>`."
4. Stop work on that task. Carry on with any task that does not depend on it.

## Template

```markdown
# <short title>

- Date:
- Plan step: (e.g. Step 3 — benchmark)
- Blocking: yes / no

## Goal
What you were trying to achieve, in one or two sentences.

## Problem
What happens instead. Paste the exact error text or describe the wrong result.

## Where
Files and line numbers involved. Command to reproduce.

## Tried
Each attempt and what it did. Include things you ruled out.

## Question for Claude
The one specific thing you need answered or fixed.

## Resolution
(Claude fills this in.)
```

Keep the note self-contained. Claude reads only this note and the files it names.
