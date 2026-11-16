import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-center items-center p-6 selection:bg-emerald-500 selection:text-black font-sans transition-colors duration-200">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-xl text-center space-y-6">
        
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-semibold uppercase tracking-widest border border-pink-500/20 mb-3">
            404 • Not Found
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Tautan yang Anda tuju tidak tersedia atau format URL media tidak valid.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link href="/">
            <Button
              variant="default"
              className="px-6 gap-2 text-xs py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
          MediaDL Universal Downloader
        </div>
      </div>
    </div>
  );
}
