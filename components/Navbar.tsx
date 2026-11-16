import { Languages, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Locale } from "@/i18n/translations";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  brandName: string;
  subtitle: string;
  locale: Locale;
  onToggleLocale: () => void;
}

export function Navbar({ brandName, subtitle, locale, onToggleLocale }: NavbarProps) {
  return (
    <header className="w-full border-b border-slate-200 dark:border-white/10 backdrop-blur-md bg-white/80 dark:bg-black/40 sticky top-0 z-50 transition-colors">
      <div className="max-w-5xl mx-auto px-6 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              {brandName}
            </span>
            <span className="text-[10px] block text-purple-600 dark:text-purple-400 font-medium tracking-widest uppercase">
              {subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleLocale}
            className="rounded-full gap-1.5 h-8.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
            <span>{locale.toUpperCase()}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
