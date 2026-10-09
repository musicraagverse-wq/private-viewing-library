"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong password. Try again.");
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form
        onSubmit={submit}
        className="ticket w-full max-w-sm p-8"
      >
        <h1 className="mb-1 font-display text-xl tracking-wide">
          <span className="marquee-text">◈ MY THEATER</span>
        </h1>
        <p className="mb-6 text-sm text-muted">Enter the theater password.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mb-3 w-full rounded-lg border border-rope bg-screen px-4 py-3 text-sm text-cream outline-none placeholder:text-muted/50 focus:border-marquee/60"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-marquee px-4 py-3 text-sm font-bold text-screen disabled:opacity-40 hover:bg-spotlight"
        >
          {loading ? "Checking…" : "Enter theater"}
        </button>
      </form>
    </div>
  );
}
