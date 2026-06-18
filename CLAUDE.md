# CLAUDE.md — aof-eval

@AGENTS.md

## Claude-specific notes
- This is the framework's **credibility surface** — it is public on purpose. Treat every change to
  `app/api/*` as a data-exposure decision (see AGENTS.md hard rule 1), not just a code change.
- Data is **read-only** from the smokin-ops `eval` schema. This repo never writes to Supabase.
- Before adding a chart/endpoint, confirm the underlying column is already exposed by an existing
  `/api/*` route — do not widen the public surface to fill a UI slot.
