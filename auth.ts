import type { Provider } from "next-auth/providers";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";

const oidcProviderType = process.env.OIDC_PROVIDER || "";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(originalHash, "hex"));
    } catch {
      return false;
    }
  }

  // Legacy SHA-256 fallback with timing-safe comparison (for seamless migration)
  const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
  if (storedHash.length === 64) {
    try {
      return crypto.timingSafeEqual(Buffer.from(legacyHash, "hex"), Buffer.from(storedHash, "hex"));
    } catch {
      return false;
    }
  }

  return false;
}

const getProviders = (): Provider[] => {
  const providers: Provider[] = [
    Credentials({
      name: "Admin Database Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const { db } = await import("@/db");
        const { adminUsers } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const allAdmins = db.select().from(adminUsers).all();
        if (allAdmins.length === 0) {
          db.insert(adminUsers).values({
            email: "admin@example.com",
            passwordHash: hashPassword("admin123"),
            name: "Super Admin",
          }).run();
        }

        const admin = db.select().from(adminUsers).where(eq(adminUsers.email, email)).get();

        if (admin && verifyPassword(password, admin.passwordHash)) {
          // If stored hash is still legacy SHA-256, seamlessly upgrade to salted scrypt
          if (!admin.passwordHash.startsWith("scrypt:")) {
            const upgradedHash = hashPassword(password);
            db.update(adminUsers)
              .set({ passwordHash: upgradedHash })
              .where(eq(adminUsers.id, admin.id))
              .run();
          }

          return {
            id: admin.id.toString(),
            name: admin.name,
            email: admin.email,
          };
        }

        return null;
      }
    })
  ];

  if (oidcProviderType === "github") {
    providers.push(GitHub);
  } else if (oidcProviderType === "google") {
    providers.push(Google);
  } else if (oidcProviderType === "custom") {
    providers.push({
      id: "custom-oidc",
      name: "Custom OIDC",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
    });
  }

  return providers;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: getProviders(),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      if (oidcProviderType) {
        const { db } = await import("@/db");
        const { adminUsers } = await import("@/db/schema");
        const crypto = await import("crypto");

        const admins = db.select().from(adminUsers).all();
        if (admins.length === 0) {
          db.insert(adminUsers).values({
            email: user.email,
            passwordHash: hashPassword(crypto.randomBytes(32).toString("hex")),
            name: user.name || "OIDC Admin",
          }).run();
          return true;
        }
        return admins.some(a => a.email === user.email);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/admin/login",
  },
});
