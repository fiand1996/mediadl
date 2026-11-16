"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Puzzle,
} from "lucide-react";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/logs", label: "Fetch logs", icon: History },
  { href: "/admin/cookies", label: "Cookie manager", icon: KeyRound },
  { href: "/admin/extensions", label: "Extensions", icon: Puzzle },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar flex w-full shrink-0 flex-col border-b lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="admin-brand flex h-[76px] items-center gap-3 px-5 sm:px-7 lg:px-6">
        <div className="admin-brand-mark flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
          MD
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">MediaDL</p>
          <p className="admin-muted mt-0.5 text-[11px]">Administration</p>
        </div>
        <span className="admin-version ml-auto hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex lg:hidden">
          SYSTEM
        </span>
      </div>

      <nav aria-label="Admin navigation" className="admin-nav flex gap-1 overflow-x-auto px-3 pb-3 sm:px-5 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-4 lg:py-6">
        <p className="admin-section-label hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] lg:block">
          Workspace
        </p>
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`admin-nav-link flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                active ? "is-active" : ""
              }`}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer flex items-center gap-2 p-3 sm:px-5 lg:flex-col lg:items-stretch lg:border-t lg:p-4">
        <Link
          href="/"
          className="admin-quiet-link flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className="truncate">Back to app</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="admin-quiet-link admin-logout flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className="truncate">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
