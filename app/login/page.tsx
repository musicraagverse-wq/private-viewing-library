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
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-1 text-2xl font-extrabold">
          <span className="text-primary">Short</span>Drama
        </h1>
        <p className="mb-6 text-sm text-muted">Enter password to continue</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mb-3 w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
        />
        {error && <p className="mb-3 text-sm font-semibold text-primary">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-primarydark"
        >
          {loading ? "Loading..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
