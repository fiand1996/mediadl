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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white ">Fetch Logs & History</h1>
          <p className="text-sm text-zinc-400  mt-1">Detailed record of all media ingestion attempts.</p>
        </div>
        <div className="text-xs  text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Total Logs: <span className="text-white font-bold">{totalLogs}</span>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur">
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-500  py-12 text-center">No logs recorded yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs ">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-medium w-16">ID</th>
                    <th className="pb-3 font-medium w-24">Status</th>
                    <th className="pb-3 font-medium max-w-[200px]">Target URL</th>
                    <th className="pb-3 font-medium max-w-[200px]">Error Details</th>
                    <th className="pb-3 font-medium w-28">Cookie</th>
                    <th className="pb-3 font-medium text-right w-36">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 text-zinc-500">#{log.id}</td>
                      <td className="py-3">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">
                            {log.statusCode || "ERROR"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-zinc-300 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate" title={log.url}>
                            {log.url}
                          </span>
                          <button
                            onClick={() => setSelectedLog({ title: `Target URL (Log #${log.id})`, content: log.url })}
                            className="shrink-0 text-[10px] text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-red-400 max-w-[200px]">
                        {log.errorMessage ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                            <button
                              onClick={() => setSelectedLog({ title: `Error Details (Log #${log.id})`, content: log.errorMessage || "" })}
                              className="shrink-0 text-[10px] text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 px-1.5 py-0.5 rounded border border-red-800/50 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-3 text-zinc-400 truncate max-w-[120px]" title={log.cookieUsed || "N/A"}>
                        {log.cookieUsed || "N/A"}
                      </td>
                      <td className="py-3 text-zinc-500 text-right whitespace-nowrap">
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
                  Showing page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span> ({totalLogs} total logs)
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
