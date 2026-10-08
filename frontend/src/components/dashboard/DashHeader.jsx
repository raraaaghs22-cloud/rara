import { LogOut } from "lucide-react";
import { Logo } from "@/components/Badges";

export const DashHeader = ({ user, onLogout }) => (
  <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08080a]/75 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Logo to="/admin" testId="link-admin-home" sub="Teacher Console" />
      <div className="flex items-center gap-3">
        <span className="hidden text-right text-xs sm:block">
          <span className="block font-semibold text-white" data-testid="text-admin-name">{user.name}</span>
          <span className="text-zinc-500">{user.email}</span>
        </span>
        {user.picture && <img src={user.picture} alt="" className="h-9 w-9 rounded-full ring-1 ring-white/10" />}
        <button data-testid="button-logout" onClick={onLogout} className="rounded-xl p-2 text-zinc-400 ring-1 ring-white/10 transition-colors hover:bg-white/5 hover:text-white" title="Logout"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  </header>
);
