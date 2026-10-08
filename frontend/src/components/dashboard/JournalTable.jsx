import { Pencil, ExternalLink, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PlatformBadge, GradeBadge, StatusPill } from "@/components/Badges";
import { fmtDate } from "@/lib/constants";

const Score = ({ s }) => {
  if (s.ai_score == null && s.final_score == null) return <span className="text-zinc-600">—</span>;
  const edited = s.final_score != null && s.final_score !== s.ai_score;
  return (
    <div className="leading-tight">
      <span className={`font-mono text-base font-bold ${edited ? "text-zinc-500 line-through decoration-zinc-600" : "text-white"}`}>{s.ai_score ?? "—"}</span>
      {edited && <span className="ml-2 font-mono text-base font-bold text-white" data-testid={`final-score-${s.id}`}>{s.final_score}</span>}
      {s.manually_edited && <span className="block text-[10px] font-bold uppercase tracking-wider text-violet-300">diedit guru</span>}
    </div>
  );
};

const Row = ({ s, selected, toggle, onOpen, onDelete }) => (
  <tr data-testid={`row-submission-${s.id}`} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
    <td className="px-4 py-3"><Checkbox data-testid={`checkbox-select-${s.id}`} checked={selected} onCheckedChange={() => toggle(s.id)} className="border-zinc-600 data-[state=checked]:border-lime-300 data-[state=checked]:bg-lime-300 data-[state=checked]:text-zinc-950" /></td>
    <td className="px-4 py-3">
      <button onClick={() => onOpen(s.id)} className="text-left" data-testid={`button-open-${s.id}`}>
        <p className="font-semibold text-white transition-colors hover:text-lime-300">{s.full_name}</p>
        <p className="text-xs text-zinc-500">{fmtDate(s.created_at)}</p>
      </button>
    </td>
    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{s.class_name}</td>
    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{String(s.attendance_number).padStart(2, "0")}</td>
    <td className="px-4 py-3">
      <a href={s.video_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-lime-300" data-testid={`link-video-${s.id}`}>
        <PlatformBadge platform={s.platform} /> <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </td>
    <td className="px-4 py-3"><StatusPill status={s.status} testId={`status-${s.id}`} /></td>
    <td className="px-4 py-3" data-testid={`score-${s.id}`}><Score s={s} /></td>
    <td className="px-4 py-3"><GradeBadge grade={s.final_grade} testId={`grade-${s.id}`} /></td>
    <td className="px-4 py-3 text-right">
      <div className="inline-flex items-center gap-1.5">
        <button data-testid={`button-edit-submission-${s.id}`} onClick={() => onOpen(s.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-lime-300 hover:text-zinc-950">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button data-testid={`button-delete-submission-${s.id}`} onClick={() => onDelete(s)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500">
          <Trash2 className="h-3.5 w-3.5" /> Hapus
        </button>
      </div>
    </td>
  </tr>
);

const HEAD = ["Nama Siswa", "Kelas", "No. Absen", "Link Video", "Status Penilaian", "Skor AI", "Letter Grade"];

export const JournalTable = ({ rows, selected, setSelected, onOpen, onDelete }) => {
  const toggle = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  return (
    <div className="overflow-x-auto rounded-2xl bg-zinc-950/80 ring-1 ring-white/10">
      <table data-testid="table-teacher-journal" className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="px-4 py-3"><Checkbox data-testid="checkbox-select-all" checked={allOn} onCheckedChange={() => setSelected(allOn ? [] : rows.map((r) => r.id))} className="border-zinc-600 data-[state=checked]:border-lime-300 data-[state=checked]:bg-lime-300 data-[state=checked]:text-zinc-950" /></th>
            {HEAD.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => <Row key={s.id} s={s} selected={selected.includes(s.id)} toggle={toggle} onOpen={onOpen} onDelete={onDelete} />)}
          {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-16 text-center text-zinc-500" data-testid="text-journal-empty">Belum ada pengumpulan.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
