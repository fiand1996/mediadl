import { useState } from "react";
import { Terminal, Wand2, Globe, FileText, CheckCircle2 } from "lucide-react";
import { DomainTagInput } from "@/components/admin/DomainTagInput";

export interface CookieParserResult {
  name: string;
  domain: string;
  netscapeOutput: string;
}

export interface CurlParserBoxProps {
  onParsed: (result: CookieParserResult) => void;
}

export function CurlParserBox({ onParsed }: CurlParserBoxProps) {
  const [curlCommand, setCurlCommand] = useState("");
  const [parseStatus, setParseStatus] = useState<string | null>(null);

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
      let hostname = "";

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

      setParseStatus("Successfully parsed cURL command!");
      setTimeout(() => setParseStatus(null), 4000);
    } catch (err: any) {
      setParseStatus(`Failed to parse cURL: ${err.message || "Invalid syntax"}`);
    }
  };

  return (
    <div className="p-4 bg-zinc-950 border border-emerald-500/30 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <Terminal className="w-4 h-4" />
          <span>⚡ Import from cURL (CLI)</span>
        </label>
        <span className="text-[10px] text-zinc-500">Paste your browser cURL request</span>
      </div>
      <textarea
        value={curlCommand}
        onChange={(e) => setCurlCommand(e.target.value)}
        rows={3}
        placeholder="curl 'https://...' -H 'cookie: ...'"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200  focus:outline-none focus:border-emerald-500"
      />
      <div className="flex items-center justify-between">
        {parseStatus ? (
          <span className={`text-[11px] flex items-center gap-1 ${parseStatus.includes("Successfully") ? "text-emerald-400" : "text-amber-400"}`}>
            {parseStatus.includes("Successfully") && <CheckCircle2 className="w-3.5 h-3.5" />}
            {parseStatus}
          </span>
        ) : <span />}
        <button
          type="button"
          onClick={handleParseCurl}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
        >
          <Wand2 className="w-3.5 h-3.5" /> Parse cURL
        </button>
      </div>
    </div>
  );
}
