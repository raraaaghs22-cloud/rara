import { NavLink, Link } from "react-router-dom";
import { Logo } from "@/components/Badges";
import { useLang } from "@/lib/i18n";

const LangToggle = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full bg-zinc-900 p-0.5 text-xs font-bold ring-1 ring-white/10">
      {["id", "en"].map((l) => (
        <button
          key={l}
          data-testid={`button-lang-${l}`}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1 uppercase transition-colors ${lang === l ? "bg-lime-300 text-zinc-950" : "text-zinc-400 hover:text-white"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

const navCls = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`;

export default function PublicShell({ children }) {
  const { t } = useLang();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080a]">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-0 glow-lime" />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08080a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1">
            <NavLink to="/submit" className={navCls} data-testid="nav-submit">{t.navSubmit}</NavLink>
            <NavLink to="/results" className={navCls} data-testid="nav-results">{t.navResults}</NavLink>
          </nav>
          <LangToggle />
        </div>
      </header>
      <main className="relative">{children}</main>
      <footer className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-10 text-xs text-zinc-600 sm:px-6">
        <span>© VIBESMAI · Seni Musik</span>
        <Link to="/admin" className="transition-colors hover:text-zinc-300" data-testid="link-teacher-login">Teacher / Guru</Link>
      </footer>
    </div>
  );
}
