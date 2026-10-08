import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, ExternalLink, Sparkles, Lock, PlayCircle, AlertTriangle, CheckCheck, MessageSquareHeart, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlatformBadge, GradeBadge, StatusPill } from "@/components/Badges";
import { letterGrade } from "@/lib/constants";
import { api, errMsg } from "@/lib/api";

const RUBRIC = [
  ["content_score", "Content & Context", 0.5, "bg-lime-300"],
  ["delivery_score", "Delivery & Subtitles", 0.3, "bg-violet-400"],
  ["technical_score", "Technical & Tagging", 0.2, "bg-sky-400"],
];
const AREA = "rounded-xl border-white/10 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-600";
const LBL = "text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500";

export const embedUrl = (url, platform) => {
  try {
    const u = new URL(url);
    if (platform === "youtube") {
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v") || u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/)?.[2];
      return id ? { src: `https://www.youtube.com/embed/${id}`, vertical: u.pathname.includes("/shorts/") } : null;
    }
    if (platform === "tiktok") {
      const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
      return id ? { src: `https://www.tiktok.com/embed/v2/${id}`, vertical: true } : null;
    }
    if (platform === "instagram") {
      const m = u.pathname.match(/\/(reel|reels|p|tv)\/([\w-]+)/);
      return m ? { src: `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed`, vertical: true } : null;
    }
    if (platform === "facebook") return { src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`, vertical: false };
  } catch { /* invalid url */ }
  return null;
};

const VideoPreview = ({ s }) => {
  const [show, setShow] = useState(false);
  const e = embedUrl(s.video_link, s.platform);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <a href={s.video_link} target="_blank" rel="noreferrer" data-testid="link-review-video" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
          <ExternalLink className="h-3.5 w-3.5" /> Buka link asli
        </a>
        {e && (
          <button data-testid="button-toggle-embed" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-lime-300 ring-1 ring-lime-300/30 hover:bg-lime-300/10">
            <PlayCircle className="h-3.5 w-3.5" /> {show ? "Tutup pemutar" : "Tonton di sini"}
          </button>
        )}
      </div>
      <p className="break-all font-mono text-[11px] text-zinc-500">{s.video_link}</p>
      {show && e && (
        <div className={`overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 ${e.vertical ? "mx-auto aspect-[9/16] max-h-[560px]" : "aspect-video"}`} data-testid="video-embed">
          <iframe title="Video tugas" src={e.src} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      )}
    </div>
  );
};

const AiInput = ({ s }) => {
  if (!s.ai_input) return null;
  return (
    <details className="rounded-xl bg-white/[0.03] p-3 text-xs text-zinc-400 ring-1 ring-white/5" data-testid="block-metadata">
      <summary className="cursor-pointer font-semibold text-zinc-300">Metadata yang dibaca AI</summary>
      <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{s.ai_input}</pre>
    </details>
  );
};

export const ReviewSheet = ({ id, onClose, onChanged }) => {
  const [s, setS] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(null);
  const [fbPending, setFbPending] = useState(false);
  const fbBusy = fbPending || s?.feedback_status === "generating";

  const load = () => api.get(`/admin/submissions/${id}`).then((r) => {
    const d = r.data;
    setS(d);
    setForm({ content_score: d.content_score ?? "", delivery_score: d.delivery_score ?? "", technical_score: d.technical_score ?? "",
      final_score: d.final_score ?? "", ai_strengths: d.ai_strengths || "", ai_weaknesses: d.ai_weaknesses || "", teacher_notes: d.teacher_notes || "", student_feedback: d.student_feedback || "" });
  }).catch((e) => { toast.error(errMsg(e, "Data tidak ditemukan")); onClose(); });
  useEffect(() => { if (id) { setS(null); load(); } }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll while the AI comment is being generated in the background
  const generating = s?.feedback_status === "generating";
  useEffect(() => {
    if (!id || !generating) return;
    const started = Date.now();
    const t = setInterval(async () => {
      try {
        const { data: d } = await api.get(`/admin/submissions/${id}`);
        if (d.feedback_status !== "generating" || Date.now() - started > 180000) {
          clearInterval(t);
          setS(d);
          if (d.feedback_status === "ready") {
            setForm((f) => ({ ...f, student_feedback: d.student_feedback || "" }));
            toast.success("Komentar AI untuk siswa siap");
            onChanged();
          } else if (d.feedback_status === "failed") {
            toast.error("Gagal membuat komentar AI. Coba lagi atau tulis manual.");
          }
        }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(t);
  }, [id, generating]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRubric = (k, v) => {
    const next = { ...form, [k]: v };
    if (RUBRIC.every(([rk]) => next[rk] !== "" && next[rk] !== undefined)) {
      next.final_score = String(Math.round(RUBRIC.reduce((a, [rk, , w]) => a + Number(next[rk]) * w, 0) * 10) / 10);
    }
    setForm(next);
  };
  const hasFinal = form.final_score !== "" && form.final_score !== undefined && !Number.isNaN(Number(form.final_score));
  const finalNum = hasFinal ? Math.max(0, Math.min(100, Number(form.final_score))) : null;

  const save = async (status) => {
    if (status === "final" && !hasFinal) return toast.error("Isi nilai akhir terlebih dahulu");
    setBusy(status);
    try {
      const body = { ai_strengths: form.ai_strengths, ai_weaknesses: form.ai_weaknesses, teacher_notes: form.teacher_notes, student_feedback: form.student_feedback, status };
      if (RUBRIC.every(([k]) => form[k] !== "")) RUBRIC.forEach(([k]) => (body[k] = Number(form[k])));
      if (hasFinal) body.final_score = finalNum;
      const r = await api.patch(`/admin/submissions/${id}`, body);
      toast.success(status === "final"
        ? (form.student_feedback.trim() ? "Nilai Final & komentar dikirim ke siswa" : r.data.feedback_status === "generating" ? "Nilai Final disimpan · AI sedang membuat komentar…" : "Nilai Final disimpan")
        : "Disimpan sebagai Draft");
      onChanged();
      load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };
  const regenFeedback = async () => {
    setFbPending(true);
    try {
      const body = { ai_strengths: form.ai_strengths, ai_weaknesses: form.ai_weaknesses };
      if (hasFinal) body.final_score = finalNum;
      await api.post(`/admin/submissions/${id}/feedback`, body);
      setS((p) => ({ ...p, feedback_status: "generating" }));
    } catch (e) { toast.error(errMsg(e, "Gagal membuat komentar AI")); } finally { setFbPending(false); }
  };
  const regrade = async () => {
    await api.post(`/admin/submissions/${id}/regrade`);
    toast.success("AI akan menilai ulang di latar belakang");
    onChanged();
    onClose();
  };

  const processing = s && ["pending", "processing"].includes(s.status);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent data-testid="sheet-review" className="w-full overflow-y-auto border-white/10 bg-[#0b0b0e] text-zinc-100 sm:max-w-xl">
        {!s ? (
          <>
            <SheetTitle className="sr-only">Memuat</SheetTitle>
            <SheetDescription className="sr-only">Memuat data pengumpulan</SheetDescription>
            <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-lime-300" />
          </>
        ) : (
          <div className="space-y-6">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2"><PlatformBadge platform={s.platform} /><StatusPill status={s.status} testId="review-status" /></div>
              <SheetTitle className="font-heading text-2xl font-extrabold text-white">{s.full_name}</SheetTitle>
              <SheetDescription className="font-mono text-xs text-zinc-500">Kelas {s.class_name} · Absen {s.attendance_number}</SheetDescription>
            </SheetHeader>

            <VideoPreview s={s} />

            {s.status === "failed" && <p className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 ring-1 ring-rose-500/20" data-testid="text-ai-error">AI gagal menilai: {s.error}. Klik “Nilai ulang AI” atau nilai secara manual.</p>}
            {processing && <p className="flex items-center gap-2 rounded-xl bg-sky-400/10 p-3 text-xs text-sky-300 ring-1 ring-sky-400/20"><Loader2 className="h-4 w-4 animate-spin" /> AI sedang menilai kiriman ini…</p>}
            {s.extraction_ok === false && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200 ring-1 ring-amber-400/20" data-testid="text-extraction-failed">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Data gagal diekstrak karena privasi link. Tonton video secara manual lalu isi nilai.
              </p>
            )}

            {s.ai_score != null && (
              <div className="flex items-center justify-between rounded-2xl bg-violet-400/[0.06] p-4 ring-1 ring-violet-400/20" data-testid="block-ai-original">
                <span className="flex items-center gap-2 text-xs font-semibold text-violet-200"><Sparkles className="h-4 w-4" /> Penilaian AI (Gemini)</span>
                <span className="flex items-center gap-2"><span className="font-mono text-2xl font-bold text-white" data-testid="text-ai-score">{s.ai_score}</span><GradeBadge grade={s.ai_letter_grade} testId="badge-ai-grade" /></span>
              </div>
            )}

            <div className="space-y-2">
              <p className={LBL}>Kelebihan / Strengths</p>
              <Textarea data-testid="textarea-strengths" rows={4} className={AREA} value={form.ai_strengths} onChange={(e) => setForm({ ...form, ai_strengths: e.target.value })} />
            </div>
            <div className="space-y-2">
              <p className={LBL}>Kekurangan & Saran / Weaknesses</p>
              <Textarea data-testid="textarea-weaknesses" rows={4} className={AREA} value={form.ai_weaknesses} onChange={(e) => setForm({ ...form, ai_weaknesses: e.target.value })} />
            </div>

            <AiInput s={s} />

            <div className="space-y-2">
              <p className={LBL}>Rincian rubrik (opsional)</p>
              {RUBRIC.map(([k, label, w, bar]) => (
                <div key={k} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
                  <div className="flex items-center justify-between text-xs"><span className="font-semibold text-zinc-200">{label}</span><span className="font-mono text-zinc-500">{w * 100}%</span></div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5"><div className={`h-full ${bar} transition-[width]`} style={{ width: `${Math.min(100, Number(form[k]) || 0)}%` }} /></div>
                    <Input data-testid={`input-${k}`} type="number" min={0} max={100} className="h-8 w-20 rounded-lg border-white/10 bg-zinc-900 font-mono text-white" value={form[k]} onChange={(e) => setRubric(k, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-lime-300/[0.06] p-4 ring-1 ring-lime-300/25">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime-300">Skor Akhir</p>
                <p className="text-xs text-zinc-500">Edit langsung atau lewat rubrik</p>
              </div>
              <div className="flex items-center gap-3">
                <Input data-testid="input-final-score" type="number" min={0} max={100} step="0.1" className="h-12 w-24 rounded-xl border-lime-300/30 bg-zinc-950 text-center font-mono text-2xl font-bold text-white" value={form.final_score} onChange={(e) => setForm({ ...form, final_score: e.target.value })} />
                {finalNum !== null && <GradeBadge grade={letterGrade(finalNum)} testId="badge-final-grade" />}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10" data-testid="block-student-feedback">
              <div className="flex items-center justify-between gap-2">
                <p className={`${LBL} flex items-center gap-1.5 text-lime-300`}><MessageSquareHeart className="h-3.5 w-3.5" /> Komentar untuk Siswa</p>
                <button data-testid="button-regenerate-feedback" onClick={regenFeedback} disabled={fbBusy} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-lime-300 ring-1 ring-lime-300/30 transition-colors hover:bg-lime-300/10 disabled:opacity-60">
                  {fbBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} {form.student_feedback ? "Buat ulang dengan AI" : "Buat dengan AI"}
                </button>
              </div>
              {fbBusy && <p className="flex items-center gap-2 text-xs text-lime-300" data-testid="text-feedback-generating"><Loader2 className="h-3.5 w-3.5 animate-spin" /> AI sedang menulis komentar untuk {s.full_name.split(" ")[0]}…</p>}
              <Textarea data-testid="textarea-student-feedback" rows={4} disabled={fbBusy} className={`${AREA} disabled:opacity-50`} placeholder="Kosongkan untuk dibuat otomatis oleh AI saat Simpan Permanen (Final)." value={form.student_feedback} onChange={(e) => setForm({ ...form, student_feedback: e.target.value })} />
              <p className="text-[11px] text-zinc-500">Tampil di halaman Cek Nilai bersama Nilai Final{s.status === "final" ? "." : " setelah disimpan permanen."}</p>
            </div>

            <div className="space-y-2">
              <p className={`${LBL} flex items-center gap-1.5`}><Lock className="h-3 w-3" /> Catatan Guru (privat)</p>
              <Textarea data-testid="textarea-teacher-notes" rows={2} className={AREA} value={form.teacher_notes} onChange={(e) => setForm({ ...form, teacher_notes: e.target.value })} />
            </div>

            <div className="sticky bottom-0 -mx-6 space-y-2 border-t border-white/5 bg-[#0b0b0e]/95 px-6 py-4 backdrop-blur">
              <button data-testid="button-save-final" disabled={!!busy || fbBusy} onClick={() => save("final")} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 disabled:opacity-60">
                {busy === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Simpan Permanen (Final)
              </button>
              <div className="flex gap-2">
                <button data-testid="button-save-draft" disabled={!!busy || fbBusy} onClick={() => save("draft")} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/5 disabled:opacity-60">
                  {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {s.status === "final" ? "Kembalikan ke Draft" : "Simpan Draft"}
                </button>
                <button data-testid="button-retry-ai-grading" onClick={regrade} disabled={processing} className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/5 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Nilai ulang AI</button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
