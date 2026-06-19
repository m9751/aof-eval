# AOF Eval Dashboard

**Public credibility dashboard for the Agent Operating Framework self-eval harness — read-only, on the open internet by design.**

A Next.js (App Router) dashboard for the [Agent Operating Framework](https://github.com/m9751/agent-operating-framework) self-applied evaluation harness. Reads the `eval` schema of the smokin-ops Supabase project and renders rule-adherence trends, plan-delivery gap, cost, and composite scores across the framework author's daily Claude Code sessions. **Live:** https://aof-eval.vercel.app/

## Where to start

| If you are asking… | Start here |
|---|---|
| "What is this and what are the rules?" | `AGENTS.md` (routing + hard rules) → `CLAUDE.md` (behavioral notes) |
| "What's the current state / open work?" | `STATUS.md` |
| "How do I run / build / lint it?" | `## Quick start` below, or `make help` |
| "What's safe to expose publicly?" | "What's public" + "What's protected" below — load-bearing |
| "What must I NOT change?" | "Things the next maintainer must NOT change" below |
| "Where's the data layer / API?" | `lib/` (Supabase client), `app/api/` (routes) |

## Quick start

```bash
make install     # npm install
make dev         # next dev (local)
make lint        # next lint + banned-token checks
make build       # next build
```

`make help` lists all targets. The **Makefile is the canonical command front door** — it wraps the `package.json` scripts so agents and humans have one place to look.

## For Claude landing here (read before editing)

1. **Pull first.** `git pull` before editing — this repo syncs across machines.
2. **This is a PUBLIC credibility surface.** Treat every change to `app/api/*` as a data-exposure decision (see AGENTS.md hard rule #1 + the invariants below), not just a code change.
3. **Read-only on Supabase.** This repo never writes to the `eval` schema and never holds the service-role key. Do not add a write path.
4. **Branch + PR for every change.** No direct push to `main`.

## What's public

This dashboard is intentionally on the open internet — it's the framework's credibility test. The following are exposed by design:

| Surface | Data |
|---|---|
| `/` (HTML) | Aggregate scores per session, machine label (`mac` / `win`), 14-day trend charts |
| `/api/sessions` (JSON) | Per-session scores, dates, machine — **no filenames, no paths** |
| `/api/runs` (JSON) | Per-run aggregates — **no `notes` field, no free text** |

Vercel Analytics + Speed Insights + custom events on footer links — all standard.

## What's protected

The same Supabase anon key reaches several schemas via PostgREST. The following are **structurally** blocked, not just policy-blocked:

| Surface | Block | Migration |
|---|---|---|
| `eval.runs` / `eval.sessions` writes | Anon has SELECT GRANT only. INSERT/UPDATE/DELETE/TRUNCATE revoked. | smokin-ops `20260512030000_eval_anon_write_revoke_and_tp_anon_select_deny.sql` |
| `tp.decisions` / `tp.decision_transitions` reads | RESTRICTIVE deny policy on anon SELECT. Cannot be shadowed by future PERMISSIVE policies. | same migration |
| `handoff_path` filenames | Never SELECTed by either API route. Never sent over the wire. | this repo `app/api/sessions/route.ts` |
| `eval.runs.notes` free text | Never SELECTed by `/api/runs`. Explicit column list. | this repo `app/api/runs/route.ts` |
| Anon key itself | Used only in Server Components (SSR-only fetch). Not bundled into client chunks. | this repo `lib/supabase.ts` |

## Things the next maintainer must NOT change

If you (or future-me) are editing this repo, these invariants are load-bearing for the public-safety posture:

1. **Never `SELECT *`** from `eval.runs` or `eval.sessions` in API routes. The column list is the exposure budget — `*` re-leaks anything added later.
2. **Never add a `"use client"` directive** to any file that imports from `lib/supabase.ts`. Doing so will bundle the anon key into the public JS payload.
3. **Never add `handoff_path` or `notes`** to the API SELECT lists. They are the two known leak vectors.
4. **Never weaken the RESTRICTIVE deny on `tp.decisions`** in smokin-ops migrations. The whole point is that it cannot be shadowed.
5. **Never share the service_role key with this dashboard.** It only ever uses the anon key. The harness CLI uses service_role.

## Architecture

```
~/Documents/.../handoff-*.md          (operator's machine)
        │
        ▼  python -m examples.evals.run_harness  (manual, service_role key)
        │
        ▼
smokin-ops Supabase
  ├─ eval.sessions  (47+ rows, RLS: anon SELECT only)
  └─ eval.runs      (1+ rows, RLS: anon SELECT only)
        │
        ▼  Next.js SSR fetch via anon key (server-only)
        │
        ▼
aof-eval.vercel.app  (public, no auth)
```

The harness is **manual-trigger only.** No cron. Operator preference — see the AOF rule on cron jobs.

## Re-running the harness

From the AOF repo (`m9751/agent-operating-framework`):

```bash
export SMOKIN_OPS_URL=https://xuvdcygqyuajtlpavafr.supabase.co
export SMOKIN_OPS_SERVICE_KEY=<service_role_key>
python -m examples.evals.run_harness --window-days 14 --trigger manual
```

This writes one new `eval.runs` row + N new `eval.sessions` rows. The dashboard auto-renders the latest run on next page load.

## Stack

Next.js 16, Supabase, Recharts, Tailwind. Vercel auto-deploy on push to `main`.

## License

MIT — same as the parent framework.
