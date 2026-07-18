import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as Match_Service from "@/modules/matching/match.service";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  Globe,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type PopulatedListing = {
  _id: { toString(): string };
  title: string;
  company: string;
  location?: string;
  workMode?: "remote" | "onsite" | "hybrid";
  sponsorshipOffered?: boolean;
};

type Match = {
  id: string;
  score: number;
  breakdown: {
    skillScore: number;
    gpaScore: number;
    workAuthCompatible: boolean;
    matchedSkills: string[];
  };
  listing: PopulatedListing;
};

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 40
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-red-100 text-red-800 border-red-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold tabular-nums",
        color,
      )}
    >
      {score}%
    </span>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: Match }) {
  const { score, breakdown, listing } = match;
  const { matchedSkills, gpaScore, workAuthCompatible } = breakdown;

  const visibleSkills = matchedSkills.slice(0, 5);
  const extra = matchedSkills.length - visibleSkills.length;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-card-foreground">
            {listing.title}
          </h2>
          <p className="text-sm text-muted-foreground">{listing.company}</p>
        </div>
        <ScoreBadge score={score} />
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {listing.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {listing.location}
          </span>
        )}
        {listing.workMode && (
          <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 capitalize">
            <Globe className="size-3" />
            {listing.workMode}
          </span>
        )}
        {listing.sponsorshipOffered === true && (
          <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700">
            <Briefcase className="size-3" />
            Sponsorship
          </span>
        )}
        {listing.sponsorshipOffered === false && (
          <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            No sponsorship
          </span>
        )}
      </div>

      {/* Matched skills */}
      {matchedSkills.length > 0 ? (
        <p className="text-sm text-foreground">
          <span className="font-medium">Matched on:</span>{" "}
          {visibleSkills.join(", ")}
          {extra > 0 && (
            <span className="text-muted-foreground"> +{extra} more</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No skill overlap</p>
      )}

      {/* GPA + work-auth indicators */}
      <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          GPA score:{" "}
          <span className="font-medium text-foreground">
            {Math.round(gpaScore)}%
          </span>
        </span>
        <span className="flex items-center gap-1">
          {workAuthCompatible ? (
            <>
              <CheckCircle className="size-3.5 text-green-600" />
              <span className="text-green-700">Work auth compatible</span>
            </>
          ) : (
            <>
              <XCircle className="size-3.5 text-red-500" />
              <span className="text-red-600">Sponsorship mismatch</span>
            </>
          )}
        </span>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const sp = await searchParams;
  const filterWorkMode = typeof sp.workMode === "string" ? sp.workMode : "";
  const filterSponsorship = typeof sp.sponsorship === "string" ? sp.sponsorship : "";
  const filterLocation = typeof sp.location === "string" ? sp.location.toLowerCase() : "";

  let matches: Match[] = [];
  let fetchError: string | null = null;

  try {
    await connectDB();
    const raw = await Match_Service.getMatchesForStudent(session.user.id);

    // Serialize: ObjectId → string at RSC boundary
    matches = raw.map((m) => ({
      id: (m._id as { toString(): string }).toString(),
      score: m.score,
      breakdown: m.breakdown,
      listing: m.listingId as unknown as PopulatedListing,
    }));
  } catch {
    fetchError = "Failed to load matches. Please try again later.";
  }

  // Apply URL-param filters (no re-fetch needed — already in memory)
  const filtered = matches.filter((m) => {
    if (filterWorkMode && m.listing.workMode !== filterWorkMode) return false;
    if (filterSponsorship === "true" && m.listing.sponsorshipOffered !== true) return false;
    if (filterSponsorship === "false" && m.listing.sponsorshipOffered !== false) return false;
    if (filterLocation && !m.listing.location?.toLowerCase().includes(filterLocation)) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            Your Matches
          </h1>
          {!fetchError && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
              {filtered.length}
            </span>
          )}
        </div>

        {fetchError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {fetchError}
          </div>
        ) : (
          <>
            {/* Filter bar — plain HTML form, no JS needed */}
            <form
              method="GET"
              action=""
              className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="workMode"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Work mode
                </label>
                <select
                  id="workMode"
                  name="workMode"
                  defaultValue={filterWorkMode}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="sponsorship"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Sponsorship
                </label>
                <select
                  id="sponsorship"
                  name="sponsorship"
                  defaultValue={filterSponsorship}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All</option>
                  <option value="true">Offered</option>
                  <option value="false">Not offered</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="location"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g. New York"
                  defaultValue={filterLocation}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  Filter
                </button>
                {(filterWorkMode || filterSponsorship || filterLocation) && (
                  <a
                    href="?"
                    className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Clear
                  </a>
                )}
              </div>
            </form>

            {/* Match cards or empty state */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <p className="text-lg font-medium text-foreground">
                  {matches.length === 0
                    ? "No matches yet"
                    : "No matches for these filters"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {matches.length === 0
                    ? "Complete your profile and we'll match you against open listings."
                    : "Try adjusting or clearing your filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtered.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
