"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface DomainTagInputProps {
  name: string;
  defaultValue?: string;
}

export function DomainTagInput({
  name,
  defaultValue = "",
}: DomainTagInputProps) {
  const baseDomains = useMemo(
    () =>
      defaultValue
        ? defaultValue
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [],
    [defaultValue],
  );
  const [addedDomains, setAddedDomains] = useState<string[]>([]);
  const [removedDomains, setRemovedDomains] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const domains = useMemo(() => {
    const combined = new Set(baseDomains);
    for (const domain of addedDomains) combined.add(domain);
    for (const domain of removedDomains) combined.delete(domain);
    return Array.from(combined);
  }, [baseDomains, addedDomains, removedDomains]);

  // Listen to external change events on hidden input
  useEffect(() => {
    const hiddenInput = document.getElementById(
      `hidden-domain-${name}`,
    ) as HTMLInputElement;
    if (!hiddenInput) return;
    const handleChange = () => {
      const val = hiddenInput.value;
      if (val) {
        const parsed = val
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
        setAddedDomains(parsed);
        setRemovedDomains([]);
      }
    };
    hiddenInput.addEventListener("change", handleChange);
    return () => hiddenInput.removeEventListener("change", handleChange);
  }, [name]);

  const handleAddDomain = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !domains.includes(trimmed)) {
      setAddedDomains((prev) => [...prev, trimmed]);
      setRemovedDomains((prev) => prev.filter((domain) => domain !== trimmed));
      setInputValue("");
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    if (baseDomains.includes(domainToRemove)) {
      setRemovedDomains((prev) =>
        prev.includes(domainToRemove) ? prev : [...prev, domainToRemove],
      );
    }
    setAddedDomains((prev) =>
      prev.filter((domain) => domain !== domainToRemove),
    );
  };

  return (
    <div className="space-y-2">
      <input
        id={`hidden-domain-${name}`}
        type="hidden"
        name={name}
        value={domains.join(",")}
      />

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
          <span className="text-zinc-500 text-[11px] italic ">
            No target domains added (applies globally or default)
          </span>
        )}
      </div>
    </div>
  );
}
