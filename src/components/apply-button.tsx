"use client";

import { useState } from "react";
import { Check, LoaderCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApplyButton({ listingId, alreadyApplied = false, className }: { listingId: string; alreadyApplied?: boolean; className?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(alreadyApplied ? "done" : "idle");
  const [message, setMessage] = useState("");

  async function apply() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok || response.status === 409) {
        setStatus("done");
        return;
      }
      setMessage(data.error ?? "Could not submit your application.");
      setStatus("error");
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={apply}
        disabled={status === "loading" || status === "done"}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : status === "done" ? <Check className="size-4" /> : <Send className="size-4" />}
        {status === "loading" ? "Submitting" : status === "done" ? "Application sent" : "Apply now"}
      </button>
      {message && <p role="alert" className="text-xs font-medium text-destructive">{message}</p>}
    </div>
  );
}
