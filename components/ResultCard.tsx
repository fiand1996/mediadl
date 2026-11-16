"use client";

import {
  Download,
  FileArchive,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PostResult, MediaItem, MediaFormatOption } from "@/lib/types";
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FormatSelector } from "@/components/FormatSelector";

function sanitizeCaption(text: string): string {
  if (!text) return "";
  return text
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(
      /<a\b[^>]*href=["'](?:\/jump\.php\?)?([^"']+)["'][^>]*>(.*?)<\/a>/gi,
      (_, targetUrl, linkText) => {
        try {
          return decodeURIComponent(targetUrl);
        } catch {
          return linkText || targetUrl;
        }
      },
    )
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface ResultCardProps {
  result: PostResult;
  labels: {
    resultTitle: string;
    downloadSingle: string;
    downloadZip: string;
    downloadingZip: string;
    authorVerified: string;
    loadingMedia: string;
    zipDownloaded: string;
    zipError: string;
    showMore: string;
    showLess: string;
  };
}

export function ResultCard({ result, labels }: ResultCardProps) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [loadedMedia, setLoadedMedia] = useState<Record<number, boolean>>({});

  // Track selected quality URL per item index
  const [selectedFormats, setSelectedFormats] = useState<
    Record<number, string>
  >({});
  // Track download loading status per item index
  const [downloadingItems, setDownloadingItems] = useState<
    Record<number, boolean>
  >({});
  // Track caption expansion toggle
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const handleFormatChange = (index: number, url: string) => {
    setSelectedFormats((prev) => ({ ...prev, [index]: url }));
  };

  const handleMediaLoad = (index: number) => {
    setLoadedMedia((prev) => ({ ...prev, [index]: true }));
  };

  const handleDownloadSingle = async (
    index: number,
    url: string,
    filename: string,
  ) => {
    setDownloadingItems((prev) => ({ ...prev, [index]: true }));

    const downloadUrl = url.startsWith("/")
      ? url.includes("filename=")
        ? url
        : `${url}&filename=${encodeURIComponent(filename)}`
      : `/api/stream?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Download failed with status ${res.status}`);
      }
      const blob = await res.blob();
      saveAs(blob, filename);
    } catch (err: unknown) {
      console.warn(
        "Direct blob download failed, falling back to browser navigation download:",
        err,
      );
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingItems((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`media_${result.id}`);

      const promises = result.items.map(
        async (item: MediaItem, idx: number) => {
          const activeUrl = selectedFormats[idx] || item.url;
          const selectedFmt = item.formats?.find(
            (f: MediaFormatOption) => f.url === activeUrl,
          );
          const ext =
            selectedFmt?.ext || (item.type === "video" ? "mp4" : "jpg");
          const filename = `media_${idx + 1}.${ext}`;

          const fetchUrl = activeUrl.startsWith("/")
            ? activeUrl
            : `/api/stream?url=${encodeURIComponent(activeUrl)}&filename=${encodeURIComponent(filename)}`;

          try {
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            folder?.file(filename, blob);
          } catch {
            folder?.file(`${filename}_url.txt`, activeUrl);
          }
        },
      );

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `media_archive_${result.id}.zip`);

      setDownloadingZip(false);
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to generate ZIP:", error);
      setDownloadingZip(false);
      alert(labels.zipError);
    }
  };

  const avatarSrc = result.author.avatar
    ? result.author.avatar.startsWith("/api/proxy") ||
      result.author.avatar.startsWith("/api/stream")
      ? result.author.avatar
      : `/api/proxy?url=${encodeURIComponent(result.author.avatar)}`
    : "";

  return (
    <Card
      variant="glass"
      className="w-full mt-8 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans"
    >
      {/* Header Info Author */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          {avatarSrc && !avatarError ? (
            <img
              src={avatarSrc}
              alt={result.author.username}
              onError={() => setAvatarError(true)}
              className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              {result.author.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                @{result.author.username}
              </span>
              {result.author.verified && (
                <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-full font-bold">
                  ✓
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {result.platform}
            </span>
          </div>
        </div>

        {result.items.length > 1 && (
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="gap-2 text-xs cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-600/25 disabled:opacity-70"
          >
            {downloadingZip ? (
              <>
                <FileArchive className="w-4 h-4 animate-bounce" />
                {labels.downloadingZip}
              </>
            ) : zipSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                {labels.zipDownloaded}
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" />
                {labels.downloadZip} ({result.items.length} files)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Caption with dynamic truncation & expand/collapse */}
      {result.caption &&
        (() => {
          const cleanText = sanitizeCaption(result.caption);
          if (!cleanText) return null;
          const isLongText =
            cleanText.length > 180 || cleanText.split("\n").length > 3;

          return (
            <div className="w-full my-4 bg-slate-100 dark:bg-white/[0.02] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-left">
              <p
                className={`text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans ${
                  !isCaptionExpanded && isLongText ? "line-clamp-3" : ""
                }`}
              >
                {cleanText}
              </p>
              {isLongText && (
                <button
                  type="button"
                  onClick={() => setIsCaptionExpanded((prev) => !prev)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 cursor-pointer focus:outline-none"
                >
                  {isCaptionExpanded ? (
                    <>
                      <span>{labels.showLess}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>{labels.showMore}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })()}

      {/* Media Grid / List with Custom Format Selector */}
      <div
        className={`grid gap-6 mt-4 ${result.items.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
      >
        {result.items.map((item: MediaItem, index: number) => {
          const isLoaded = loadedMedia[index];
          const activeUrl = selectedFormats[index] || item.url;
          const isDownloading = Boolean(downloadingItems[index]);

          return (
            <div
              key={item.id || index}
              className="bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col justify-between group p-4 space-y-4 shadow-sm"
            >
              {/* Custom Quality Selector */}
              {item.formats && item.formats.length > 0 && (
                <div className="flex flex-col gap-1.5 bg-slate-100 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 font-mono">
                    Quality / Resolution:
                  </span>
                  <FormatSelector
                    formats={item.formats}
                    activeUrl={activeUrl}
                    onSelect={(url) => handleFormatChange(index, url)}
                  />
                </div>
              )}

              {/* Media Preview (Video or Image) */}
              {item.type === "video" ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
                  <video
                    src={
                      activeUrl.startsWith("/api/stream") ? item.url : activeUrl
                    }
                    poster={item.thumbnail}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
                  {!isLoaded && (
                    <div className="absolute inset-0 z-10 bg-slate-200 dark:bg-zinc-900 animate-pulse flex flex-col items-center justify-center gap-2 border border-slate-300 dark:border-white/5">
                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium tracking-wide">
                        {labels.loadingMedia}
                      </span>
                    </div>
                  )}
                  <img
                    src={activeUrl}
                    alt={`Media ${index + 1}`}
                    onLoad={() => handleMediaLoad(index)}
                    onError={() => handleMediaLoad(index)}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                  />
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                {(() => {
                  const selectedFmt = item.formats?.find(
                    (f: MediaFormatOption) => f.url === activeUrl,
                  );
                  const currentQuality =
                    selectedFmt?.quality || item.quality || "High Resolution";
                  const ext =
                    selectedFmt?.ext || (item.type === "video" ? "mp4" : "jpg");
                  const filename = `media_${result.id}_${index + 1}.${ext}`;
                  return (
                    <>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono flex items-center justify-between">
                        <span className="truncate mr-2">
                          Quality: {currentQuality}
                        </span>
                        <span className="shrink-0">
                          {item.duration ? `Duration: ${item.duration}` : ""}
                        </span>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isDownloading}
                        onClick={() =>
                          handleDownloadSingle(index, activeUrl, filename)
                        }
                        className="w-full gap-2 text-xs py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold cursor-pointer shadow-lg shadow-purple-600/25 transition-all"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>{labels.downloadSingle}</span>
                          </>
                        )}
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
