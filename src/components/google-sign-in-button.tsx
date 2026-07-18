"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl });
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className="group flex h-12 w-full items-center justify-between rounded-xl bg-foreground px-4 text-sm font-bold text-background transition-[transform,opacity] hover:opacity-90 active:translate-y-px disabled:cursor-wait disabled:opacity-65"
    >
      <span className="flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-white font-sans text-sm font-extrabold text-[#4285f4]">
          G
        </span>
        {loading ? "Opening Google" : "Continue with Google"}
      </span>
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}
