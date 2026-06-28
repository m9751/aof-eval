import type { EvalRun } from "@/lib/supabase";

// The frozen pre-DPMO reference point. Mirrors V1_BASELINE in app/page.tsx —
// kept here as the comparison anchor so this component is self-contained.
// If the page baseline constant changes, update this to match.
type Baseline = {
  label: string;
  runDate: string;
  sessions: number;
  meanComposite: number;
  meanRule: number;
  meanPlanDelivery: number;
};

type MetricRow = {
  label: string;
  current: number | null;
  baseline: number;
  /** A delta is "good" when current rises above baseline (true) — all four
   *  metrics here are higher-is-better (scores out of 10, session count). */
  decimals: number;
};

function fmt(n: number | null, decimals: number): string {
  // Guard non-finite (NaN / ±Infinity) too, not just null — a bad numeric
  // would otherwise render as literal "NaN" (Codex MED/LOW hardening).
  return n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : n.toFixed(decimals);
}

// Format a DB timestamp string to YYYY-MM-DD, tolerating a malformed value
// instead of throwing a RangeError that would crash the whole render.
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}

function deltaParts(
  current: number | null,
  baseline: number,
  decimals: number
): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (current === null || current === undefined || !Number.isFinite(current)) {
    return { text: "—", tone: "na" };
  }
  const d = current - baseline;
  const rounded = Number(d.toFixed(decimals));
  if (rounded === 0) return { text: "±0", tone: "flat" };
  const sign = rounded > 0 ? "+" : "−";
  return {
    text: `${sign}${Math.abs(rounded).toFixed(decimals)}`,
    tone: rounded > 0 ? "up" : "down",
  };
}

const TONE_CLASS: Record<"up" | "down" | "flat" | "na", string> = {
  up: "text-green-700",
  down: "text-amber-700",
  flat: "text-slate-500",
  na: "text-slate-400",
};

export function CurrentVsBaseline({
  latestRun,
  baseline,
}: {
  latestRun: EvalRun | null;
  baseline: Baseline;
}) {
  // DC5 — graceful empty state: no graded run yet, render a neutral note
  // rather than crash on latestRun.x.
  if (!latestRun) {
    return (
      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">
          Current vs baseline
        </h2>
        <p className="text-xs text-slate-500">
          No harness run recorded yet — run the eval harness to populate this
          comparison.
        </p>
      </section>
    );
  }

  const rows: MetricRow[] = [
    {
      label: "Sessions graded",
      current: latestRun.sessions_graded,
      baseline: baseline.sessions,
      decimals: 0,
    },
    {
      label: "Mean composite (0–10)",
      current: latestRun.mean_composite,
      baseline: baseline.meanComposite,
      decimals: 2,
    },
    {
      label: "Mean rule adherence",
      current: latestRun.mean_rule_adherence,
      baseline: baseline.meanRule,
      decimals: 2,
    },
    {
      label: "Mean plan→delivery",
      current: latestRun.mean_plan_delivery,
      baseline: baseline.meanPlanDelivery,
      decimals: 2,
    },
  ];

  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-2">
        Current vs baseline — latest harness run{" "}
        {fmtDate(latestRun.run_ts)} (
        {latestRun.window_start} → {latestRun.window_end},{" "}
        {latestRun.trigger_kind})
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        The most recent graded run compared against the frozen {baseline.label}{" "}
        ({baseline.runDate}). Green = above baseline, amber = below. Both use the
        same v1.0 session-composite grader, so the deltas are like-for-like.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map((row) => {
          const delta = deltaParts(row.current, row.baseline, row.decimals);
          return (
            <div
              key={row.label}
              className="rounded border border-slate-200 bg-slate-50 p-3"
            >
              <div className="text-xs text-slate-400">{row.label}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-semibold text-slate-900">
                  {fmt(row.current, row.decimals)}
                </span>
                <span className={`text-xs font-medium ${TONE_CLASS[delta.tone]}`}>
                  {delta.text}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                baseline {fmt(row.baseline, row.decimals)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
