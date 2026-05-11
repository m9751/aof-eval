type Session = {
  session_date: string;
  machine: string;
  handoff_path: string;
  rule_adherence_score: number | null;
  plan_delivery_score: number | null;
  session_cost_usd: number | null;
  composite_score: number | null;
};

function basename(path: string): string {
  return path.split("/").pop() || path;
}

function fmt(n: number | null, digits = 1): string {
  return n === null || n === undefined ? "—" : n.toFixed(digits);
}

export function SessionTable({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-slate-500">No sessions in window.</p>;
  }
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="p-2 text-left font-medium">Date</th>
            <th className="p-2 text-left font-medium">Machine</th>
            <th className="p-2 text-left font-medium">Handoff</th>
            <th className="p-2 text-right font-medium">Rule</th>
            <th className="p-2 text-right font-medium">Plan→Delivery</th>
            <th className="p-2 text-right font-medium">Cost $</th>
            <th className="p-2 text-right font-medium">Composite</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="p-2 whitespace-nowrap">{s.session_date}</td>
              <td className="p-2">{s.machine}</td>
              <td className="p-2 font-mono text-xs text-slate-600">
                {basename(s.handoff_path)}
              </td>
              <td className="p-2 text-right">{fmt(s.rule_adherence_score)}</td>
              <td className="p-2 text-right">{fmt(s.plan_delivery_score)}</td>
              <td className="p-2 text-right">{fmt(s.session_cost_usd, 2)}</td>
              <td className="p-2 text-right font-semibold">
                {fmt(s.composite_score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
