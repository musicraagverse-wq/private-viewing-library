"use client";

/** Local taste profile: quiz picks + ratings, stored per-browser (no login needed). */

const TASTE_KEY = "sd_taste_v1";
const RATINGS_KEY = "sd_ratings_v1";

export function getTaste(): string[] {
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveTaste(tropes: string[]) {
  try {
    localStorage.setItem(TASTE_KEY, JSON.stringify(Array.from(new Set(tropes)).slice(0, 6)));
    window.dispatchEvent(new CustomEvent("sd-taste-changed"));
  } catch {}
}

export function clearTaste() {
  try {
    localStorage.removeItem(TASTE_KEY);
    window.dispatchEvent(new CustomEvent("sd-taste-changed"));
  } catch {}
}

export type Rating = 1 | -1;

export function getRatings(): Record<string, Rating> {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function getRating(dramaId: string): Rating | 0 {
  return getRatings()[dramaId] ?? 0;
}

export function setRating(dramaId: string, rating: Rating | 0) {
  try {
    const all = getRatings();
    if (rating === 0) delete all[dramaId];
    else all[dramaId] = rating;
    localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("sd-taste-changed"));
  } catch {}
}

export function likedIds(): string[] {
  return Object.entries(getRatings())
    .filter(([, r]) => r === 1)
    .map(([id]) => id);
}

export function dislikedIds(): string[] {
  return Object.entries(getRatings())
    .filter(([, r]) => r === -1)
    .map(([id]) => id);
}
