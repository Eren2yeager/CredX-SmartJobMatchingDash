"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[student/dashboard] error boundary caught:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg font-medium text-foreground">
            Something went wrong
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred loading your matches."}
          </p>
          <button
            onClick={reset}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
