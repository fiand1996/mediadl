import { useState } from "react";
import { Terminal, Wand2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

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

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="xl"
        zIndex="z-[60]"
        icon={<Terminal className="h-5 w-5 text-emerald-400" />}
        title="Import cookies from cURL"
        description="Paste a browser cURL command containing a Cookie header."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="admin-secondary-button cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseCurl}
              disabled={!curlCommand.trim()}
              className="admin-primary-button flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Parse and import
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <textarea
            autoFocus
            value={curlCommand}
            onChange={(e) => setCurlCommand(e.target.value)}
            rows={5}
            placeholder="curl 'https://example.com/...' -H 'cookie: ...'"
            className="admin-form-input w-full resize-y rounded-xl border px-3.5 py-3 font-mono text-xs leading-relaxed transition"
          />
          {parseStatus && (
            <p className="text-xs text-amber-500">{parseStatus}</p>
          )}
        </div>
      </Modal>
    </>
  );
}
