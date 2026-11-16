import { AlertTriangle } from "lucide-react";

export function CookieSessionWarning() {
  return (
    <aside className="admin-cookie-warning flex gap-3 rounded-xl border p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-xs font-semibold">Session cookies can expire</p>
        <p className="mt-1 text-xs leading-relaxed">
          The platform may invalidate the session cookie at any time, requiring
          you to log in again. Use at your own risk.
        </p>
      </div>
    </aside>
  );
}
