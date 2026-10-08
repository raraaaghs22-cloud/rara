import { useState } from "react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const DeleteDialog = ({ target, onClose, onDeleted }) => {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/submissions/${target.id}`);
      toast.success("Data berhasil dihapus");
      onDeleted(target.id);
      onClose();
    } catch (e) { toast.error(errMsg(e, "Gagal menghapus data")); } finally { setBusy(false); }
  };
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent data-testid="delete-confirm-dialog" className="rounded-2xl border-white/10 bg-zinc-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Hapus Data</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400" data-testid="text-delete-confirm">
            Apakah Anda yakin ingin menghapus data ini? Data tidak dapat dikembalikan
          </AlertDialogDescription>
          {target && <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-300"><b className="text-white">{target.full_name}</b> · Kelas {target.class_name} · Absen {target.attendance_number}</p>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-delete-cancel" className="rounded-xl border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white">Batal</AlertDialogCancel>
          <AlertDialogAction data-testid="button-delete-confirm" disabled={busy} onClick={(e) => { e.preventDefault(); confirm(); }} className="rounded-xl bg-red-600 text-white hover:bg-red-500">
            {busy ? "Menghapus..." : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
