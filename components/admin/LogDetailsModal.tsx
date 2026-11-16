"use client";

import React from "react";

interface LogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function LogDetailsModal({ isOpen, onClose, title, content }: LogDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white ">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-xs  bg-zinc-800/50 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/50"
          >
            Close [ESC]
          </button>
        </div>
        <div className="p-6 overflow-y-auto  text-xs text-zinc-300 whitespace-pre-wrap break-all bg-zinc-950/50 select-all">
          {content || "No details provided."}
        </div>
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/55 flex justify-end">
          <button
            onClick={() => {
              navigator.clipboard.writeText(content);
            }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs  rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
