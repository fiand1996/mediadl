"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        aria-label="Toggle theme"
        className="rounded-full w-9 h-9 p-0 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
      >
        <span className="w-4 h-4" />
      </Button>
    );
  }

  const getLabel = () => {
    if (theme === "system") return "System Theme";
    if (theme === "light") return "Light Theme";
    return "Dark Theme";
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      title={`Theme: ${getLabel()} (Click to cycle)`}
      aria-label={`Current theme: ${theme}. Click to change theme`}
      className="rounded-full gap-1.5 px-2.5 h-8.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
    >
      {theme === "system" ? (
        <>
          <Laptop className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="hidden sm:inline text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">Auto</span>
        </>
      ) : theme === "light" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline text-[11px] font-mono uppercase text-slate-600">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline text-[11px] font-mono uppercase text-slate-400">Dark</span>
        </>
      )}
    </Button>
  );
}
