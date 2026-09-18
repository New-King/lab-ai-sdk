"use client";

import { useState } from "react";

function IconCopy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 12l4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "已复制" : "复制"}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
    >
      {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
    </button>
  );
}
