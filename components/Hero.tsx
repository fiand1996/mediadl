
import { Sparkles } from "lucide-react";

interface HeroProps {
  badgeText: string;
  titleMain: string;
  titleHighlight: string;
  description: string;
}

export function Hero({
  badgeText,
  titleMain,
  titleHighlight,
  description,
}: HeroProps) {
  return (
    <div className="relative isolate w-full text-center mb-8">


      {/* Foreground Content */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          {badgeText}
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {titleMain}{" "}
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {titleHighlight}
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
