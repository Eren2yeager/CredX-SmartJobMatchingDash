"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LoaderCircle, LogOut } from "lucide-react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/auth/signout?complete=1" });
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-background transition-[transform,opacity] hover:opacity-90 active:translate-y-px disabled:cursor-wait disabled:opacity-65 sm:w-auto"
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {loading ? "Signing out" : "Sign out securely"}
    </button>
  );
}
