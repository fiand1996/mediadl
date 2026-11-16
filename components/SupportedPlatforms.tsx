import { Globe2 } from "lucide-react";
import { Locale } from "@/i18n/translations";

interface SupportedPlatformsProps {
  locale: Locale;
}

export function SupportedPlatforms({ locale }: SupportedPlatformsProps) {
  const isId = locale === "id";

  const platforms = [
    {
      name: "Instagram",
      tag: "Reels & Post",
      color: "hover:text-pink-500 hover:border-pink-500/30 dark:hover:border-pink-500/30",
      bgGradient: "group-hover:from-pink-500/10 group-hover:to-purple-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: "YouTube",
      tag: "Video, Shorts & Audio",
      color: "hover:text-red-500 hover:border-red-500/30 dark:hover:border-red-500/30",
      bgGradient: "group-hover:from-red-500/10 group-hover:to-orange-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      name: "TikTok",
      tag: "HD Video & Sound",
      color: "hover:text-cyan-400 hover:border-cyan-400/30 dark:hover:border-cyan-400/30",
      bgGradient: "group-hover:from-cyan-500/10 group-hover:to-pink-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
    },
    {
      name: "X / Twitter",
      tag: "Video & Media",
      color: "hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-zinc-500",
      bgGradient: "group-hover:from-slate-500/10 group-hover:to-zinc-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: "Pixiv",
      tag: "Illustrations & Manga",
      color: "hover:text-blue-500 hover:border-blue-500/30 dark:hover:border-blue-500/30",
      bgGradient: "group-hover:from-blue-500/10 group-hover:to-cyan-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1.65 14.55h-2.12v-2.09h-.08a3.15 3.15 0 0 1-2.6 1.25c-2.34 0-4-1.85-4-4.57 0-2.82 1.83-4.63 4.2-4.63a3 3 0 0 1 2.45 1.14h.07V6.09h2.08zm-2.08-5.41a2.38 2.38 0 0 0-2.35-2.5 2.48 2.48 0 0 0-2.52 2.5 2.5 2.5 0 0 0 2.52 2.53 2.39 2.39 0 0 0 2.35-2.53z"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      tag: "Reels & Watch",
      color: "hover:text-blue-600 hover:border-blue-600/30 dark:hover:border-blue-600/30",
      bgGradient: "group-hover:from-blue-600/10 group-hover:to-indigo-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: "Reddit",
      tag: "Clips & Galleries",
      color: "hover:text-orange-500 hover:border-orange-500/30 dark:hover:border-orange-500/30",
      bgGradient: "group-hover:from-orange-500/10 group-hover:to-amber-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
    },
    {
      name: "Pinterest",
      tag: "Pins & Stories",
      color: "hover:text-red-600 hover:border-red-600/30 dark:hover:border-red-600/30",
      bgGradient: "group-hover:from-red-600/10 group-hover:to-pink-500/10",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12.004-5.373 12.004-12C24.01 5.367 18.643 0 12.017 0z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full mt-12 pt-10 border-t border-slate-200 dark:border-white/10 font-sans">
      <div className="text-center mb-6">
        <h3 className="text-xs font-semibold tracking-widest text-pink-600 dark:text-pink-400 uppercase mb-1.5">
          {isId ? "KOMPATIBILITAS TINGGI" : "HIGH COMPATIBILITY"}
        </h3>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {isId ? "Platform yang Didukung" : "Supported Platforms"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          {isId 
            ? "Mendukung berbagai platform media sosial terbesar di dunia dan ribuan situs web lainnya." 
            : "Supports the world's leading social media platforms plus thousands more websites."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {platforms.map((p, idx) => (
          <div
            key={idx}
            className={`group p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 backdrop-blur-sm transition-all duration-200 shadow-xs flex flex-col justify-between relative overflow-hidden ${p.color}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${p.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
            
            <div className="flex items-center space-x-3 mb-2 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                {p.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate group-hover:text-inherit">
                  {p.name}
                </h4>
              </div>
            </div>
            
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate relative z-10">
              {p.tag}
            </span>
          </div>
        ))}

        {/* 1,000+ More Card */}
        <div className="group p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-500/20 dark:border-purple-500/30 backdrop-blur-sm transition-all duration-200 shadow-xs flex flex-col justify-between relative overflow-hidden col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-4 hover:border-purple-500/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-purple-500/30">
                <Globe2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isId ? "+1.000 Platform Lainnya" : "+1,000 More Websites"}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {isId ? "Deteksi Otomatis" : "Auto-Detected"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
                  {isId 
                    ? "Mendukung SoundCloud, Vimeo, Bilibili, Dailymotion, dan ribuan situs video & musik lainnya." 
                    : "Supports SoundCloud, Vimeo, Bilibili, Dailymotion, and thousands of other video & music sites."}
                </p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
              {isId ? "Video & Audio Kualitas Penuh" : "Full Quality Video & Audio"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
