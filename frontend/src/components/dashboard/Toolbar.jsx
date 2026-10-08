import { useState } from "react";
import { FileSpreadsheet, FileText, Download, CheckCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api, errMsg } from "@/lib/api";
import { CLASSES } from "@/lib/constants";

const download = async (format, class_name) => {
  try {
    const r = await api.get("/admin/export", { params: { format, ...(class_name && { class_name }) }, responseType: "blob" });
    const name = (r.headers["content-disposition"] || "").match(/filename="(.+)"/)?.[1] || `rekap.${format}`;
    const url = URL.createObjectURL(r.data);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
    toast.success(class_name ? `Rekap Kelas ${class_name} diunduh` : "Rekap 12 kelas diunduh");
  } catch (e) { toast.error(errMsg(e, "Ekspor gagal")); }
};

const Btn = ({ testId, onClick, children }) => (
  <button data-testid={testId} onClick={onClick} className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 transition-colors hover:bg-white/5 hover:text-white">{children}</button>
);

const ExportMenu = () => {
  const [scope, setScope] = useState("all");
  const [open, setOpen] = useState(false);
  const run = (format) => { download(format, scope === "all" ? undefined : scope); setOpen(false); };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button data-testid="button-export" className="flex h-10 items-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200">
          <Download className="h-4 w-4" /> Export to CSV / Excel
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 rounded-2xl border-white/10 bg-zinc-950 p-4" data-testid="export-popover">
        <div>
          <p className="text-sm font-semibold text-white">Rekap nilai</p>
          <p className="text-xs text-zinc-500">Bahan nilai akhir semester</p>
        </div>
        <select data-testid="export-scope-select" value={scope} onChange={(e) => setScope(e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white">
          <option value="all">Semua kelas (12 kelas)</option>
          {CLASSES.map((c) => <option key={c} value={c}>{`Kelas ${c}`}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="button-export-csv" onClick={() => run("csv")} className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"><FileText className="h-4 w-4" /> CSV</button>
          <button data-testid="button-export-excel" onClick={() => run("xlsx")} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-lime-300 text-sm font-bold text-zinc-950 hover:bg-lime-200"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const Toolbar = ({ resultsPublic, setResultsPublic, selected, onBulk }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <label className="flex items-center gap-3 rounded-xl bg-zinc-950/80 px-4 py-2.5 ring-1 ring-white/10">
      <Switch data-testid="switch-toggle-results-public" checked={resultsPublic} onCheckedChange={setResultsPublic} />
      <span className="text-sm text-zinc-300"><b className="text-white">Halaman Cek Nilai siswa</b> <span className="text-zinc-500">· {resultsPublic ? "dibuka (hanya nilai Final)" : "ditutup"}</span></span>
    </label>
    <div className="flex flex-wrap gap-2">
      {selected.length > 0 && (
        <>
          <Btn testId="button-bulk-final" onClick={() => onBulk("final")}><CheckCheck className="h-4 w-4 text-lime-300" /> Finalkan ({selected.length})</Btn>
          <Btn testId="button-bulk-draft" onClick={() => onBulk("draft")}><Undo2 className="h-4 w-4" /> Jadikan Draft</Btn>
        </>
      )}
      <ExportMenu />
    </div>
  </div>
);
