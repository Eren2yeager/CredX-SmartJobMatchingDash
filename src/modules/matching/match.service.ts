import { connectDB } from "@/lib/db";
import Match from "@/modules/matching/match.model";
import StudentProfile from "@/modules/profile/profile.model";
import Listing from "@/modules/listings/listing.model";
import { computeMatchScore } from "@/modules/matching/scoreEngine";

export async function recomputeForStudent(studentId: string): Promise<void> {
  await connectDB();

  const profile = await StudentProfile.findById(studentId).lean();
  if (!profile) return;

  const listings = await Listing.find().lean();

  await Promise.all(
    listings.map((listing) => {
      const { score, breakdown } = computeMatchScore(profile, listing);
      return Match.findOneAndUpdate(
        { studentId, listingId: listing._id },
        { $set: { score, breakdown, computedAt: new Date() } },
        { upsert: true }
      );
    })
  );
}

export async function recomputeForListing(listingId: string): Promise<void> {
  await connectDB();

  const listing = await Listing.findById(listingId).lean();
  if (!listing) return;

  const profiles = await StudentProfile.find().lean();

  await Promise.all(
    profiles.map((profile) => {
      const { score, breakdown } = computeMatchScore(profile, listing);
      return Match.findOneAndUpdate(
        { studentId: profile._id, listingId },
        { $set: { score, breakdown, computedAt: new Date() } },
        { upsert: true }
      );
    })
  );
}

export async function getMatchesForStudent(studentId: string) {
  await connectDB();

  return Match.find({ studentId })
    .sort({ score: -1 })
    .populate("listingId", "title company location workMode sponsorshipOffered")
    .lean();
}
