export const CLASSES = Array.from({ length: 12 }, (_, i) => `XI ${i + 1}`);

export const PLATFORMS = {
  youtube: { label: "YouTube", cls: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30" },
  tiktok: { label: "TikTok", cls: "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/30" },
  instagram: { label: "Instagram", cls: "bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30" },
  facebook: { label: "Facebook", cls: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30" },
};

const PATTERNS = {
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  instagram: /(^|\.)(instagram\.com|instagr\.am)$/i,
  facebook: /(^|\.)(facebook\.com|fb\.watch|fb\.com)$/i,
};

export const detectPlatform = (raw) => {
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return Object.keys(PATTERNS).find((k) => PATTERNS[k].test(url.hostname)) || null;
  } catch {
    return null;
  }
};

export const GRADE_CLS = {
  A: "bg-lime-300/15 text-lime-300 ring-lime-300/40",
  B: "bg-sky-400/15 text-sky-300 ring-sky-400/40",
  C: "bg-amber-400/15 text-amber-300 ring-amber-400/40",
  D: "bg-rose-500/15 text-rose-300 ring-rose-500/40",
};

export const STATUS = {
  pending: { label: "Diproses", cls: "bg-sky-400/10 text-sky-300 ring-sky-400/30" },
  processing: { label: "Diproses", cls: "bg-sky-400/10 text-sky-300 ring-sky-400/30" },
  draft: { label: "Draft", cls: "bg-violet-400/10 text-violet-300 ring-violet-400/30" },
  final: { label: "Final", cls: "bg-lime-300/15 text-lime-300 ring-lime-300/40" },
  failed: { label: "Gagal", cls: "bg-rose-500/10 text-rose-300 ring-rose-500/30" },
};

export const STATUS_FILTERS = [
  ["pending", "Diproses"],
  ["draft", "Draft"],
  ["final", "Final"],
  ["failed", "Gagal"],
];

export const letterGrade = (n) => (n >= 90 ? "A" : n >= 80 ? "B" : n >= 70 ? "C" : "D");

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
