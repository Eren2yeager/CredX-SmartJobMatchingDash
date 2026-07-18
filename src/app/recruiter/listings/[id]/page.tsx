import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Listing from "@/modules/listings/listing.model";
import Application from "@/modules/applications/application.model";
import StudentProfile from "@/modules/profile/profile.model";
import Match from "@/modules/matching/match.model";
import { ApplicationStatusSelect } from "@/components/application-status-select";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, CalendarDays, Mail, MapPin, UsersRound } from "lucide-react";

type Candidate = { _id: { toString(): string }; name?: string; email: string; image?: string };

export default async function ListingPipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  await connectDB();
  const { id } = await params;
  const listing = await Listing.findOne({ _id: id, recruiterId: session.user.id }).lean().catch(() => null);
  if (!listing) notFound();

  const applications = await Application.find({ listingId: listing._id }).populate("studentId", "name email image").sort({ appliedAt: -1 }).lean();
  const candidateIds = applications.map((application) => (application.studentId as unknown as Candidate)._id);
  const profiles = await StudentProfile.find({ userId: { $in: candidateIds } }).lean();
  const matches = await Match.find({ listingId: listing._id, studentId: { $in: profiles.map((profile) => profile._id) } }).lean();
  const profileMap = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));
  const matchMap = new Map(matches.map((match) => [match.studentId.toString(), match]));

  return <main className="app-container py-8 sm:py-12">
    <Link href="/recruiter/listings" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to listings</Link>
    <section className="surface mt-7 p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-primary">{listing.company}</p><h1 className="mt-2 font-heading text-5xl tracking-wide sm:text-6xl">{listing.title}</h1></div><span className="w-fit rounded-xl bg-secondary px-3 py-2 text-xs font-bold capitalize">{listing.workMode}</span></div><div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-muted-foreground"><span className="inline-flex items-center gap-2"><MapPin className="size-4" />{listing.location}</span><span className="inline-flex items-center gap-2"><UsersRound className="size-4" />{applications.length} applicants</span><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />Posted {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(listing.createdAt))}</span></div><div className="mt-6 flex flex-wrap gap-2">{listing.requiredSkills.map((skill: string) => <span key={skill} className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold">{skill}</span>)}</div></section>

    <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Applicant pipeline</h2><p className="mt-1 text-sm text-muted-foreground">Review candidate context and update each decision.</p></div></div>
      {applications.length === 0 ? <div className="mt-5"><EmptyState icon={UsersRound} title="No applicants yet" description="Share this role with candidates. New applications will appear here with profile and match context." /></div> : <div className="mt-5 space-y-4">{applications.map((application) => {
        const candidate = application.studentId as unknown as Candidate;
        const profile = profileMap.get(candidate._id.toString());
        const match = profile ? matchMap.get(profile._id.toString()) : undefined;
        return <article key={application._id.toString()} className="surface p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start"><div className="flex gap-4">{candidate.image ? <Image src={candidate.image} alt="" width={48} height={48} className="size-12 rounded-xl object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent font-heading text-xl text-accent-foreground">{(candidate.name ?? candidate.email).slice(0, 2).toUpperCase()}</span>}<div><h3 className="text-lg font-bold">{candidate.name ?? "Candidate"}</h3><a href={`mailto:${candidate.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><Mail className="size-3.5" />{candidate.email}</a><div className="mt-4 flex flex-wrap gap-2">{profile?.skills.slice(0, 6).map((skill: string) => <span key={skill} className={`rounded-lg px-2.5 py-1 text-xs font-bold ${match?.breakdown.matchedSkills.includes(skill) ? "bg-success-soft text-success" : "bg-secondary"}`}>{skill}</span>)}{!profile && <span className="text-xs text-muted-foreground">Profile not completed</span>}</div></div></div><div className="flex flex-wrap items-center gap-4 lg:justify-end">{match && <div className="text-right"><p className="font-mono text-2xl font-bold text-success">{match.score}%</p><p className="text-xs font-semibold text-muted-foreground">match</p></div>}<ApplicationStatusSelect applicationId={application._id.toString()} initialStatus={application.status} /></div></div><div className="mt-5 border-t border-border pt-4 text-xs font-medium text-muted-foreground">Applied {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(application.appliedAt))}{profile?.location ? ` from ${profile.location}` : ""}{profile?.gpa !== undefined ? `, GPA ${profile.gpa}` : ""}</div></article>;
      })}</div>}
    </section>
  </main>;
}
