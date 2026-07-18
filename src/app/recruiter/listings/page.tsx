import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Listing from "@/modules/listings/listing.model";
import Application from "@/modules/applications/application.model";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { ArrowRight, BriefcaseBusiness, MapPin, Plus, UsersRound } from "lucide-react";

export default async function RecruiterListingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  await connectDB();
  const listings = await Listing.find({ recruiterId: session.user.id }).sort({ createdAt: -1 }).lean();
  const counts = await Application.aggregate<{ _id: unknown; count: number }>([{ $match: { listingId: { $in: listings.map((item) => item._id) } } }, { $group: { _id: "$listingId", count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));

  return <main className="app-container py-10 sm:py-14"><PageHeading title="JOB LISTINGS" description="Review your open roles and move directly into each applicant pipeline." action={<Link href="/recruiter/listings/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"><Plus className="size-4" /> Post a role</Link>} />
    {listings.length === 0 ? <div className="mt-8"><EmptyState icon={BriefcaseBusiness} title="No roles published yet" description="Create a structured listing to begin matching with student profiles." href="/recruiter/listings/new" action="Create first role" /></div> : <div className="mt-8 grid gap-4 lg:grid-cols-2">{listings.map((listing) => <article key={listing._id.toString()} className="surface group p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-primary">{listing.company}</p><h2 className="mt-1 text-xl font-bold">{listing.title}</h2></div><span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold capitalize">{listing.workMode}</span></div><div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{listing.location}</span><span className="inline-flex items-center gap-1.5"><UsersRound className="size-3.5" />{countMap.get(listing._id.toString()) ?? 0} applicants</span></div><p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">{listing.description}</p><Link href={`/recruiter/listings/${listing._id.toString()}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold group-hover:text-primary">Open pipeline <ArrowRight className="size-4" /></Link></article>)}</div>}
  </main>;
}
