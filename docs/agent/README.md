# docs/agent — the operating memory

This directory is PrivacyFold's memory. Chat history is not memory. When a session ends, the knowledge must have landed in one of these files or it is lost.

## Read order for any agent

| Step | File | Purpose |
|---|---|---|
| 1 | `node scripts/agent-status.mjs` (repo root) | 40 lines of re-derived truth, exit 1 on blockers |
| 2 | `STATE.md` | hand-checked truth: what works, what's fake, open questions |
| 3 | `TASKS.md` | the board with stable IDs (`PF-###`) — never relabel work, use real IDs |
| 4 | `DECISIONS.md` | *why* the big choices were made (append-only, supersedes pattern) |
| 5 | `CLAIMS.md` | every user/agent-facing promise and whether it is true — **check before touching copy** |
| 6 | `LOG.md` | dated one-per-session entries; newest at top |
| — | `SNAPSHOT.txt` | regenerated output of agent-status; cite it in LOG entries |
| — | `AUDIT-2026-11-10.md` | the full pre-deployment audit (evidence for most of STATE) |

## Writing rules (why this format)

Learned from what works on large repos (AGENTS.md convention, ADR practice, lab-notebook style):

- **Dated, append-only LOG.** Newest at top. Each entry ≤ 15 lines: did / proved / blockers / next. Prose journals rot; these are greppable.
- **STATE is a living table, not prose.** If a claim can't cite how it was verified, it's an *open question*, not a fact.
- **TASKS with immutable IDs.** Agents across different tools and days must be able to say "PF-005 done" and have it mean the same thing. Never rename, never renumber.
- **DECISIONS are append-only.** Never edit a past decision; add `DEC-### (supersedes DEC-###)` with the new evidence. This is how the project survives its own rethinks (e.g. Astro over Next).
- **CLAIMS ledger is the honesty gate.** The 2026-11-10 audit found tools fabricating output. From now on the ledger is checked before any public copy changes; statuses move only with evidence.

## Token discipline (how this system saves context)

- Run the **status script first** — it answers ~80% of "what's the current state" without reading source.
- Read `STATES`'s two tables (works / broken) before opening any tool code.
- Use `LOG.md` only for the last ~10 entries; everything older is summary-committed in `DONE` rows of TASKS.
- Explore `src/` only for the task at hand; `app-runtime.js` is 4.4k lines — grep for the tool id instead of reading sequentially.
- When a session produces knowledge (a pitfall, a command, a decision), it goes in **this directory**, not:

  - a memory-tool note (user-personal, wrong home),
  - a TODO in chat (lost),
  - a comment in code (invisible to the next session).

## End-of-session checklist

1. `LOG.md` — one new entry at the top: date, task IDs touched, what changed, **the command that proves it**, next step.
2. `STATE.md` — only the rows whose truth changed.
3. `TASKS.md` — move statuses; add discovered gaps as new `PF-###`.
4. `node scripts/agent-status.mjs --write` — refresh `SNAPSHOT.txt`.
5. Commit: `PF-xxx: <scope>` — memory files change with the work they describe, not in separate "docs" commits a week later.
