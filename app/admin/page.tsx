import { db } from "@/db";
import { fetchLogs, cookiesConfig } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminChartSection } from "@/components/admin/AdminChartSection";
import { Activity, CheckCircle2, XCircle, KeyRound } from "lucide-react";

export default function AdminDashboard() {
  const totalLogs = db.select({ count: count() }).from(fetchLogs).get()?.count || 0;
  const successLogs = db.select({ count: count() }).from(fetchLogs).where(eq(fetchLogs.status, "success")).get()?.count || 0;
  const errorLogs = db.select({ count: count() }).from(fetchLogs).where(eq(fetchLogs.status, "error")).get()?.count || 0;
  const totalCookies = db.select({ count: count() }).from(cookiesConfig).get()?.count || 0;
  
  const recentLogs = db.select().from(fetchLogs).orderBy(desc(fetchLogs.createdAt)).limit(5).all();

  // Fetch all logs or sufficient historical logs for the chart (e.g. up to 1000 latest or all within range)
  const allLogsForChart = db.select().from(fetchLogs).orderBy(desc(fetchLogs.createdAt)).limit(1000).all().map(log => ({
    ...log,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString()
  }));

  const successRate = totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(1) : "100";

  return (
    <div className="admin-ui min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 flex flex-col lg:flex-row font-sans">
      <AdminSidebar />

      <main className="admin-main min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        <div className="admin-page mx-auto max-w-6xl space-y-8">
          <div className="admin-page-heading flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="admin-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]">Media Downloader</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-zinc-100">Dashboard Overview</h1>
              <p className="admin-muted mt-2 text-sm">Track download success rates, media fetch history, and cookie profiles.</p>
            </div>
            <div className="admin-date-pill inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium">
              <span className="admin-status-dot h-2 w-2 rounded-full" />
              Live activity
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="admin-metric rounded-2xl border p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="admin-muted text-xs font-medium">Total requests</span>
                <span className="admin-icon-tile flex h-9 w-9 items-center justify-center rounded-xl">
                  <Activity className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-950">{totalLogs}</div>
              <p className="admin-muted mt-1.5 text-[11px]">All recorded fetch attempts</p>
            </div>

            <div className="admin-metric rounded-2xl border p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="admin-muted text-xs font-medium">Success rate</span>
                <span className="admin-icon-tile admin-icon-green flex h-9 w-9 items-center justify-center rounded-xl">
                  <CheckCircle2 className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-950">{successRate}%</div>
              <p className="admin-muted mt-1.5 text-[11px]">Successful requests to date</p>
            </div>

            <div className="admin-metric rounded-2xl border p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="admin-muted text-xs font-medium">Failed fetches</span>
                <span className="admin-icon-tile admin-icon-red flex h-9 w-9 items-center justify-center rounded-xl">
                  <XCircle className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-950">{errorLogs}</div>
              <p className="admin-muted mt-1.5 text-[11px]">Requests that need attention</p>
            </div>

            <div className="admin-metric rounded-2xl border p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="admin-muted text-xs font-medium">Cookie profiles</span>
                <span className="admin-icon-tile admin-icon-blue flex h-9 w-9 items-center justify-center rounded-xl">
                  <KeyRound className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-950">{totalCookies}</div>
              <p className="admin-muted mt-1.5 text-[11px]">Configured across providers</p>
            </div>
          </div>

          {/* Analytics Chart Section */}
          <AdminChartSection logs={allLogsForChart} />

          <div className="admin-card overflow-hidden rounded-2xl border">
            <div className="flex items-center justify-between border-b px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent fetch activity</h2>
                <p className="admin-muted mt-1 text-xs">The latest media requests processed by the system.</p>
              </div>
              <span className="admin-count-badge rounded-full px-2.5 py-1 text-[11px] font-semibold">{recentLogs.length} recent</span>
            </div>
            
            {recentLogs.length === 0 ? (
              <p className="admin-muted py-14 text-center text-sm">No logs recorded yet. Try fetching a media URL.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table w-full min-w-[680px] text-left text-xs">
                  <thead>
                    <tr className="border-b text-[10px] uppercase tracking-wider">
                      <th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
                      <th className="px-4 py-3.5 font-semibold">Provider</th>
                      <th className="px-4 py-3.5 font-semibold">URL</th>
                      <th className="px-4 py-3.5 font-semibold">Cookie used</th>
                      <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="transition-colors">
                        <td className="px-5 py-4 sm:px-6">
                          {log.status === "success" ? (
                            <span className="admin-status-success inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Success
                            </span>
                          ) : (
                            <span className="admin-status-error inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold" title={log.errorMessage || ""}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-medium uppercase">{log.provider}</td>
                        <td className="admin-cell-muted max-w-xs truncate px-4 py-4" title={log.url}>{log.url}</td>
                        <td className="admin-cell-muted px-4 py-4">{log.cookieUsed || "N/A"}</td>
                        <td className="admin-cell-muted whitespace-nowrap px-5 py-4 text-right sm:px-6">{new Date(log.createdAt).toLocaleTimeString()}</td>
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
