import { db } from "@/db";
import { fetchLogs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogsClient } from "@/components/admin/LogsClient";
import { Suspense } from "react";

interface AdminLogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function LogsContent({ searchParams }: AdminLogsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 15;
  const offset = (page - 1) * pageSize;

  // Get total count
  const countResult = db.select({ count: sql<number>`count(*)` }).from(fetchLogs).get();
  const totalLogs = countResult?.count || 0;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;

  // Get paginated logs
  const logs = db
    .select()
    .from(fetchLogs)
    .orderBy(desc(fetchLogs.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all();

  return (
    <LogsClient 
      logs={logs}
      currentPage={page}
      totalPages={totalPages}
      totalLogs={totalLogs}
      pageSize={pageSize}
    />
  );
}

export default function AdminLogsPage(props: AdminLogsPageProps) {
  return (
    <div className="admin-ui min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      <AdminSidebar />

      <main className="admin-main min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        <Suspense fallback={<div className="text-zinc-500  text-xs p-8">Loading logs...</div>}>
          <LogsContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}
