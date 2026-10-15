"use client";

import { useState } from "react";

/** Copy a shareable link for a list of drama ids. */
export default function ShareButton({ dramaIds, label }: { dramaIds: string[]; label: string }) {
  const [copied, setCopied] = useState(false);

  if (dramaIds.length === 0) return null;

  async function share() {
    const url = `${window.location.origin}/s?d=${dramaIds.map(encodeURIComponent).join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable; fall back to prompt
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-bold text-muted transition hover:border-primary hover:text-primary"
      aria-label={`Share ${label}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" strokeLinecap="round" />
      </svg>
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
