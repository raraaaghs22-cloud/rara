import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Loader2, ShieldX } from "lucide-react";
import { api } from "@/lib/api";
import LoginPage from "@/pages/LoginPage";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [checked, setChecked] = useState(!!location.state?.user);

  useEffect(() => {
    if (location.state?.user) return;
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, [location.state]);

  const logout = () => api.post("/auth/logout").finally(() => { setUser(null); setChecked(true); });

  if (!checked) return <div className="flex min-h-screen items-center justify-center bg-[#08080a]"><Loader2 className="h-6 w-6 animate-spin text-lime-300" /></div>;
  if (!user) return <LoginPage authError={location.state?.authError} />;
  if (!user.is_admin) {
    return (
      <div data-testid="banner-not-admin" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08080a] px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/30"><ShieldX className="h-7 w-7 text-rose-400" /></span>
        <p className="font-heading text-xl font-bold text-white">Akses ditolak</p>
        <p className="max-w-sm text-sm text-zinc-400">Akun <b className="text-zinc-200">{user.email}</b> bukan akun guru. Dashboard hanya dapat diakses oleh admin.</p>
        <button data-testid="button-logout-nonadmin" onClick={logout} className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-200 ring-1 ring-white/15 hover:bg-white/5">Keluar & ganti akun</button>
        <Link to="/submit" className="text-sm text-lime-300 hover:underline">Ke halaman pengumpulan</Link>
      </div>
    );
  }
  return children(user, logout);
}
