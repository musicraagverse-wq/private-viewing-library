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
      setError("Wrong password. Try again! 🎭");
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form
        onSubmit={submit}
        className="den-card w-full max-w-sm p-8"
      >
        <h1 className="mb-1 font-display text-2xl font-extrabold">
          🎭 <span className="pop-text">The Drama Den</span>
        </h1>
        <p className="mb-6 text-sm font-semibold text-muted">Enter the secret password! 🤫</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mb-3 w-full rounded-den border-2 border-edge bg-den px-4 py-3 text-sm font-semibold text-cream outline-none placeholder:text-muted/50 focus:border-pop"
        />
        {error && <p className="mb-3 text-sm font-bold text-pop">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-den bg-pop px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40 hover:bg-popdark"
        >
          {loading ? "Opening… 🎬" : "Enter the Den! 🚀"}
        </button>
      </form>
    </div>
  );
}
