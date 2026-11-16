"use client";

import { useEffect, useState } from "react";

/** Facebook / X / WhatsApp / copy-link row. Share URL matches ShareButton (/s?d=...). */
export default function ShareRow({ dramaId, title }: { dramaId: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const url = origin ? `${window.location.origin}/s?d=${encodeURIComponent(dramaId)}` : "";

  function openShare(target: string) {
    if (!url) return;
    window.open(target, "_blank", "noopener,noreferrer,width=600,height=540");
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const circle =
    "flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-white transition hover:opacity-80";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-text">Share:</span>
      <button
        onClick={() =>
          openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        }
        aria-label="Share on Facebook"
        title="Share on Facebook"
        className={`${circle} bg-[#1877F2]`}
      >
        f
      </button>
      <button
        onClick={() =>
          openShare(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
          )
        }
        aria-label="Share on X"
        title="Share on X"
        className={`${circle} bg-black ring-1 ring-border`}
      >
        𝕏
      </button>
      <button
        onClick={() =>
          openShare(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`)
        }
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        className={`${circle} bg-[#25D366]`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={copy}
        aria-label="Copy link"
        title={copied ? "Link copied!" : "Copy link"}
        className={`${circle} bg-surface text-text ring-1 ring-border hover:text-primary`}
      >
        {copied ? (
          <span className="text-sm">✓</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {copied && <span className="text-xs font-bold text-primary">Copied!</span>}
    </div>
  );
}
