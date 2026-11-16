"use client";

import { useState, useEffect, useCallback } from "react";
import { dictionary, Locale } from "@/i18n/translations";
import { PostResult } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ExtractionForm } from "@/components/ExtractionForm";
import { SupportedPlatforms } from "@/components/SupportedPlatforms";
import { HowItWorks } from "@/components/HowItWorks";
import { SystemAlert } from "@/components/SystemAlert";
import { ResultCard } from "@/components/ResultCard";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mediadl_locale") as Locale;
      if (saved === "en" || saved === "id") return saved;
    }
    return "en";
  });

  const [url, setUrl] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("url") || "";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostResult | null>(null);
  const [error, setError] = useState("");

  const t = dictionary[locale];

  const toggleLanguage = () => {
    setLocale((prev: Locale) => {
      const next = prev === "id" ? "en" : "id";
      localStorage.setItem("mediadl_locale", next);
      return next;
    });
  };

  const executeExtraction = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setError(t.errorEmptyUrl);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(targetUrl.trim())}`);
      const data = await res.json();

      setLoading(false);

      if (data.success && data.result) {
        setResult(data.result);
      } else {
        setError(data.error || t.errorNotFound);
      }
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Network error occurred while fetching media.";
      setError(message);
    }
  }, [t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialUrl = params.get("url");
    if (initialUrl) {
      const timer = setTimeout(() => {
        executeExtraction(initialUrl);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [executeExtraction]);

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeExtraction(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black font-sans transition-colors duration-200">
      <Navbar
        brandName={t.brandName}
        subtitle={t.subtitle}
        locale={locale}
        onToggleLocale={toggleLanguage}
      />

      <main className="max-w-3xl w-full mx-auto px-6 py-16 flex flex-col items-center flex-1 justify-center">
        <Hero
          badgeText={t.badgeNew}
          titleMain={t.heroTitle}
          titleHighlight={t.heroHighlight}
          description={t.heroDescription}
        />

        <ExtractionForm
          url={url}
          setUrl={setUrl}
          loading={loading}
          onSubmit={handleExtraction}
          placeholderText={t.inputPlaceholder}
          buttonText={t.analyzeBtn}
          processingText={t.analyzingBtn}
        />

        <SystemAlert message={error} />

        {result && (
          <ResultCard
            result={result}
            labels={{
              resultTitle: t.resultTitle,
              downloadSingle: t.downloadSingle,
              downloadZip: t.downloadZip,
              downloadingZip: t.downloadingZip,
              authorVerified: t.authorVerified,
              loadingMedia: t.loadingMedia,
              zipDownloaded: t.zipDownloaded,
              zipError: t.zipError,
              showMore: t.showMore,
              showLess: t.showLess,
            }}
          />
        )}

        <SupportedPlatforms locale={locale} />

        <HowItWorks locale={locale} />
      </main>

      <Footer text={t.footerText} privacy={t.privacyText} />
    </div>
  );
}
