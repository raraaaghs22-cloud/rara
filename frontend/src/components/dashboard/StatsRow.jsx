import { CLASSES } from "@/lib/constants";

const Stat = ({ label, value, accent, testId }) => (
  <div className="rounded-2xl bg-zinc-950/80 p-5 ring-1 ring-white/10">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
    <p data-testid={testId} className={`mt-2 font-mono text-3xl font-bold ${accent}`}>{value ?? "—"}</p>
  </div>
);

export const StatsRow = ({ stats, activeClass, onPickClass }) => {
  const max = Math.max(1, ...Object.values(stats?.per_class || {}));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total Kiriman" value={stats?.total} accent="text-white" testId="stat-total" />
        <Stat label="Diproses AI" value={stats?.pending} accent="text-sky-300" testId="stat-pending" />
        <Stat label="Draft" value={stats?.draft} accent="text-violet-300" testId="stat-draft" />
        <Stat label="Final" value={stats?.final} accent="text-lime-300" testId="stat-final" />
        <Stat label="Rata-rata Nilai" value={stats?.avg_score} accent="text-white" testId="stat-avg" />
      </div>
      <div className="grid grid-cols-6 gap-2 rounded-2xl bg-zinc-950/80 p-3 ring-1 ring-white/10 sm:grid-cols-12" data-testid="class-distribution">
        {CLASSES.map((c) => {
          const n = stats?.per_class?.[c] ?? 0;
          const on = activeClass === c;
          return (
            <button key={c} data-testid={`chip-class-${c.replace(" ", "-")}`} onClick={() => onPickClass(on ? "all" : c)}
              className={`group flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-colors ${on ? "bg-lime-300/10 ring-1 ring-lime-300/40" : "hover:bg-white/5"}`}>
              <div className="flex h-10 w-full items-end justify-center">
                <div className={`w-3 rounded-full transition-[height] ${on ? "bg-lime-300" : "bg-zinc-700 group-hover:bg-zinc-500"}`} style={{ height: `${Math.max(8, (n / max) * 100)}%` }} />
              </div>
              <span className={`font-mono text-[10px] ${on ? "text-lime-300" : "text-zinc-500"}`}>{c.replace("XI ", "XI-")}</span>
              <span className="font-mono text-xs font-bold text-white">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
