import { db } from "@/db";
import { cookiesConfig } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { registry } from "@/extensions/registry";
import { ExtensionsClient } from "@/components/admin/ExtensionsClient";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Server action to add cookie
async function addCookieAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const provider = formData.get("provider") as string;
  const domains = formData.get("domains") as string;
  const cookieContent = formData.get("cookieContent") as string;

  if (name && cookieContent && provider) {
    db.insert(cookiesConfig).values({
      name,
      provider,
      domains: domains || "",
      cookieContent,
      isActive: true,
      failCount: 0,
    }).run();
    revalidatePath("/admin/extensions");
  }
}

// Server action to update cookie
async function updateCookieAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const domains = formData.get("domains") as string;
  const cookieContent = formData.get("cookieContent") as string;

  if (id && name && cookieContent) {
    db.update(cookiesConfig)
      .set({
        name,
        domains: domains || "",
        cookieContent,
        isActive: true,
        failCount: 0,
      })
      .where(eq(cookiesConfig.id, id))
      .run();
    revalidatePath("/admin/extensions");
  }
}

// Server action to delete cookie
async function deleteCookieAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = Number(formData.get("id"));
  if (id) {
    db.delete(cookiesConfig).where(eq(cookiesConfig.id, id)).run();
    revalidatePath("/admin/extensions");
  }
}

export default function AdminExtensionsPage() {
  const extensions = registry.getAllExtensions().map(ext => ({
    id: ext.id,
    name: ext.name,
    version: ext.version,
    description: ext.description,
    urlPatterns: ext.urlPatterns.map(p => p.toString()),
    cookies: ext.cookies,
  }));

  const allCookies = db.select().from(cookiesConfig).orderBy(desc(cookiesConfig.createdAt)).all();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <ExtensionsClient 
          extensions={extensions}
          allCookies={allCookies}
          addCookieAction={addCookieAction}
          updateCookieAction={updateCookieAction}
          deleteCookieAction={deleteCookieAction}
        />
      </main>
    </div>
  );
}
