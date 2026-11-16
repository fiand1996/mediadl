"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, History, KeyRound, Puzzle, ArrowLeft, LogOut } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        <div className="h-20 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-black ">
              MH
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white ">
                Admin Console
              </span>
              <span className="text-[10px] block text-emerald-400 ">
                MediaDL v2.4
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1  text-xs">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/admin"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/logs"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/admin/logs"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <History className="w-4 h-4 text-teal-400" />
            <span>Fetch Logs</span>
          </Link>
          <Link
            href="/admin/cookies"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/admin/cookies"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>Cookie Manager</span>
          </Link>
          <Link
            href="/admin/extensions"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/admin/extensions"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <Puzzle className="w-4 h-4 text-indigo-400" />
            <span>Extensions</span>
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-900  text-xs space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:border hover:border-red-500/20 transition-all text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
