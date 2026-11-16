"use client";

import { useState } from "react";
import { FileText, Globe } from "lucide-react";
import { DomainTagInput } from "@/components/admin/DomainTagInput";
import { CurlParserBox, type CookieParserResult } from "@/components/admin/CurlParserBox";
import { CookieSessionWarning } from "@/components/admin/CookieSessionWarning";

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
    <div className="space-y-5 text-xs">
      <CookieSessionWarning />

      <div className="space-y-1.5">
        <label htmlFor={`${formId}-name`} className="admin-form-label block font-medium">Account name</label>
        <input 
          id={`${formId}-name`}
          type="text" 
          name="name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Personal account"
          required
          className="admin-form-input w-full rounded-xl border px-3.5 py-3 text-sm transition"
        />
        <p className="admin-form-hint">A label to help you identify this cookie profile.</p>
      </div>

      {showDomains && (
        <div className="space-y-1.5">
          <label className="admin-form-label flex items-center gap-1.5 font-medium">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>Target Domains</span>
          </label>
          <DomainTagInput key={domains} name="domains" defaultValue={domains} />
          <p className="admin-form-hint">Choose which sites may use this cookie. Leave empty to apply globally.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`${formId}-content`} className="admin-form-label flex items-center gap-1.5 font-medium">
            <FileText className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cookie content</span>
          </label>
          <CurlParserBox onParsed={handleParsed} defaultDomain={defaultDomains} />
        </div>
        <p className="admin-form-hint">Paste Netscape cookie file content (.txt format).</p>
        <textarea 
          id={`${formId}-content`}
          name="cookieContent" 
          rows={7}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Netscape HTTP Cookie File..." 
          required
          spellCheck={false}
          className="admin-form-input w-full resize-y rounded-xl border px-3.5 py-3 font-mono text-xs leading-relaxed transition"
        ></textarea>
      </div>
    </div>
  );
}
