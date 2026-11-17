"use server";

import { db } from "@/db";
import { extensionStates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { invalidateExtensionStatusCache } from "@/lib/extensionManager";

export async function toggleExtensionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const isEnabledStr = formData.get("isEnabled") as string;
  const isEnabled = isEnabledStr === "true";

  if (id) {
    // Upsert extension state
    const existing = db.select().from(extensionStates).where(eq(extensionStates.id, id)).get();
    if (existing) {
      db.update(extensionStates)
        .set({ isEnabled, updatedAt: new Date() })
        .where(eq(extensionStates.id, id))
        .run();
    } else {
      db.insert(extensionStates)
        .values({ id, isEnabled, updatedAt: new Date() })
        .run();
    }
    invalidateExtensionStatusCache();
    revalidatePath("/admin/extensions");
  }
}
