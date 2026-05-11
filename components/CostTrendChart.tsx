"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Row = { session_date: string; session_cost_usd: number | null };

export function CostTrendChart({ sessions }: { sessions: Row[] }) {
  const data = [...sessions].reverse().map((s) => ({
    session_date: s.session_date,
    cost: s.session_cost_usd ?? 0,
  }));
  const hasAnyCost = data.some((d) => d.cost > 0);
  if (!hasAnyCost) {
    return (
      <p className="text-sm text-slate-500">
        Cost data not populated yet. Handoff frontmatter needs <code>cost_usd</code>{" "}
        field; cc-analytics will fill this on future sessions.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="session_date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="cost" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
