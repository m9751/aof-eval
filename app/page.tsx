import { supabase, DPMO_MIN_N, type EvalRun, type EvalSession } from "@/lib/supabase";
import { RuleAdherenceChart } from "@/components/RuleAdherenceChart";
import { CostTrendChart } from "@/components/CostTrendChart";
import { SessionTable } from "@/components/SessionTable";
import { SourceLinks } from "@/components/SourceLinks";
import { RulesScoreboard } from "@/components/RulesScoreboard";
import { DpmoChart } from "@/components/DpmoChart";

export const dynamic = "force-dynamic";

async function getData(): Promise<{
  runs: EvalRun[];
  sessions: EvalSession[];
  rules: Awaited<ReturnType<typeof fetchRules>>;
}> {
  const [runsResult, sessionsResult, rules] = await Promise.all([
    supabase.from("runs").select("*").order("run_ts", { ascending: false }).limit(20),
    supabase
      .from("sessions")
      .select(
        "id, run_id, session_date, machine, rule_adherence_score, plan_delivery_score, session_cost_usd, composite_score, created_at"
      )
      .gte(
        "session_date",
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      )
      .order("session_date", { ascending: false }),
    fetchRules(),
  ]);

  return {
    runs: (runsResult.data ?? []) as EvalRun[],
    sessions: (sessionsResult.data ?? []) as EvalSession[],
    rules,
  };
}

async function fetchRules() {
  // Query Supabase directly — server-side relative fetch("/api/rules") has no
  // base URL in SSR and silently returns [] when NEXT_PUBLIC_APP_URL is unset.
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(
    process.env.NEXT_PUBLIC_SMOKIN_OPS_URL!,
    process.env.NEXT_PUBLIC_SMOKIN_OPS_ANON_KEY!,
    { auth: { persistSession: false }, db: { schema: "eval" } }
  );
  const windows = [7, 30, 60];
  const now = new Date();

  const [rulesResult, ...windowResults] = await Promise.all([
    client
      .from("rules")
      .select(
        "rule_id, rule_name, rule_type, repo, lifecycle_state, load_bearing_rare, denominator_type, provenance_event"
      )
      .eq("lifecycle_state", "active")
      .order("rule_id"),
    ...windows.map((days) => {
      const since = new Date(now.getTime() - days * 86400000)
        .toISOString()
        .slice(0, 10);
      return client.from("opportunities").select("rule_id").gte("session_date", since);
    }),
  ]);

  if (rulesResult.error || !rulesResult.data) return [];

  const counts: Record<string, Record<number, number>> = {};
  windows.forEach((days, idx) => {
    const rows = windowResults[idx].data ?? [];
    for (const row of rows) {
      if (!counts[row.rule_id]) counts[row.rule_id] = {};
      counts[row.rule_id][days] = (counts[row.rule_id][days] ?? 0) + 1;
    }
  });

  return rulesResult.data.map((r) => ({
    ...r,
    windows: windows.map((days) => {
      const n = counts[r.rule_id]?.[days] ?? 0;
      return { days, n, suppressed: n < DPMO_MIN_N };
    }),
  }));
}

export default async function Page() {
  const { runs, sessions, rules } = await getData();
  const latest = runs[0];

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          AOF Eval Harness
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Self-applied measurement of the Agent Operating Framework. Grades
          rule adherence, plan→delivery gap, cost, and dispatch quality across
          every Claude Code session.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          {latest
            ? `Last run: ${new Date(latest.run_ts).toLocaleString()} · ${latest.sessions_graded} sessions · harness ${latest.harness_version} · aof ${latest.aof_version}`
            : "No runs yet."}
        </p>
      </header>

      {latest && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Sessions" value={latest.sessions_graded} />
          <Stat label="Mean rule" value={fmt(latest.mean_rule_adherence)} />
          <Stat
            label="Mean plan→delivery"
            value={fmt(latest.mean_plan_delivery)}
          />
          <Stat label="Mean composite" value={fmt(latest.mean_composite)} />
        </section>
      )}

      {latest && (
        <section className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-slate-700">
          <strong className="font-semibold text-slate-900">
            How to read these numbers.
          </strong>{" "}
          Scores run 0–10. They are uncalibrated against any external
          benchmark — there is no public dataset of AOF-style framework
          adherence to compare against. The absolute number isn&apos;t the
          signal; <strong>the slope over future runs is.</strong> v1.5 is the
          baseline. If a future v1.6 holds at 9.20 it&apos;s working; if it
          drops to 8.5 after a refactor, the refactor broke something. Click
          into the session table below to see which individual sessions
          dragged the average down — that&apos;s where the learning is.
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">
          Rule adherence (14d)
        </h2>
        <RuleAdherenceChart sessions={sessions} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">
          Session cost (14d)
        </h2>
        <CostTrendChart sessions={sessions} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">
          Sessions
        </h2>
        <SessionTable sessions={sessions} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">
          Rules Scoreboard — opportunity counts per rule
        </h2>
        <RulesScoreboard rules={rules} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">
          DPMO denominator — 30d opportunity distribution
        </h2>
        <DpmoChart rules={rules} />
      </section>

      <SourceLinks />
    </main>
  );
}

function fmt(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : Number(n).toFixed(2);
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) {
  return (
    <div className="rounded border border-slate-200 p-3 bg-white">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">
        {value ?? "—"}
      </div>
    </div>
  );
}
