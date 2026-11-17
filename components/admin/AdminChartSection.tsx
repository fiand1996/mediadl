"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from "recharts";
import { Calendar, Download, RefreshCw, Filter } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";

interface LogItem {
  id: number;
  url: string;
  provider: string;
  status: string;
  statusCode: number;
  errorMessage: string | null;
  cookieUsed: string | null;
  createdAt: string | number | Date;
}

interface AdminChartSectionProps {
  logs: LogItem[];
}

export function AdminChartSection({ logs }: AdminChartSectionProps) {
  const [daysRange, setDaysRange] = useState<number>(7);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute date interval based on selection
  const { startDate, endDate } = useMemo(() => {
    const now = isMounted ? new Date() : new Date("2026-01-01T00:00:00.000Z");
    if (isCustomMode && customStartDate && customEndDate) {
      return {
        startDate: startOfDay(parseISO(customStartDate)),
        endDate: endOfDay(parseISO(customEndDate))
      };
    }
    return {
      startDate: startOfDay(subDays(now, daysRange - 1)),
      endDate: endOfDay(now)
    };
  }, [daysRange, isCustomMode, customStartDate, customEndDate, isMounted]);

  // Aggregate logs by date
  const chartData = useMemo(() => {
    // Build a map for all dates in the range to ensure zero-filled continuous series
    const dateMap = new Map<string, { date: string; displayDate: string; success: number; error: number; total: number }>();
    
    let curr = new Date(startDate);
    const last = new Date(endDate);

    while (curr <= last) {
      const dateKey = format(curr, "yyyy-MM-dd");
      const displayDate = format(curr, "MMM dd");
      dateMap.set(dateKey, {
        date: dateKey,
        displayDate,
        success: 0,
        error: 0,
        total: 0
      });
      curr.setDate(curr.getDate() + 1);
    }

    // Populate with actual logs
    logs.forEach((log) => {
      const logDate = new Date(log.createdAt);
      if (isWithinInterval(logDate, { start: startDate, end: endDate })) {
        const dateKey = format(logDate, "yyyy-MM-dd");
        const entry = dateMap.get(dateKey);
        if (entry) {
          if (log.status === "success") {
            entry.success += 1;
          } else {
            entry.error += 1;
          }
          entry.total += 1;
        }
      }
    });

    return Array.from(dateMap.values());
  }, [logs, startDate, endDate]);

  const totalSuccessInRange = useMemo(() => chartData.reduce((acc, curr) => acc + curr.success, 0), [chartData]);
  const totalErrorInRange = useMemo(() => chartData.reduce((acc, curr) => acc + curr.error, 0), [chartData]);
  const totalRequestsInRange = totalSuccessInRange + totalErrorInRange;

  return (
    <div className="admin-card rounded-2xl border bg-white shadow-xs">
      <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Fetch Logs Analytics</h2>
          <p className="admin-muted mt-1 text-xs">
            Daily success and error counts ({isMounted ? `${format(startDate, "MMM d, yyyy")} – ${format(endDate, "MMM d, yyyy")}` : "Loading..."})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCustomMode ? (
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-1 text-xs">
              <button
                onClick={() => setDaysRange(7)}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  daysRange === 7 
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs" 
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDaysRange(30)}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  daysRange === 30 
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs" 
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDaysRange(90)}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  daysRange === 90 
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs" 
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                90 Days
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-slate-400 dark:text-zinc-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          <button
            onClick={() => {
              setIsCustomMode(!isCustomMode);
              if (!isCustomMode) {
                setCustomStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
                setCustomEndDate(format(new Date(), "yyyy-MM-dd"));
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            {isCustomMode ? "Presets" : "Custom Range"}
          </button>
        </div>
      </div>

      {/* Summary stats for active range */}
      <div className="grid grid-cols-3 gap-px border-b bg-slate-200/60 dark:bg-zinc-800 text-center text-xs">
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4">
          <span className="admin-muted block text-[11px] font-medium text-slate-500 dark:text-zinc-400">Requests in Range</span>
          <span className="mt-1 block text-lg font-bold text-slate-950 dark:text-zinc-100">{totalRequestsInRange}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4">
          <span className="admin-muted block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Successful</span>
          <span className="mt-1 block text-lg font-bold text-emerald-600 dark:text-emerald-400">{totalSuccessInRange}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4">
          <span className="admin-muted block text-[11px] font-medium text-rose-600 dark:text-rose-400">Failed / Errors</span>
          <span className="mt-1 block text-lg font-bold text-rose-600 dark:text-rose-400">{totalErrorInRange}</span>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="p-5 sm:p-6">
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            No fetch log data available for this range.
          </div>
        ) : (
          <div className="h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  interval={chartData.length > 31 ? Math.floor(chartData.length / 10) : 0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--admin-tooltip-bg, #ffffff)", 
                    borderRadius: "12px", 
                    border: "1px solid var(--admin-tooltip-border, #e2e8f0)", 
                    color: "var(--admin-tooltip-color, #0f172a)",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                  cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
                  formatter={(value: any, name: any) => [
                    value, 
                    name === "success" ? "Success Requests" : "Error Requests"
                  ]}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px", color: "var(--admin-tooltip-label, #475569)" }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: "15px", fontSize: "12px" }}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 capitalize">
                      {value === "success" ? "Success" : "Error"}
                    </span>
                  )}
                />
                <Bar dataKey="success" name="success" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="error" name="error" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
