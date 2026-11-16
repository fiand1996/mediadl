"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/logs", label: "Fetch logs", icon: History },
  { href: "/admin/cookies", label: "Cookie manager", icon: KeyRound },
  { href: "/admin/extensions", label: "Extensions", icon: Puzzle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const getThemeIcon = () => {
    if (resolvedTheme === "light") return <Sun className="h-4 w-4 shrink-0" strokeWidth={1.8} />;
    return <Moon className="h-4 w-4 shrink-0" strokeWidth={1.8} />;
  };

  const getThemeLabel = () => {
    return resolvedTheme === "dark" ? "Dark mode" : "Light mode";
  };

  return (
    <aside
      className={`admin-sidebar flex w-full shrink-0 flex-col border-b transition-all duration-300 lg:min-h-screen lg:border-b-0 lg:border-r ${
        collapsed ? "lg:w-20" : "lg:w-64"
      }`}
    >
      <div className={`admin-brand flex h-[76px] items-center gap-3 px-5 sm:px-7 ${collapsed ? "lg:px-4 lg:justify-center" : "lg:px-6"}`}>
        <div className="admin-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
          MD
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-bold tracking-tight">MediaDL</p>
            <p className="admin-muted mt-0.5 text-[11px]">Administration</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="admin-secondary-button ml-auto hidden h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors lg:flex"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav
        aria-label="Admin navigation"
        className="admin-nav flex gap-1 overflow-x-auto px-3 pb-3 sm:px-5 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-4 lg:py-6"
      >
        {!collapsed && (
          <p className="admin-section-label hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] lg:block">
            Workspace
          </p>
        )}
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={`admin-nav-link flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                active ? "is-active" : ""
              } ${collapsed ? "lg:justify-center lg:px-2.5" : ""}`}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
              <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`admin-sidebar-footer flex items-center gap-2 p-3 sm:px-5 lg:flex-col lg:items-stretch lg:border-t lg:p-4 ${collapsed ? "lg:px-2.5" : ""}`}>
        <button
          onClick={cycleTheme}
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          className={`admin-quiet-link flex min-w-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
            collapsed ? "lg:justify-center lg:px-2.5" : ""
          }`}
        >
          {getThemeIcon()}
          <span className={collapsed ? "lg:hidden" : ""}>{getThemeLabel()}</span>
        </button>

        <Link
          href="/"
          title="Back to app"
          className={`admin-quiet-link flex min-w-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
            collapsed ? "lg:justify-center lg:px-2.5" : ""
          }`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>Back to app</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          title="Sign out"
          className={`admin-quiet-link admin-logout flex min-w-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
            collapsed ? "lg:justify-center lg:px-2.5" : ""
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
