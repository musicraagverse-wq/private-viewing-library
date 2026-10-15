"use client";

import { useEffect, useState } from "react";
import { getTaste, saveTaste } from "@/lib/taste";
import { tropeIcon } from "@/lib/tag-icons";

/**
 * 10-second taste quiz. Renders a prompt card when the visitor has no taste
 * profile yet; expands into the quiz on tap.
 */
export default function TasteQuiz({ tropes }: { tropes: { trope: string; c: number }[] }) {
  const [hasTaste, setHasTaste] = useState(true); // assume set until checked (avoids flash)
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    setHasTaste(getTaste().length > 0);
    const onChange = () => setHasTaste(getTaste().length > 0);
    window.addEventListener("sd-taste-changed", onChange);
    return () => window.removeEventListener("sd-taste-changed", onChange);
  }, []);

  if (hasTaste) return null;

  if (!open) {
    return (
      <section aria-label="Personalize your homepage" className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-text sm:text-2xl">
              Make this homepage yours
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Pick the story tropes you love and we'll build you personal recommendation rows. Takes 10 seconds.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primarydark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Pick my tropes
          </button>
        </div>
      </section>
    );
  }

  const toggle = (t: string) =>
    setPicked((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 6)));

  return (
    <section aria-label="Taste quiz" className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-extrabold tracking-tight text-text sm:text-2xl">
        What stories do you love?
      </h2>
      <p className="mt-1 text-sm text-muted">
        Pick at least 3 — we'll personalize your recommendations. {picked.length}/6 selected.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tropes.slice(0, 24).map((t) => {
          const active = picked.includes(t.trope);
          const icon = tropeIcon(t.trope);
          return (
            <button
              key={t.trope}
              onClick={() => toggle(t.trope)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg text-text hover:border-primary"
              }`}
            >
              {icon && <span aria-hidden="true">{icon}</span>}
              {t.trope}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => {
            saveTaste(picked);
            setOpen(false);
          }}
          disabled={picked.length < 3}
          className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primarydark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Done — personalize my home
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted hover:text-text"
        >
          Not now
        </button>
      </div>
    </section>
  );
}
