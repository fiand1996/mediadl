"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  toggleExtensionStatus,
  uninstallExtension,
  installOrUpdateExtension,
  fetchRepositoryIndex,
  addExtensionRepository,
  toggleExtensionRepository,
  deleteExtensionRepository,
} from "@/lib/extensionLoader";
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
    toggleExtensionStatus(id, isEnabled);
    invalidateExtensionStatusCache();
    revalidatePath("/admin/extensions");
  }
}

export async function uninstallExtensionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  if (id) {
    uninstallExtension(id);
    invalidateExtensionStatusCache();
    revalidatePath("/admin/extensions");
  }
}

export async function installExtensionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const extensionId = formData.get("id") as string;
  const downloadUrl = formData.get("downloadUrl") as string;
  const repoUrl = (formData.get("repoUrl") as string) || undefined;

  if (!extensionId) {
    throw new Error("Extension ID is required.");
  }

  // 1. Fetch repo index to retrieve extension metadata
  const index = await fetchRepositoryIndex(repoUrl);
  const targetExt = index.extensions.find((e) => e.id === extensionId);

  if (!targetExt) {
    throw new Error(`Extension "${extensionId}" was not found in the repository index.`);
  }

  // 2. Fetch bundle code from download URL
  const targetUrl = downloadUrl || targetExt.downloadUrl;

  if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
    throw new Error(`Valid HTTP download URL is required for extension "${targetExt.name}".`);
  }

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Failed to download extension bundle from ${targetUrl}: HTTP ${res.status}`);
  }
  const bundleCode = await res.text();

  // 3. Install into SQLite database
  installOrUpdateExtension(targetExt, bundleCode);
  invalidateExtensionStatusCache();
  revalidatePath("/admin/extensions");
}

export async function addRepositoryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const url = formData.get("url") as string;

  if (!url) {
    throw new Error("Repository URL is required.");
  }

  addExtensionRepository(name || "Custom Repository", url);
  revalidatePath("/admin/extensions");
}

export async function toggleRepositoryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const isEnabledStr = formData.get("isEnabled") as string;
  const isEnabled = isEnabledStr === "true";

  if (id) {
    toggleExtensionRepository(id, isEnabled);
    revalidatePath("/admin/extensions");
  }
}

export async function deleteRepositoryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  if (id) {
    deleteExtensionRepository(id);
    revalidatePath("/admin/extensions");
  }
}
