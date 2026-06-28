import { supabase, DPMO_MIN_N, DPMO_DISCLOSURE, type EvalRun, type EvalSession } from "@/lib/supabase";
import { fetchRules } from "@/lib/fetchRules";
import { RuleAdherenceChart } from "@/components/RuleAdherenceChart";
import { CostTrendChart } from "@/components/CostTrendChart";
import { SessionTable } from "@/components/SessionTable";
import { SourceLinks } from "@/components/SourceLinks";
import { RulesScoreboard } from "@/components/RulesScoreboard";
import { DpmoChart } from "@/components/DpmoChart";
import { CurrentVsBaseline } from "@/components/CurrentVsBaseline";

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
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
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

// ─── Static baseline data (frozen — last harness run 5/24/2026) ───────────────
const V1_BASELINE = {
  label: "v1.5 baseline",
  runDate: "May 24, 2026",
  sessions: 52,
  meanComposite: 8.92,
  meanRule: 8.88,
  meanPlanDelivery: 10.0,
  note: "Scored by the original harness (v1.0), which measured rule adherence, plan→delivery gap, and cost per session. Frozen as the pre-DPMO reference point.",
};

export default async function Page() {
  const { runs, sessions, rules } = await getData();

  // Top active rules by 7-day opportunity count for the BLUF headline
  const topRules = [...rules]
    .sort((a, b) => {
      const aN = a.windows.find((w: {days: number}) => w.days === 7)?.n ?? 0;
      const bN = b.windows.find((w: {days: number}) => w.days === 7)?.n ?? 0;
      return bN - aN;
    })
    .slice(0, 3);

  const total7d = rules.reduce((sum: number, r: {windows: {days: number; n: number}[]}) => {
    return sum + (r.windows.find((w) => w.days === 7)?.n ?? 0);
  }, 0);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          AOF Self-Evaluation Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          <strong>What this is:</strong> A self-measurement system for the Agent Operating Framework (AOF) —
          a set of rules, hooks, and behavioral guidelines that govern how Claude Code operates.
          This dashboard tracks whether each rule is earning its keep, using a quality-engineering
          method borrowed from manufacturing.
        </p>
      </header>

      {/* ── HOW TO READ THIS ────────────────────────────────────────────────── */}
      <section className="rounded border border-blue-200 bg-blue-50 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">How to read this dashboard</h2>

        <div>
          <p className="text-xs font-semibold text-slate-800">
            DPMO = Defects Per Million Opportunities (a Six Sigma quality measurement)
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Six Sigma is a manufacturing quality discipline with 30+ years of industrial use.
            Its core idea: measure defect rates per unit of exposure, not raw counts.
            Applied here — a &ldquo;defect&rdquo; is a rule violation; an &ldquo;opportunity&rdquo; is every moment
            that rule could have fired. DPMO = (violations ÷ opportunities) × 1,000,000.
            This makes rates comparable across rules that fire at very different frequencies.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-800">
            The signal is the rate, not the count
          </p>
          <p className="text-xs text-slate-600 mt-1">
            A rule that checked 855 times and blocked 3 has a different health profile than one
            that checked 5 times and blocked 3. Raw counts mislead — DPMO corrects for volume.
            Counts below {DPMO_MIN_N} opportunities are marked ⚠ and suppressed: not enough
            data yet to compute a meaningful rate.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-800">
            ★ Load-bearing rare rules are a special class
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Some rules fire rarely but guard against catastrophic outcomes (e.g., blocking a
            commit that would expose credentials). These are tagged ★ and excluded from
            &ldquo;retire by low DPMO&rdquo; logic — a low fire rate is expected and correct.
          </p>
        </div>

        <p className="text-xs text-slate-500 italic border-t border-blue-100 pt-2">
          Disclosure: {DPMO_DISCLOSURE}
        </p>
      </section>

      {/* ── LIVE SIGNAL — DPMO (7d headline) ───────────────────────────────── */}
      {rules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-1 text-slate-900">
            Live signal — last 7 days
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            {total7d.toLocaleString()} total rule checks recorded across {rules.length} active rules.
            {topRules.length > 0 && (
              <> Top by volume: {topRules.map((r: {rule_id: string; rule_name: string; windows: {days: number; n: number}[]}) =>
                `${r.rule_name} (${r.windows.find((w) => w.days === 7)?.n ?? 0} checks)`
              ).join(" · ")}.</>
            )}
          </p>
          <RulesScoreboard rules={rules} />
        </section>
      )}

      {/* ── DPMO DISTRIBUTION CHART ─────────────────────────────────────────── */}
      {rules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-1 text-slate-900">
            Opportunity distribution — 30d
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Each bar = one rule. Length = how many times it checked in the last 30 days.
            Amber = load-bearing rare (★). Faded = below the {DPMO_MIN_N}-check threshold.
          </p>
          <DpmoChart rules={rules} />
        </section>
      )}

      {/* ── RULE ADHERENCE + COST (legacy harness data, if any) ─────────────── */}
      {sessions.length > 0 && (
        <>
          <details open>
            <summary className="cursor-pointer text-lg font-semibold text-slate-900 mb-2 list-none flex items-center gap-1">
              <span className="text-slate-400 text-sm select-none">▸</span>
              Rule adherence trend (30d)
            </summary>
            <div className="mt-2">
              <RuleAdherenceChart sessions={sessions} />
            </div>
          </details>
          <details>
            <summary className="cursor-pointer text-lg font-semibold text-slate-900 mb-2 list-none flex items-center gap-1">
              <span className="text-slate-400 text-sm select-none">▸</span>
              Session cost (30d)
            </summary>
            <div className="mt-2">
              <CostTrendChart sessions={sessions} />
            </div>
          </details>
          <details>
            <summary className="cursor-pointer text-lg font-semibold text-slate-900 mb-2 list-none flex items-center gap-1">
              <span className="text-slate-400 text-sm select-none">▸</span>
              Sessions
            </summary>
            <div className="mt-2">
              <SessionTable sessions={sessions} />
            </div>
          </details>
        </>
      )}

      {/* ── CURRENT vs BASELINE — latest run delta ──────────────────────────── */}
      <CurrentVsBaseline
        latestRun={runs[0] ?? null}
        baseline={{
          label: V1_BASELINE.label,
          runDate: V1_BASELINE.runDate,
          sessions: V1_BASELINE.sessions,
          meanComposite: V1_BASELINE.meanComposite,
          meanRule: V1_BASELINE.meanRule,
          meanPlanDelivery: V1_BASELINE.meanPlanDelivery,
        }}
      />

      {/* ── V1.5 HISTORICAL BASELINE ─────────────────────────────────────────── */}
      <section className="rounded border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Historical baseline — {V1_BASELINE.label} · last harness run {V1_BASELINE.runDate}
        </h2>
        <p className="text-xs text-slate-500 mb-3">{V1_BASELINE.note}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BaselineStat label="Sessions graded" value={V1_BASELINE.sessions} />
          <BaselineStat label="Mean composite (0–10)" value={V1_BASELINE.meanComposite.toFixed(2)} />
          <BaselineStat label="Mean rule adherence" value={V1_BASELINE.meanRule.toFixed(2)} />
          <BaselineStat label="Mean plan→delivery" value={V1_BASELINE.meanPlanDelivery.toFixed(2)} />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          This baseline predates the DPMO framework. The two measurement systems are complementary:
          the composite score above measured session-level quality (0–10); the DPMO panels above
          measure rule-level utilization and violation rate. Both are required to understand
          whether the framework is working.
        </p>
      </section>

      <SourceLinks />
    </main>
  );
}

function BaselineStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-600">{value}</div>
    </div>
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
