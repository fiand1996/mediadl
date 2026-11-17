import { useId, useState } from "react";
import { Terminal, Wand2, X } from "lucide-react";

export interface CookieParserResult {
  name: string;
  domain: string;
  netscapeOutput: string;
}

export interface CurlParserBoxProps {
  onParsed: (result: CookieParserResult) => void;
  defaultDomain?: string;
}

export function CurlParserBox({ onParsed, defaultDomain = "" }: CurlParserBoxProps) {
  const dialogTitleId = useId();
  const [curlCommand, setCurlCommand] = useState("");
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleParseCurl = () => {
    if (!curlCommand.trim()) return;

    try {
      let cookiesStr = "";
      let urlStr = "";
      let nameGuess = "";

      const urlMatch = curlCommand.match(/(?:['"])(https?:\/\/[^'"]+)(?:['"])|(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        urlStr = urlMatch[1] || urlMatch[2] || "";
        try {
          const parsedUrl = new URL(urlStr);
          nameGuess = `${parsedUrl.hostname} Session`;
        } catch {
          // ignore
        }
      }

      const cookieHeaderMatch = curlCommand.match(/(?:-H|--header)\s+['"](?:[Cc][Oo][Oo][Kk][Ii][Ee]:\s*)([^'"]+)['"]/i) ||
                                curlCommand.match(/(?:-H|--header)\s+(?:[Cc][Oo][Oo][Kk][Ii][Ee]:\s*)([^\s'"]+)/i) ||
                                curlCommand.match(/(?:--cookie|-b)\s+['"]([^'"]+)['"]/i) ||
                                curlCommand.match(/(?:--cookie|-b)\s+([^\s'"]+)/i);

      if (cookieHeaderMatch) {
        cookiesStr = cookieHeaderMatch[1];
      } else {
        setParseStatus("Could not find Cookie header in cURL command. Make sure it contains -H 'cookie: ...'");
        return;
      }

      let netscapeOutput = "";
      let hostname = defaultDomain;

      if (urlStr) {
        try {
          hostname = new URL(urlStr).hostname.replace(/^www\./, "");
        } catch {
          // ignore
        }
      }

      if (cookiesStr.includes("\t") || cookiesStr.includes("# Netscape")) {
        netscapeOutput = cookiesStr;
        if (!hostname) {
          // Try to extract domain from netscape line
          const firstLine = cookiesStr.split("\n").find(l => l && !l.startsWith("#"));
          if (firstLine) {
            hostname = firstLine.split("\t")[0]?.trim() || "";
          }
        }
      } else {
        if (!hostname) {
          setParseStatus("Could not extract domain from cURL URL. Please include a valid URL in your cURL command.");
          return;
        }
        const pairs = cookiesStr.split(";");
        const lines = ["# Netscape HTTP Cookie File", `# Parsed from cURL command on ${new Date().toISOString()}`];
        for (const pair of pairs) {
          const parts = pair.trim().split("=");
          if (parts.length >= 2) {
            const cName = parts[0].trim();
            const cVal = parts.slice(1).join("=").trim();
            lines.push(`${hostname}\tTRUE\t/\tTRUE\t2147483647\t${cName}\t${cVal}`);
          }
        }
        netscapeOutput = lines.join("\n");
      }

      onParsed({
        name: nameGuess,
        domain: hostname,
        netscapeOutput,
      });

      setParseStatus(null);
      setCurlCommand("");
      setIsOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid syntax";
      setParseStatus(`Failed to parse cURL: ${message}`);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setParseStatus(null);
          setIsOpen(true);
        }}
        className="admin-secondary-button inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition"
      >
        <Terminal className="h-3.5 w-3.5" />
        Import from cURL
      </button>

      {isOpen && (
        <div
          className="admin-curl-backdrop fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            aria-labelledby={dialogTitleId}
            aria-modal="true"
            className="admin-dialog my-8 w-full max-w-xl rounded-2xl border p-5 shadow-2xl sm:p-6"
            role="dialog"
          >
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id={dialogTitleId} className="flex items-center gap-2 text-sm font-bold">
                  <Terminal className="h-4 w-4 text-emerald-600" />
                  Import cookies from cURL
                </h3>
                <p className="admin-muted mt-1 text-xs">
                  Paste a browser cURL command containing a Cookie header.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close cURL import"
                className="admin-secondary-button rounded-lg border p-2 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <textarea
              autoFocus
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              rows={5}
              placeholder="curl 'https://example.com/...' -H 'cookie: ...'"
              className="admin-form-input w-full resize-y rounded-xl border px-3.5 py-3 font-mono text-xs leading-relaxed transition"
            />
            {parseStatus && (
              <p className="mt-2 text-xs text-amber-600">{parseStatus}</p>
            )}

            <footer className="mt-5 flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="admin-secondary-button cursor-pointer rounded-xl border px-4 py-2.5 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseCurl}
                disabled={!curlCommand.trim()}
                className="admin-primary-button flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Parse and import
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
