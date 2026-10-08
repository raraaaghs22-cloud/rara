import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Toolbar } from "@/components/dashboard/Toolbar";
import { JournalTable } from "@/components/dashboard/JournalTable";
import { ReviewSheet } from "@/components/dashboard/ReviewSheet";
import { DeleteDialog } from "@/components/dashboard/DeleteDialog";

const INIT = { q: "", class_name: "all", platform: "all", status: "all" };

export default function Dashboard({ user, onLogout }) {
  const [filters, setFilters] = useState(INIT);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [resultsPublic, setRP] = useState(false);
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const load = useCallback(async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== "all"));
    try {
      const [r, st] = await Promise.all([api.get("/admin/submissions", { params }), api.get("/admin/stats")]);
      setRows(r.data);
      setStats(st.data);
    } catch (e) { toast.error(errMsg(e, "Gagal memuat data")); }
  }, [filters]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get("/admin/settings").then((r) => setRP(r.data.results_public)).catch(() => {}); }, []);
  useEffect(() => {
    if (!rows.some((r) => ["pending", "processing"].includes(r.status))) return;
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [rows, load]);

  const toggleRP = async (v) => {
    setRP(v);
    await api.put("/admin/settings", { results_public: v });
    toast.success(v ? "Halaman Cek Nilai dibuka untuk siswa" : "Halaman Cek Nilai ditutup");
  };
  const bulk = async (status) => {
    try {
      const r = await api.post("/admin/bulk-status", { ids: selected, status });
      toast.success(`${r.data.updated} data diubah menjadi ${status === "final" ? "Final" : "Draft"}`);
      setSelected([]);
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const onDeleted = (id) => {
    setRows((p) => p.filter((r) => r.id !== id));
    setSelected((p) => p.filter((x) => x !== id));
    api.get("/admin/stats").then((r) => setStats(r.data));
  };

  return (
    <div className="relative min-h-screen bg-[#08080a]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] glow-lime" />
      <DashHeader user={user} onLogout={onLogout} />
      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="fade-up flex flex-col gap-2">
          <span className="overline w-fit"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" />Musik di Sekitar Kita</span>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Jurnal Kelas XI-1 – XI-12</h1>
          <p className="text-sm text-zinc-500">Hasil AI masuk sebagai <b className="text-violet-300">Draft</b>. Tinjau, edit, lalu simpan permanen sebagai <b className="text-lime-300">Final</b>.</p>
        </div>
        <StatsRow stats={stats} activeClass={filters.class_name} onPickClass={(c) => setFilters({ ...filters, class_name: c })} />
        <Toolbar resultsPublic={resultsPublic} setResultsPublic={toggleRP} selected={selected} onBulk={bulk} />
        <FilterBar filters={filters} setFilters={setFilters} count={rows.length} />
        <JournalTable rows={rows} selected={selected} setSelected={setSelected} onOpen={setOpenId} onDelete={setDelTarget} />
      </main>
      <ReviewSheet id={openId} onClose={() => setOpenId(null)} onChanged={load} />
      <DeleteDialog target={delTarget} onClose={() => setDelTarget(null)} onDeleted={onDeleted} />
    </div>
  );
}
