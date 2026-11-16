import { db } from "@/db";
import { fetchLogs, cookiesConfig } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Activity, CheckCircle2, XCircle, KeyRound } from "lucide-react";

export default function AdminDashboard() {
  const totalLogs = db.select({ count: count() }).from(fetchLogs).get()?.count || 0;
  const successLogs = db.select({ count: count() }).from(fetchLogs).where(eq(fetchLogs.status, "success")).get()?.count || 0;
  const errorLogs = db.select({ count: count() }).from(fetchLogs).where(eq(fetchLogs.status, "error")).get()?.count || 0;
  const totalCookies = db.select({ count: count() }).from(cookiesConfig).get()?.count || 0;
  
  const recentLogs = db.select().from(fetchLogs).orderBy(desc(fetchLogs.createdAt)).limit(5).all();

  const successRate = totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(1) : "100";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
            <p className="text-sm text-zinc-400 mt-1">Real-time metrics and ingestion pipeline status.</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>TOTAL REQUESTS</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{totalLogs}</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>SUCCESS RATE</span>
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{successRate}%</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>FAILED FETCHES</span>
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{errorLogs}</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>ACTIVE COOKIES</span>
                <KeyRound className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{totalCookies}</div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-base font-bold text-white mb-4">Recent Ingestion Logs</h2>
            
            {recentLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No logs recorded yet. Try fetching a media URL.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Provider</th>
                      <th className="pb-3 font-medium">URL</th>
                      <th className="pb-3 font-medium">Cookie Used</th>
                      <th className="pb-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="py-3">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]" title={log.errorMessage || ""}>
                              ERROR
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-zinc-300 uppercase">{log.provider}</td>
                        <td className="py-3 text-zinc-300 max-w-xs truncate">{log.url}</td>
                        <td className="py-3 text-zinc-400">{log.cookieUsed || "N/A"}</td>
                        <td className="py-3 text-zinc-500 text-right">{new Date(log.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
