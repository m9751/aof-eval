"use client";

import { DPMO_DISCLOSURE, DPMO_MIN_N } from "@/lib/supabase";

type WindowData = { days: number; n: number; suppressed: boolean };
type RuleRow = {
  rule_id: string;
  rule_name: string;
  load_bearing_rare: boolean;
  windows: WindowData[];
};

export function DpmoChart({ rules }: { rules: RuleRow[] }) {
  if (rules.length === 0) return null;

  // Show the 30-day window as the headline bar chart
  const headline = rules
    .map((r) => {
      const w30 = r.windows.find((w) => w.days === 30);
      return { ...r, n30: w30?.n ?? 0, suppressed: w30?.suppressed ?? true };
    })
    .sort((a, b) => b.n30 - a.n30);

  const maxN = Math.max(...headline.map((r) => r.n30), 1);

  return (
    <div className="space-y-3">
      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Disclosure: </span>
        {DPMO_DISCLOSURE}
      </div>

      <p className="text-xs text-slate-500">
        30-day opportunity counts per rule. ★ = load-bearing-rare (Goodhart
        guard — low count is expected and OK). ⚠ = n &lt; {DPMO_MIN_N} (below
        threshold; percentage suppressed).
      </p>

      <div className="space-y-1">
        {headline.map((rule) => {
          const pct = (rule.n30 / maxN) * 100;
          return (
            <div key={rule.rule_id} className="flex items-center gap-2 text-xs">
              <span className="w-16 font-mono text-slate-600 shrink-0">
                {rule.rule_id}
              </span>
              <div className="flex-1 bg-slate-100 rounded h-4 relative overflow-hidden">
                <div
                  className={`h-full rounded ${rule.load_bearing_rare ? "bg-amber-400" : "bg-blue-400"} ${rule.suppressed ? "opacity-40" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-20 text-right text-slate-700 shrink-0">
                {rule.suppressed ? (
                  <span className="text-slate-400">n={rule.n30} ⚠</span>
                ) : (
                  rule.n30
                )}
                {rule.load_bearing_rare && (
                  <span className="ml-1 text-amber-600">★</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sensitivity window summary */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-600 mb-1">
          Sensitivity windows (total opportunities across all rules)
        </h4>
        <div className="flex gap-4">
          {[7, 30, 60].map((days) => {
            const total = rules.reduce((sum, r) => {
              const w = r.windows.find((w) => w.days === days);
              return sum + (w?.n ?? 0);
            }, 0);
            return (
              <div key={days} className="rounded border border-slate-200 bg-white p-2 text-center min-w-[80px]">
                <div className="text-xs text-slate-500">{days}d</div>
                <div className="text-lg font-semibold text-slate-800">
                  {total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
