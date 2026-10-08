import { Link } from "react-router-dom";
import { PLATFORMS, GRADE_CLS, STATUS } from "@/lib/constants";

export const PlatformBadge = ({ platform, testId }) => {
  const p = PLATFORMS[platform];
  if (!p) return null;
  return (
    <span data-testid={testId} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.cls}`}>
      {p.label}
    </span>
  );
};

export const GradeBadge = ({ grade, testId }) =>
  grade ? (
    <span data-testid={testId} className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 font-mono text-sm font-bold ring-1 ${GRADE_CLS[grade] || GRADE_CLS.D}`}>
      {grade}
    </span>
  ) : (
    <span className="text-zinc-600">—</span>
  );

export const StatusPill = ({ status, testId }) => {
  const s = STATUS[status] || STATUS.pending;
  const busy = status === "pending" || status === "processing";
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>
      {busy && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />}
      {s.label}
    </span>
  );
};

export const Logo = ({ to = "/submit", testId = "link-home", sub }) => (
  <Link to={to} className="group flex items-center gap-2.5" data-testid={testId}>
    <span className="eq flex h-9 w-9 items-end justify-center gap-[3px] rounded-xl bg-zinc-900 pb-2.5 ring-1 ring-white/10 transition-colors group-hover:ring-lime-300/40">
      <span /><span /><span /><span />
    </span>
    <span className="leading-tight">
      <span className="block font-heading text-sm font-extrabold tracking-tight text-white">VIBESMAI</span>
      {sub && <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{sub}</span>}
    </span>
  </Link>
);
