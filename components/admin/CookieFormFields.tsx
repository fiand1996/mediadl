"use client";

import { useState } from "react";
import { Globe, FileText } from "lucide-react";
import { DomainTagInput } from "@/components/admin/DomainTagInput";
import { CurlParserBox, CookieParserResult } from "@/components/admin/CurlParserBox";

interface CookieFormFieldsProps {
  formId: string;
  defaultName?: string;
  defaultDomains?: string;
  defaultContent?: string;
  showDomains?: boolean;
}

export function CookieFormFields({
  formId,
  defaultName = "",
  defaultDomains = "",
  defaultContent = "",
  showDomains = true,
}: CookieFormFieldsProps) {
  const [name, setName] = useState(defaultName);
  const [domains, setDomains] = useState(defaultDomains);
  const [content, setContent] = useState(defaultContent);

  const handleParsed = (result: CookieParserResult) => {
    if (!name && result.name) setName(result.name);
    if (showDomains && result.domain) {
      setDomains(prev => {
        const list = prev ? prev.split(",").map(s => s.trim()).filter(Boolean) : [];
        if (!list.includes(result.domain)) {
          list.push(result.domain);
        }
        return list.join(",");
      });
    }
    if (result.netscapeOutput) setContent(result.netscapeOutput);
  };

  return (
    <div className="space-y-4 text-xs">
      <CurlParserBox onParsed={handleParsed} />

      <div>
        <label className="block text-zinc-400 mb-1">Account Label / Name</label>
        <input 
          type="text" 
          name="name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Account Burner 1" 
          required
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-emerald-500 "
        />
      </div>

      {showDomains && (
        <div>
          <label className="block text-zinc-400 mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Domains</span>
          </label>
          <DomainTagInput key={domains} name="domains" defaultValue={domains} />
        </div>
      )}

      <div>
        <label className="block text-zinc-400 mb-1 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Netscape Cookies Content (.txt format)</span>
        </label>
        <textarea 
          name="cookieContent" 
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Netscape HTTP Cookie File..." 
          required
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100  text-[11px] focus:outline-none focus:border-emerald-500"
        ></textarea>
      </div>
    </div>
  );
}
