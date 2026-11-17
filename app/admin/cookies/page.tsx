import { db } from "@/db";
import { cookiesConfig } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CookiesClient } from "@/components/admin/CookiesClient";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Server action to add engine cookie (yt-dlp or gallery-dl)
async function addCookieManagerAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const provider = (formData.get("provider") as string) || "yt-dlp";
  const domains = formData.get("domains") as string;
  const cookieContent = formData.get("cookieContent") as string;

  if (name && cookieContent) {
    db.insert(cookiesConfig)
      .values({
        name,
        provider,
        domains: domains || "",
        cookieContent,
        isActive: true,
        failCount: 0,
      })
      .run();
    revalidatePath("/admin/cookies");
  }
}

// Server action to update cookie
async function updateCookieManagerAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const provider = formData.get("provider") as string;
  const domains = formData.get("domains") as string;
  const cookieContent = formData.get("cookieContent") as string;

  if (id && name && cookieContent) {
    db.update(cookiesConfig)
      .set({
        name,
        ...(provider ? { provider } : {}),
        domains: domains || "",
        cookieContent,
        isActive: true,
        failCount: 0,
      })
      .where(eq(cookiesConfig.id, id))
      .run();
    revalidatePath("/admin/cookies");
  }
}

// Server action to delete cookie
async function deleteCookieManagerAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = Number(formData.get("id"));
  if (id) {
    db.delete(cookiesConfig).where(eq(cookiesConfig.id, id)).run();
    revalidatePath("/admin/cookies");
  }
}

export default function AdminCookiesPage() {
  // Fetch both yt-dlp and gallery-dl engine cookies
  const cookieManagers = db
    .select()
    .from(cookiesConfig)
    .where(inArray(cookiesConfig.provider, ["yt-dlp", "gallery-dl"]))
    .orderBy(desc(cookiesConfig.createdAt))
    .all();

  return (
    <div className="admin-ui min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      <AdminSidebar />

      <main className="admin-main min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        <CookiesClient
          cookieManagers={cookieManagers}
          addCookieManagerAction={addCookieManagerAction}
          updateCookieManagerAction={updateCookieManagerAction}
          deleteCookieManagerAction={deleteCookieManagerAction}
        />
      </main>
    </div>
  );
}
