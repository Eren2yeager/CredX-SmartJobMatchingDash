// ponytail: stub — real implementation in task 9.1
// Exports the two functions that profile.service.ts and listing.service.ts call via dynamic import.
// Both are no-ops until task 9.1 wires in Score_Engine and the matches collection.

import { connectDB } from "@/lib/db";

export async function recomputeForStudent(_studentId: string): Promise<void> {
  await connectDB();
  // TODO (task 9.1): upsert Match documents for this student × all listings
}

export async function recomputeForListing(_listingId: string): Promise<void> {
  await connectDB();
  // TODO (task 9.1): upsert Match documents for this listing × all student profiles
}
