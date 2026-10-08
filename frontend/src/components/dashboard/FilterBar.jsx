import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSES, PLATFORMS, STATUS_FILTERS } from "@/lib/constants";

const TRIGGER = "h-10 w-full rounded-xl border-white/10 bg-zinc-950/80 text-zinc-200 sm:w-44";

const F = ({ value, onChange, placeholder, items, testId }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger data-testid={testId} className={TRIGGER}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">{placeholder}</SelectItem>
      {items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
    </SelectContent>
  </Select>
);

export const FilterBar = ({ filters, setFilters, count }) => {
  const set = (k) => (v) => setFilters({ ...filters, [k]: v });
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[240px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input data-testid="input-search-journal" placeholder="Cari nama siswa…" className="h-10 rounded-xl border-white/10 bg-zinc-950/80 pl-10 text-white placeholder:text-zinc-600" value={filters.q} onChange={(e) => set("q")(e.target.value)} />
      </div>
      <F testId="filter-class-dropdown" value={filters.class_name} onChange={set("class_name")} placeholder="Semua kelas" items={CLASSES.map((c) => [c, `Kelas ${c}`])} />
      <F testId="filter-status-dropdown" value={filters.status} onChange={set("status")} placeholder="Semua status" items={STATUS_FILTERS} />
      <F testId="filter-platform-dropdown" value={filters.platform} onChange={set("platform")} placeholder="Semua platform" items={Object.entries(PLATFORMS).map(([k, p]) => [k, p.label])} />
      <span className="font-mono text-xs text-zinc-500 sm:ml-auto" data-testid="text-row-count">{count} data</span>
    </div>
  );
};
