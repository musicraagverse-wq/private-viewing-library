"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const COOKIE = "sd_hide_dm";

function readCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${COOKIE}=1`);
}

/**
 * "Hide Dailymotion" toggle. When on, every Dailymotion-only drama
 * (its only video is a Dailymotion redirect) disappears from lists,
 * search, recommendations and the watch pages; turning it off shows
 * all of them again. Persisted in a cookie (sd_hide_dm) so server
 * components filter in the database — counts and pagination stay
 * correct. router.refresh() re-renders the page with the new filter.
 */
export default function HideDmToggle({ label = "Hide Dailymotion" }: { label?: string }) {
  const router = useRouter();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(readCookie());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    if (next) {
      document.cookie = `${COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
    router.refresh();
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Hide Dailymotion dramas"
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          on ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
