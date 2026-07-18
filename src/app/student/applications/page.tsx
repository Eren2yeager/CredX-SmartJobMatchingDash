import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as ApplicationService from "@/modules/applications/application.service";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { ArrowRight, Briefcase, CalendarDays, MapPin } from "lucide-react";

type Application = {
  _id: { toString(): string };
  listingId: { _id: { toString(): string }; title: string; company: string; location?: string };
  status: "applied" | "under_review" | "accepted" | "rejected";
  appliedAt: Date;
  updatedAt: Date;
};

const statusStyle = {
  applied: "bg-secondary text-secondary-foreground",
  under_review: "bg-accent text-accent-foreground",
  accepted: "bg-success-soft text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const statusLabel = { applied: "Applied", under_review: "Under review", accepted: "Accepted", rejected: "Not selected" };

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");
  await connectDB();
  const applications = (await ApplicationService.listForStudent(session.user.id)) as unknown as Application[];

  return (
    <main className="app-container py-10 sm:py-14">
      <PageHeading title="YOUR APPLICATIONS" description="A focused view of every role you applied to and what happens next." action={<Link href="/student/dashboard" className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-bold text-background hover:opacity-90">Browse matches</Link>} />

      {applications.length === 0 ? (
        <div className="mt-8"><EmptyState icon={Briefcase} title="No applications yet" description="When a role feels right, apply from its details page and it will appear here." href="/student/dashboard" action="Explore matches" /></div>
      ) : (
        <div className="mt-8 space-y-3">
          {applications.map((application) => (
            <article key={application._id.toString()} className="surface grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold">{application.listingId.title}</h2>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusStyle[application.status]}`}>{statusLabel[application.status]}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-primary">{application.listingId.company}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                  {application.listingId.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{application.listingId.location}</span>}
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Applied {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(application.appliedAt))}</span>
                </div>
              </div>
              <Link href={`/student/jobs/${application.listingId._id.toString()}`} className="inline-flex items-center gap-2 text-sm font-bold hover:text-primary">View role <ArrowRight className="size-4" /></Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
