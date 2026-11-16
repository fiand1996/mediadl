"use client";

import { useState, useRef, useEffect } from "react";
import { MediaFormatOption } from "@/lib/types";
import { ChevronDown, Check, Film, Music, Video, Sparkles } from "lucide-react";

interface FormatSelectorProps {
  formats: MediaFormatOption[];
  activeUrl: string;
  onSelect: (url: string) => void;
}

export function FormatSelector({ formats, activeUrl, onSelect }: FormatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeFormat = formats.find((f) => f.url === activeUrl) || formats[0];

  const getFormatIcon = (f: MediaFormatOption) => {
    if (f.quality.toLowerCase().includes("audio only")) {
      return <Music className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
    }
    if (f.isMerged) {
      return <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    }
    if (f.quality.toLowerCase().includes("video only")) {
      return <Video className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
    return <Film className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 text-xs font-mono transition-all duration-150 shadow-xs cursor-pointer text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <div className="flex items-center gap-2 truncate">
          {activeFormat && getFormatIcon(activeFormat)}
          <span className="font-medium truncate">
            {activeFormat ? activeFormat.quality : "Select Format"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeFormat && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              {activeFormat.ext}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden py-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
            Available Qualities
          </div>
          {formats.map((fmt) => {
            const isSelected = fmt.url === activeUrl;
            return (
              <button
                key={fmt.formatId}
                type="button"
                onClick={() => {
                  onSelect(fmt.url);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/70"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getFormatIcon(fmt)}
                  <span className="truncate">{fmt.quality}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                    {fmt.ext}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
