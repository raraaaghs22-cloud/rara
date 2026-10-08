import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ArrowRight, Link2 } from "lucide-react";
import PublicShell from "@/components/PublicShell";
import { PlatformBadge } from "@/components/Badges";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSES, detectPlatform } from "@/lib/constants";
import { useLang, SUCCESS_MSG, BI } from "@/lib/i18n";
import { api, errMsg } from "@/lib/api";

const HERO = "https://images.unsplash.com/photo-1558620013-a08999547a36?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";
const EMPTY = { full_name: "", class_name: "", attendance_number: "", video_link: "" };
const FIELD = "h-12 rounded-xl border-white/10 bg-zinc-900/70 text-white placeholder:text-zinc-600 focus-visible:ring-lime-300/60";

const BiLabel = ({ k, htmlFor, right }) => (
  <div className="flex items-end justify-between gap-2">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-zinc-200">
      {BI[k][0]} <span className="text-zinc-600">/</span> <span className="text-zinc-400">{BI[k][1]}</span>
    </label>
    {right}
  </div>
);

const Requirements = () => {
  const { t } = useLang();
  return (
    <ul className="mt-7 flex flex-wrap gap-2">
      {t.req.map((r, i) => (
        <li key={r} className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
          <span className="font-mono text-[10px] text-lime-300">0{i + 1}</span>{r}
        </li>
      ))}
    </ul>
  );
};

const Success = ({ onAgain }) => {
  const { t } = useLang();
  return (
    <div data-testid="banner-submit-success" className="fade-up flex flex-col items-start gap-5 py-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300 text-zinc-950 shadow-[0_0_40px_-6px_rgba(198,243,94,0.6)]">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <p className="text-xl font-bold leading-snug text-white" data-testid="text-submit-success">{SUCCESS_MSG}</p>
      <button data-testid="button-submit-another" onClick={onAgain} className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-300 ring-1 ring-white/15 transition-colors hover:bg-white/5 hover:text-white">
        {t.again}
      </button>
    </div>
  );
};

export default function SubmitPage() {
  const { t } = useLang();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const platform = detectPlatform(form.video_link.trim());
  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e });

  useEffect(() => setError(""), [form]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.class_name || !form.attendance_number || !form.video_link.trim()) return setError(t.fillAll);
    if (!platform) return setError(t.linkInvalid);
    setBusy(true);
    try {
      await api.post("/submissions", { ...form, attendance_number: Number(form.attendance_number) });
      setDone(true);
      setForm(EMPTY);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div className="fade-up">
          <span className="overline"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" />{t.overline}</span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.projectPre}</p>
          <h1 data-testid="text-hero-title" className="mt-2 font-heading font-extrabold tracking-tight text-white">
            <span className="block text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">VIBESMAI<span className="text-lime-300">.</span></span>
            <span className="mt-3 block text-2xl leading-tight text-zinc-300 sm:text-3xl">Music Journal &amp; AI Grading Platform</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">{t.intro}</p>
          <Requirements />
          <div className="relative mt-9 hidden overflow-hidden rounded-3xl ring-1 ring-white/10 lg:block">
            <img src={HERO} alt="Stage lights" className="h-60 w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/30 to-transparent" />
            <p className="absolute bottom-4 left-5 font-mono text-xs text-zinc-400">#FungsiMusik · @Mr. Ocha</p>
          </div>
        </div>
        <div className="fade-up h-fit rounded-3xl bg-zinc-950/80 p-6 ring-1 ring-white/10 backdrop-blur-xl sm:p-8 shadow-[0_30px_80px_-40px_rgba(198,243,94,0.25)]" style={{ animationDelay: "120ms" }}>
          {done ? (
            <Success onAgain={() => setDone(false)} />
          ) : (
            <form onSubmit={submit} className="space-y-5" data-testid="form-submit-assignment">
              <div className="border-b border-white/5 pb-5">
                <h2 className="font-heading text-lg font-bold text-white">{t.formTitle}</h2>
                <p className="mt-1 text-xs text-zinc-500">{t.formNote}</p>
              </div>
              <div className="space-y-2">
                <BiLabel k="name" htmlFor="name" />
                <Input id="name" data-testid="input-full-name" className={FIELD} placeholder={t.namePh} value={form.full_name} onChange={set("full_name")} maxLength={120} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <BiLabel k="klass" />
                  <Select value={form.class_name} onValueChange={set("class_name")}>
                    <SelectTrigger data-testid="select-class-name" className={FIELD}><SelectValue placeholder={t.klassPh} /></SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => <SelectItem key={c} value={c} data-testid={`option-class-${c.replace(" ", "-")}`}>Kelas {c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <BiLabel k="absen" htmlFor="absen" />
                  <Input id="absen" type="number" min={1} max={60} data-testid="input-attendance-number" className={`${FIELD} font-mono`} placeholder="1–60" value={form.attendance_number} onChange={set("attendance_number")} />
                </div>
              </div>
              <div className="space-y-2">
                <BiLabel k="link" htmlFor="link" right={platform && <span className="flex items-center gap-1.5 text-xs text-zinc-500">{t.detected} <PlatformBadge platform={platform} testId="badge-detected-platform" /></span>} />
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input id="link" type="text" inputMode="url" data-testid="input-video-url" className={`${FIELD} pl-10 font-mono text-sm`} placeholder={t.linkPh} value={form.video_link} onChange={set("video_link")} />
                </div>
                {form.video_link.trim().length > 8 && !platform && <p className="text-xs text-rose-400" data-testid="text-link-invalid">{t.linkInvalid}</p>}
              </div>
              {error && <p data-testid="text-submit-error" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/20">{error}</p>}
              <button type="submit" disabled={busy} data-testid="button-submit-assignment" className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 font-bold text-zinc-950 transition-[background-color,transform,box-shadow] hover:bg-lime-200 hover:shadow-[0_0_30px_-6px_rgba(198,243,94,0.6)] active:scale-[0.98] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? t.sending : t.submit}
                {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
