"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[student/dashboard] error boundary caught:", error);
  }, [error]);

  return (
    <main className="app-container py-14">
      <div className="surface flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive"><CircleAlert className="size-5" /></span>
        <h1 className="mt-5 text-xl font-bold">Your matches could not load</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{error.message || "An unexpected problem interrupted this page."}</p>
        <button onClick={reset} className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-bold text-background hover:opacity-90 active:translate-y-px">Try again</button>
      </div>
    </main>
  );
}
