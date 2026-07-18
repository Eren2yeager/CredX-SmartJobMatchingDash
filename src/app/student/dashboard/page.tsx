import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as MatchService from "@/modules/matching/match.service";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { ArrowRight, Briefcase, CheckCircle2, CircleAlert, MapPin, SlidersHorizontal } from "lucide-react";

type Listing = {
  _id: { toString(): string };
  title: string;
  company: string;
  location?: string;
  workMode?: "remote" | "onsite" | "hybrid";
  sponsorshipOffered?: boolean;
  description?: string;
};

type Match = {
  _id: { toString(): string };
  score: number;
  breakdown: { skillScore: number; gpaScore: number; workAuthCompatible: boolean; matchedSkills: string[] };
  listingId: Listing;
};

function scoreTone(score: number) {
  if (score >= 70) return "bg-success-soft text-success";
  if (score >= 40) return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

export default async function StudentDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const filters = await searchParams;
  const workMode = typeof filters.workMode === "string" ? filters.workMode : "";
  const sponsorship = typeof filters.sponsorship === "string" ? filters.sponsorship : "";
  const location = typeof filters.location === "string" ? filters.location : "";

  let matches: Match[] = [];
  let failed = false;
  try {
    await connectDB();
    matches = (await MatchService.getMatchesForStudent(session.user.id)) as unknown as Match[];
  } catch {
    failed = true;
  }

  const visible = matches.filter((match) => {
    const listing = match.listingId;
    if (workMode && listing.workMode !== workMode) return false;
    if (sponsorship && String(listing.sponsorshipOffered) !== sponsorship) return false;
    if (location && !listing.location?.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="app-container py-10 sm:py-14">
      <PageHeading
        title={`HELLO, ${(session.user.name?.split(" ")[0] ?? "THERE").toUpperCase()}.`}
        description="Your strongest job matches are ranked here, with the reasons kept visible."
        action={<Link href="/student/profile" className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-bold hover:bg-muted">Update profile</Link>}
      />

      <form className="surface mt-8 grid gap-4 p-4 sm:grid-cols-[1fr_0.7fr_0.7fr_auto] sm:items-end" method="GET">
        <div className="space-y-2">
          <label className="label" htmlFor="location">Location</label>
          <input className="field" id="location" name="location" defaultValue={location} placeholder="Search a city or remote" />
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="workMode">Work mode</label>
          <select className="field" id="workMode" name="workMode" defaultValue={workMode}>
            <option value="">Any mode</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="sponsorship">Sponsorship</label>
          <select className="field" id="sponsorship" name="sponsorship" defaultValue={sponsorship}>
            <option value="">Any</option><option value="true">Available</option><option value="false">Not available</option>
          </select>
        </div>
        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-bold text-background hover:opacity-90 active:translate-y-px"><SlidersHorizontal className="size-4" /> Filter</button>
      </form>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">{visible.length} {visible.length === 1 ? "match" : "matches"}</p>
        {(workMode || sponsorship || location) && <Link href="/student/dashboard" className="text-sm font-bold text-primary hover:underline">Clear filters</Link>}
      </div>

      {failed ? (
        <div className="surface mt-5 flex gap-3 border-destructive/30 p-5 text-destructive"><CircleAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">Matches could not load</p><p className="mt-1 text-sm">Check your database connection and try again.</p></div></div>
      ) : visible.length === 0 ? (
        <div className="mt-5"><EmptyState icon={Briefcase} title={matches.length ? "No matches fit these filters" : "Your match list is waiting"} description={matches.length ? "Try a broader location or work mode." : "Complete your profile to calculate matches against available roles."} href={matches.length ? "/student/dashboard" : "/student/profile"} action={matches.length ? "Reset filters" : "Complete profile"} /></div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visible.map((match) => {
            const listing = match.listingId;
            const id = listing._id.toString();
            return (
              <article key={match._id.toString()} className="surface group flex flex-col p-5 transition-transform hover:-translate-y-0.5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-primary">{listing.company}</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">{listing.title}</h2>
                  </div>
                  <span className={`grid size-14 shrink-0 place-items-center rounded-xl font-mono text-lg font-bold ${scoreTone(match.score)}`}>{match.score}%</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                  {listing.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{listing.location}</span>}
                  {listing.workMode && <span className="capitalize">{listing.workMode}</span>}
                  <span className="inline-flex items-center gap-1.5">{match.breakdown.workAuthCompatible ? <CheckCircle2 className="size-3.5 text-success" /> : <CircleAlert className="size-3.5 text-primary" />}{match.breakdown.workAuthCompatible ? "Work authorization fits" : "Sponsorship mismatch"}</span>
                </div>
                <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">{listing.description ?? "Open the role to review the full opportunity and match breakdown."}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {match.breakdown.matchedSkills.slice(0, 4).map((skill) => <span key={skill} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold">{skill}</span>)}
                </div>
                <div className="mt-auto pt-6">
                  <Link href={`/student/jobs/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-primary">View role <ArrowRight className="size-4" /></Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
