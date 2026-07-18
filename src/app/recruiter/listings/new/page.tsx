import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { PageHeading } from "@/components/page-heading";

export default async function NewListingPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  return <main className="app-container py-10 sm:py-14"><PageHeading title="POST A ROLE" description="Create a listing with enough signal for candidates to understand the work and for CredX to match it well." className="mb-8" /><ListingForm /></main>;
}
