import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Listing from "@/modules/listings/listing.model";
import Application from "@/modules/applications/application.model";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { ArrowRight, BriefcaseBusiness, Clock3, Plus, UsersRound } from "lucide-react";

export default async function RecruiterDashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  await connectDB();
  const listings = await Listing.find({ recruiterId: session.user.id }).sort({ createdAt: -1 }).lean();
  const ids = listings.map((listing) => listing._id);
  const [applicationCount, reviewCount, recentApplications] = await Promise.all([
    Application.countDocuments({ listingId: { $in: ids } }),
    Application.countDocuments({ listingId: { $in: ids }, status: "under_review" }),
    Application.find({ listingId: { $in: ids } }).populate("listingId", "title company").populate("studentId", "name email").sort({ appliedAt: -1 }).limit(5).lean(),
  ]);

  return (
    <main className="app-container py-10 sm:py-14">
      <PageHeading title="RECRUITER OVERVIEW" description="Keep every role and candidate decision moving from one clear workspace." action={<Link href="/recruiter/listings/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-95"><Plus className="size-4" /> Post a role</Link>} />

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Recruiting summary">
        <Metric icon={BriefcaseBusiness} value={listings.length} label="Active listings" />
        <Metric icon={UsersRound} value={applicationCount} label="Total applicants" />
        <Metric icon={Clock3} value={reviewCount} label="Under review" />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Recent applicants</h2><Link href="/recruiter/listings" className="text-sm font-bold text-primary hover:underline">View listings</Link></div>
          {recentApplications.length === 0 ? <div className="mt-4"><EmptyState icon={UsersRound} title="Applicants will appear here" description="Publish a role and share it with candidates to start your pipeline." href="/recruiter/listings/new" action="Post first role" /></div> : <div className="surface mt-4 overflow-hidden">{recentApplications.map((application, index) => {
            const student = application.studentId as unknown as { name?: string; email: string };
            const listing = application.listingId as unknown as { _id: { toString(): string }; title: string; company: string };
            return <div key={application._id.toString()} className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-border" : ""}`}><div><p className="font-bold">{student.name ?? student.email}</p><p className="mt-1 text-sm text-muted-foreground">{listing.title} at {listing.company}</p></div><Link href={`/recruiter/listings/${listing._id.toString()}`} className="inline-flex items-center gap-2 text-sm font-bold hover:text-primary">Review <ArrowRight className="size-4" /></Link></div>;
          })}</div>}
        </section>

        <aside className="rounded-2xl bg-foreground p-6 text-background">
          <p className="text-sm font-bold text-primary">Hiring tip</p>
          <h2 className="mt-5 text-2xl font-bold tracking-tight">Write requirements people can recognize.</h2>
          <p className="mt-3 text-sm leading-6 text-background/70">Specific skills produce clearer matches than broad labels such as “rockstar” or “all-rounder.”</p>
          <Link href="/recruiter/listings/new" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-background">Create a clear role <ArrowRight className="size-4" /></Link>
        </aside>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof BriefcaseBusiness; value: number; label: string }) {
  return <div className="surface p-5"><span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-5" /></span><p className="mt-7 font-mono text-3xl font-bold">{value}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p></div>;
}
