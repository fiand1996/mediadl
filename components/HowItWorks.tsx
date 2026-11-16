"use client";

import { useState, useEffect } from "react";
import { Locale } from "@/i18n/translations";
import { Copy, Link2, DownloadCloud, Globe } from "lucide-react";

interface HowItWorksProps {
  locale: Locale;
}

export function HowItWorks({ locale }: HowItWorksProps) {
  const isId = locale === "id";
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    fetch("/api/config/app-url")
      .then((res) => res.json())
      .then((data) => {
        if (data.appUrl) {
          setAppUrl(data.appUrl);
        }
      })
      .catch(() => {});
  }, []);

  const baseUrl = appUrl.replace(/\/+$/, "");
  const displayHost = baseUrl.replace(/^https?:\/\//, "");

  const steps = [
    {
      step: "01",
      icon: <Copy className="w-5 h-5 text-emerald-400" />,
      title: isId ? "Salin Tautan" : "Copy the URL",
      desc: isId 
        ? "Salin tautan dari video, post, atau ilustrasi dari platform yang didukung." 
        : "Copy the link from any video, post, or illustration from supported platforms.",
    },
    {
      step: "02",
      icon: <Link2 className="w-5 h-5 text-teal-400" />,
      title: isId ? "Tempel Tautan" : "Paste the link",
      desc: isId 
        ? "Tempel tautan tersebut ke kolom input di atas lalu klik Ambil Media." 
        : "Paste the link into the input box above and click Fetch Media.",
    },
    {
      step: "03",
      icon: <DownloadCloud className="w-5 h-5 text-cyan-400" />,
      title: isId ? "Unduh" : "Download",
      desc: isId 
        ? "Unduh file tunggal dalam kualitas HD atau unduh semua sekaligus via ZIP." 
        : "Download single files in HD quality or get everything at once via ZIP.",
    },
  ];

  return (
    <div className="w-full mt-16 pt-12 border-t border-slate-200 dark:border-white/10 font-sans">
      <div className="text-center mb-8">
        <h3 className="text-xs font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
          {isId ? "PANDUAN PRAKTIS" : "QUICK GUIDE"}
        </h3>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {isId ? "Semudah Menyalin & Menempel Tautan" : "As Easy as Copy, Paste, & Save"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {steps.map((s, idx) => (
          <div 
            key={idx}
            className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center">
                {s.icon}
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-600">{s.step}</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">{s.title}</h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Direct URL Shortcut Feature Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 dark:from-emerald-950/40 dark:via-zinc-900/80 dark:to-zinc-900 border border-emerald-500/20 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
            <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold tracking-wider uppercase mb-2 border border-emerald-500/20">
                {isId ? "Fitur Pintasan URL" : "Direct URL Shortcut"}
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">
                {isId ? "Unduh Instan via URL Browser" : "Instant Download via Browser URL"}
              </h4>
              
              <div className="w-full my-3 bg-white dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 px-4 py-3 rounded-xl font-mono text-[11px] text-emerald-600 dark:text-emerald-400 select-all shadow-inner overflow-x-auto whitespace-nowrap">
                <span className="text-slate-400 dark:text-zinc-500">{baseUrl}/</span>https://www.instagram.com/p/Bsyq4yVH8Mh
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                {isId 
                  ? `Anda dapat langsung menambahkan tautan media di belakang domain (contoh: ${displayHost}/https://www.instagram.com/p/...) untuk langsung mengunduh tanpa perlu menyalin ke kotak input.`
                  : `You can directly append any media URL right after the domain (e.g. ${displayHost}/https://www.instagram.com/p/...) to automatically fetch and download without pasting.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
