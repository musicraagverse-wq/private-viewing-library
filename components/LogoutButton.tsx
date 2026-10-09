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
      className="rounded-full border-2 border-edge px-4 py-1.5 font-display text-xs font-extrabold text-muted hover:border-pop hover:text-pop"
    >
      🚪 Logout
    </button>
  );
}
