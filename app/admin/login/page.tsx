"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Globe, KeyRound, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [hasOidc, setHasOidc] = useState(false);
  const [oidcProvider, setOidcProvider] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        setHasOidc(data.hasOidc);
        setOidcProvider(data.oidcProvider);
        setCheckingAuth(false);
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, []);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      setError("An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  const getOidcButtonLabel = () => {
    switch (oidcProvider) {
      case "github": return "Continue with GitHub OIDC";
      case "google": return "Continue with Google OIDC";
      case "custom": return "Continue with Custom OIDC";
      default: return "Continue with OIDC";
    }
  };

  const getOidcProviderId = () => {
    switch (oidcProvider) {
      case "github": return "github";
      case "google": return "google";
      case "custom": return "custom-oidc";
      default: return "";
    }
  };

  if (checkingAuth) {
    return (
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur shadow-2xl flex items-center justify-center  text-xs text-zinc-400 gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Loading authentication config...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold  tracking-tight text-white">Admin Authentication</h1>
        <p className="text-xs text-zinc-400 ">Sign in to manage downloads and system configuration</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs  text-center">
          {error}
        </div>
      )}

      {/* Conditionally render OIDC button ONLY if OIDC_PROVIDER env is active from API */}
      {hasOidc && (
        <>
          <div className="space-y-3">
            <button
              onClick={() => signIn(getOidcProviderId(), { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-sm  text-white transition-all shadow-sm"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{getOidcButtonLabel()}</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-[10px]  uppercase">or database credentials</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>
        </>
      )}

      {/* Database Credentials Form backed by admin_users table */}
      <form onSubmit={handleCredentialsLogin} className="space-y-4 ">
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-400">Admin Email</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-zinc-400">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In with Database</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link href="/" className="text-[11px]  text-zinc-500 hover:text-zinc-400 transition-colors">
          ← Back to Public Downloader
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      <Suspense fallback={<div className="text-zinc-500  text-xs">Loading authentication...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
