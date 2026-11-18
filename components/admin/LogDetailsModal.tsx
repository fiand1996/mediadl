"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface LogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function LogDetailsModal({ isOpen, onClose, title, content }: LogDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      icon={<Terminal className="w-5 h-5 text-emerald-400" />}
      title={title}
      description="Raw diagnostic log output"
      bodyClassName="p-0"
      footer={
        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy to Clipboard
            </>
          )}
        </button>
      }
    >
      <div className="p-5 overflow-y-auto max-h-[60vh] text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all bg-zinc-950/60 select-all">
        {content || "No details provided."}
      </div>
    </Modal>
  );
}
