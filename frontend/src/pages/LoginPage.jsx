import { ShieldCheck, Sparkles, FileSpreadsheet, ListChecks } from "lucide-react";
import { Logo } from "@/components/Badges";
import { startGoogleLogin } from "@/lib/auth";

const IMG = "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";
const FEATURES = [
  [Sparkles, "Draft nilai AI otomatis untuk setiap kiriman"],
  [ListChecks, "Tinjau, edit, dan finalkan nilai"],
  [FileSpreadsheet, "Ekspor rekap 12 kelas ke CSV / Excel"],
];

export default function LoginPage({ authError }) {
  return (
    <div className="grid min-h-screen bg-[#08080a] lg:grid-cols-2">
      <div className="relative flex flex-col justify-between p-6 sm:p-12">
        <div className="pointer-events-none absolute inset-0 glow-lime" />
        <div className="relative"><Logo testId="link-login-home" sub="Teacher Console" /></div>
        <div className="fade-up relative max-w-md py-16">
          <span className="overline"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" />Jurnal Guru · Admin</span>
          <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">Masuk ke dashboard penilaian<span className="text-lime-300">.</span></h1>
          <ul className="mt-7 space-y-3">
            {FEATURES.map(([I, txt]) => (
              <li key={txt} className="flex items-center gap-3 text-sm text-zinc-400"><I className="h-4 w-4 text-lime-300" />{txt}</li>
            ))}
          </ul>
          {authError && <p data-testid="text-login-error" className="mt-6 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/20">Login gagal. Silakan coba lagi.</p>}
          <button data-testid="button-google-login" onClick={startGoogleLogin} className="mt-8 flex h-12 items-center gap-3 rounded-xl bg-white px-6 font-bold text-zinc-950 transition-[background-color,transform] hover:bg-lime-200 active:scale-[0.98]">
            <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Masuk dengan Google
          </button>
          <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck className="h-4 w-4" /> Hanya akun guru (admin) yang dapat mengakses dashboard.</p>
        </div>
        <p className="relative text-xs text-zinc-600">Creative Video Project · Musik di Sekitar Kita</p>
      </div>
      <div className="relative hidden lg:block">
        <img src={IMG} alt="Concert crowd" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/40 to-transparent" />
      </div>
    </div>
  );
}
