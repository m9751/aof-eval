import { supabase, DPMO_MIN_N, type EvalRule } from "@/lib/supabase";

export const DPMO_WINDOWS = [7, 30, 60] as const;

export type RuleWindow = {
  days: number;
  n: number;
  suppressed: boolean;
};

export type RuleWithWindows = EvalRule & {
  windows: RuleWindow[];
};

export type FetchRulesOptions = {
  /** Optional filter — MuleSoft-style query param, not an unbounded collection dump. */
  ruleId?: string;
};

/**
 * Per-rule opportunity counts via PostgREST HEAD (count: exact).
 * Raw row fetches hit the 1000-row cap and undercount high-volume rules (e.g. PTU-19).
 */
export async function fetchRules(
  options: FetchRulesOptions = {}
): Promise<RuleWithWindows[]> {
  const windows = [...DPMO_WINDOWS];
  const now = new Date();

  let rulesQuery = supabase
    .from("rules")
    .select(
      "rule_id, rule_name, rule_type, repo, lifecycle_state, load_bearing_rare, denominator_type, provenance_event"
    )
    .eq("lifecycle_state", "active")
    .order("rule_id");

  if (options.ruleId) {
    rulesQuery = rulesQuery.eq("rule_id", options.ruleId);
  }

  const rulesResult = await rulesQuery;

  if (rulesResult.error || !rulesResult.data) return [];

  const sinceByWindow: Record<number, string> = {};
  for (const days of windows) {
    sinceByWindow[days] = new Date(now.getTime() - days * 86400000)
      .toISOString()
      .slice(0, 10);
  }

  const countEntries = await Promise.all(
    rulesResult.data.flatMap((r) =>
      windows.map(async (days) => {
        const { count } = await supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("rule_id", r.rule_id)
          .gte("session_date", sinceByWindow[days]);
        return { rule_id: r.rule_id, days, n: count ?? 0 };
      })
    )
  );

  const counts: Record<string, Record<number, number>> = {};
  for (const { rule_id, days, n } of countEntries) {
    if (!counts[rule_id]) counts[rule_id] = {};
    counts[rule_id][days] = n;
  }

  return rulesResult.data.map((r) => ({
    ...r,
    windows: windows.map((days) => {
      const n = counts[r.rule_id]?.[days] ?? 0;
      return { days, n, suppressed: n < DPMO_MIN_N };
    }),
  }));
}