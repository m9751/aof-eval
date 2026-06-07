"use client";

import { DPMO_DISCLOSURE, DPMO_MIN_N, type EvalRule } from "@/lib/supabase";

type RuleWithWindows = EvalRule & {
  windows: { days: number; n: number; suppressed: boolean }[];
};

export function RulesScoreboard({ rules }: { rules: RuleWithWindows[] }) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No active rules found. Run the opportunity counter hook for at least one
        session to populate data.
      </p>
    );
  }

  const loadBearing = rules.filter((r) => r.load_bearing_rare);
  const standard = rules.filter((r) => !r.load_bearing_rare);

  return (
    <div className="space-y-4">
      {/* Disclosure — rendered programmatically, required per spec */}
      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Disclosure: </span>
        {DPMO_DISCLOSURE}
      </div>

      <RulesTable title="Load-bearing (rare fire OK)" rules={loadBearing} />
      <RulesTable title="Standard" rules={standard} />
    </div>
  );
}

function RulesTable({
  title,
  rules,
}: {
  title: string;
  rules: RuleWithWindows[];
}) {
  if (rules.length === 0) return null;
  const windows = rules[0]?.windows ?? [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="text-left px-2 py-1 border border-slate-200 font-medium">
                Rule
              </th>
              <th className="text-left px-2 py-1 border border-slate-200 font-medium">
                Type
              </th>
              {windows.map((w) => (
                <th
                  key={w.days}
                  className="text-right px-2 py-1 border border-slate-200 font-medium"
                >
                  {w.days}d opportunities
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.rule_id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-2 py-1 border border-slate-200">
                  <span className="font-mono text-slate-700">
                    {rule.rule_id}
                  </span>
                  <span className="ml-1 text-slate-500">{rule.rule_name}</span>
                  {rule.load_bearing_rare && (
                    <span
                      className="ml-1 text-amber-600 font-medium"
                      title="Goodhart guard: excluded from retire-by-low-DPMO logic"
                    >
                      ★
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 border border-slate-200 text-slate-500">
                  {rule.rule_type}
                </td>
                {rule.windows.map((w) => (
                  <td
                    key={w.days}
                    className="px-2 py-1 border border-slate-200 text-right"
                  >
                    {w.suppressed ? (
                      <span
                        className="text-slate-400"
                        title={`n=${w.n} < ${DPMO_MIN_N} threshold — insufficient data`}
                      >
                        n={w.n} ⚠
                      </span>
                    ) : (
                      <span className="text-slate-800 font-mono">{w.n}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
