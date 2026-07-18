export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-8 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Filter bar skeleton */}
        <div className="mb-6 h-20 animate-pulse rounded-xl border border-border bg-muted" />

        {/* Card skeletons */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-px w-full bg-border" />
              <div className="flex gap-4">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
