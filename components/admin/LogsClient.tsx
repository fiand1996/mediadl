"use client";

import React, { useState } from "react";
import { LogDetailsModal } from "./LogDetailsModal";

interface LogEntry {
  id: number;
  url: string;
  provider: string;
  status: string;
  statusCode: number;
  errorMessage: string | null;
  cookieUsed: string | null;
  createdAt: Date;
}

interface LogsClientProps {
  logs: LogEntry[];
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  pageSize: number;
}

export function LogsClient({ logs, currentPage, totalPages, totalLogs, pageSize }: LogsClientProps) {
  const [selectedLog, setSelectedLog] = useState<{ title: string; content: string } | null>(null);

  return (
    <div className="admin-page mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="admin-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]">Observability</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Fetch logs</h1>
          <p className="admin-muted mt-2 text-sm">A detailed record of media requests and their outcomes.</p>
        </div>
        <div className="admin-count-badge self-start rounded-xl border px-3.5 py-2 text-xs font-medium sm:self-auto">
          Total logs <span className="ml-1 font-bold">{totalLogs}</span>
        </div>
      </div>

      <div className="admin-card overflow-hidden rounded-2xl border p-4 sm:p-6">
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-500  py-12 text-center">No logs recorded yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table w-full min-w-[880px] text-left text-xs">
                <thead>
                <tr className="border-b text-[10px] uppercase tracking-wider">
                  <th className="px-3 py-3.5 font-semibold">ID</th>
                  <th className="px-3 py-3.5 font-semibold">Status</th>
                  <th className="px-3 py-3.5 font-semibold">Target URL</th>
                  <th className="px-3 py-3.5 font-semibold">Error details</th>
                  <th className="px-3 py-3.5 font-semibold">Cookie</th>
                  <th className="px-3 py-3.5 text-right font-semibold">Timestamp</th>
                  </tr>
                </thead>
              <tbody className="divide-y">
                  {logs.map((log) => (
                  <tr key={log.id} className="transition-colors">
                    <td className="admin-cell-muted px-3 py-4 font-mono">#{log.id}</td>
                    <td className="px-3 py-4">
                        {log.status === "success" ? (
                        <span className="admin-status-success inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" /> Success
                          </span>
                        ) : (
                        <span className="admin-status-error inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {log.statusCode || "ERROR"}
                        </span>
                      )}
                    </td>
                    <td className="admin-cell-strong max-w-[240px] px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className="truncate" title={log.url}>
                            {log.url}
                          </span>
                          <button
                            onClick={() => setSelectedLog({ title: `Target URL (Log #${log.id})`, content: log.url })}
                            className="admin-secondary-button shrink-0 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                      <td className="max-w-[200px] px-3 py-4 text-red-600">
                        {log.errorMessage ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                            <button
                              onClick={() => setSelectedLog({ title: `Error Details (Log #${log.id})`, content: log.errorMessage || "" })}
                              className="admin-danger-button shrink-0 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="admin-cell-muted max-w-[120px] truncate px-3 py-4" title={log.cookieUsed || "N/A"}>
                        {log.cookieUsed || "N/A"}
                      </td>
                      <td className="admin-cell-muted whitespace-nowrap px-3 py-4 text-right">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-800/80 text-xs ">
                <div className="text-zinc-400">
                  Showing{" "}
                  <span className="text-white font-bold">
                    {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalLogs)}
                  </span>{" "}
                  of <span className="text-white font-bold">{totalLogs}</span> logs
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/admin/logs?page=${currentPage - 1}`}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      currentPage <= 1
                        ? "pointer-events-none opacity-40 bg-zinc-900 border-zinc-800 text-zinc-600"
                        : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200"
                    }`}
                  >
                    Previous
                  </a>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="text-zinc-600 px-1">...</span>}
                            <a
                              href={`/admin/logs?page=${p}`}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${
                                p === currentPage
                                  ? "bg-zinc-800 border-zinc-700 text-white font-bold"
                                  : "bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {p}
                            </a>
                          </React.Fragment>
                        );
                      })}
                  </div>
                  <a
                    href={`/admin/logs?page=${currentPage + 1}`}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-40 bg-zinc-900 border-zinc-800 text-zinc-600"
                        : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200"
                    }`}
                  >
                    Next
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LogDetailsModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.title || ""}
        content={selectedLog?.content || ""}
      />
    </div>
  );
}
