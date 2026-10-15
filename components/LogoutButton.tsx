"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted hover:border-primary hover:text-primary"
    >
      Logout
    </button>
  );
}

export function LogoutMenuItem({ onDone }: { onDone?: () => void }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    onDone?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} className="block w-full py-3 text-left text-base font-semibold text-text">
      Logout
    </button>
  );
}
