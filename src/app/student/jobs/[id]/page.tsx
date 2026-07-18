import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Listing from "@/modules/listings/listing.model";
import StudentProfile from "@/modules/profile/profile.model";
import Match from "@/modules/matching/match.model";
import Application from "@/modules/applications/application.model";
import { ApplyButton } from "@/components/apply-button";
import { ArrowLeft, Building2, CheckCircle2, CircleAlert, Globe2, GraduationCap, MapPin } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const listing = await Listing.findById(id).select("title company").lean().catch(() => null);
  return { title: listing ? `${listing.title} at ${listing.company}` : "Job details" };
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");
  await connectDB();
  const { id } = await params;

  const listing = await Listing.findById(id).lean().catch(() => null);
  if (!listing) notFound();

  const profile = await StudentProfile.findOne({ userId: session.user.id }).select("_id").lean();
  const [match, application] = await Promise.all([
    profile ? Match.findOne({ studentId: profile._id, listingId: listing._id }).lean() : null,
    Application.findOne({ studentId: session.user.id, listingId: listing._id }).select("_id").lean(),
  ]);

  return (
    <main className="app-container py-8 sm:py-12">
      <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to matches</Link>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <section className="surface p-6 sm:p-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold text-primary">{listing.company}</p>
                <h1 className="mt-2 font-heading text-5xl tracking-wide sm:text-6xl">{listing.title}</h1>
              </div>
              {match && <span className="w-fit rounded-xl bg-success-soft px-4 py-3 font-mono text-lg font-bold text-success">{match.score}% match</span>}
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Building2 className="size-4" />{listing.company}</span>
              {listing.location && <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{listing.location}</span>}
              {listing.workMode && <span className="inline-flex items-center gap-2 capitalize"><Globe2 className="size-4" />{listing.workMode}</span>}
              {listing.minGpa !== undefined && <span className="inline-flex items-center gap-2"><GraduationCap className="size-4" />Minimum GPA {listing.minGpa}</span>}
            </div>
          </section>

          <section className="surface p-6 sm:p-9">
            <h2 className="text-xl font-bold">About the opportunity</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{listing.description}</p>
          </section>

          <section className="surface p-6 sm:p-9">
            <h2 className="text-xl font-bold">Skills this role needs</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {listing.requiredSkills.map((skill: string) => {
                const matched = match?.breakdown.matchedSkills.includes(skill);
                return <span key={skill} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${matched ? "bg-success-soft text-success" : "bg-secondary text-secondary-foreground"}`}>{matched && <CheckCircle2 className="size-4" />}{skill}</span>;
              })}
            </div>
          </section>
        </div>

        <aside className="surface p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Your match</h2>
          {match ? (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-4"><p className="font-mono text-2xl font-bold">{Math.round(match.breakdown.skillScore)}%</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Skill overlap</p></div>
                <div className="rounded-xl bg-muted p-4"><p className="font-mono text-2xl font-bold">{Math.round(match.breakdown.gpaScore)}%</p><p className="mt-1 text-xs font-semibold text-muted-foreground">GPA fit</p></div>
              </div>
              <div className={`flex gap-2 rounded-xl p-4 text-sm font-semibold ${match.breakdown.workAuthCompatible ? "bg-success-soft text-success" : "bg-accent text-accent-foreground"}`}>
                {match.breakdown.workAuthCompatible ? <CheckCircle2 className="size-5 shrink-0" /> : <CircleAlert className="size-5 shrink-0" />}
                {match.breakdown.workAuthCompatible ? "Work authorization is compatible." : "This role may not support your sponsorship needs."}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Complete your profile to see a personalized breakdown.</p>
          )}
          <ApplyButton listingId={listing._id.toString()} alreadyApplied={Boolean(application)} className="mt-6" />
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Your application is added to your tracker immediately.</p>
        </aside>
      </div>
    </main>
  );
}
