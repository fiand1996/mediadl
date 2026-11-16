"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";

interface DomainTagInputProps {
  name: string;
  defaultValue?: string;
}

export function DomainTagInput({ name, defaultValue = "" }: DomainTagInputProps) {
  const [domains, setDomains] = useState<string[]>(
    defaultValue ? defaultValue.split(",").map(d => d.trim()).filter(Boolean) : []
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (defaultValue) {
      const newDomains = defaultValue.split(",").map(d => d.trim()).filter(Boolean);
      setDomains(prev => {
        const combined = Array.from(new Set([...prev, ...newDomains]));
        return combined;
      });
    }
  }, [defaultValue]);

  // Listen to external change events on hidden input
  useEffect(() => {
    const hiddenInput = document.getElementById(`hidden-domain-${name}`) as HTMLInputElement;
    if (!hiddenInput) return;
    const handleChange = () => {
      const val = hiddenInput.value;
      if (val) {
        setDomains(val.split(",").map(d => d.trim()).filter(Boolean));
      }
    };
    hiddenInput.addEventListener("change", handleChange);
    return () => hiddenInput.removeEventListener("change", handleChange);
  }, [name]);

  const handleAddDomain = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !domains.includes(trimmed)) {
      setDomains([...domains, trimmed]);
      setInputValue("");
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains(domains.filter(d => d !== domainToRemove));
  };

  return (
    <div className="space-y-2">
      <input id={`hidden-domain-${name}`} type="hidden" name={name} value={domains.join(",")} />
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddDomain}
          placeholder="Type domain (e.g. tiktok.com) and click Add"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-emerald-500  text-xs"
        />
        <button
          type="button"
          onClick={handleAddDomain}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer "
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {domains.map((domain) => (
          <span
            key={domain}
            className="inline-flex items-center gap-1.5 bg-zinc-950 border border-zinc-700 text-emerald-400 px-3 py-1 rounded-full text-xs "
          >
            {domain}
            <button
              type="button"
              onClick={() => handleRemoveDomain(domain)}
              className="text-zinc-400 hover:text-red-400 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {domains.length === 0 && (
          <span className="text-zinc-500 text-[11px] italic ">No target domains added (applies globally or default)</span>
        )}
      </div>
    </div>
  );
}
