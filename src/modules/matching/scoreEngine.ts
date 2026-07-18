import type { IStudentProfile } from "@/modules/profile/profile.model";
import type { IListing } from "@/modules/listings/listing.model";

export interface MatchResult {
  score: number; // 0–100, final weighted + capped
  breakdown: {
    skillScore: number;          // 0–100, Jaccard × 100
    gpaScore: number;            // 0–100, linear decay
    workAuthCompatible: boolean;
    matchedSkills: string[];     // intersection, order from listing
  };
}

type ProfileInput = Pick<IStudentProfile, "skills" | "gpa" | "workAuthStatus">;
type ListingInput = Pick<IListing, "requiredSkills" | "minGpa" | "sponsorshipOffered">;

export function computeMatchScore(
  profile: ProfileInput,
  listing: ListingInput
): MatchResult {
  // Step 1 — Skill Score (60% weight): Jaccard similarity × 100
  const profileSet = new Set(profile.skills ?? []);
  const listingSkills = listing.requiredSkills ?? [];

  const matchedSkills = listingSkills.filter((s) => profileSet.has(s));
  const intersectionSize = matchedSkills.length;
  const unionSize = new Set([...profileSet, ...listingSkills]).size;

  // ponytail: special case — 0/0 would be NaN; both-empty means full match by spec
  const skillScore =
    unionSize === 0
      ? 100
      : Math.round((intersectionSize / unionSize) * 100 * 100) / 100;

  // Step 2 — GPA Score (25% weight): linear decay 1.0 below threshold → 0
  const gpa = profile.gpa ?? 0;
  const minGpa = listing.minGpa ?? 0;
  let gpaScore: number;
  if (gpa >= minGpa) {
    gpaScore = 100;
  } else {
    // decay from 100 at minGpa to 0 at (minGpa - 1.0), clamped to [0, 100]
    gpaScore = Math.min(100, Math.max(0, ((gpa - (minGpa - 1.0)) / 1.0) * 100));
  }

  // Step 3 — Work Auth Score (15% weight)
  const workAuthCompatible = !(
    profile.workAuthStatus === "visa_sponsorship_required" &&
    listing.sponsorshipOffered === false
  );
  const workAuthSubScore = workAuthCompatible ? 100 : 0;

  // Step 4 — Final Score: weighted sum, then cap at 20 if incompatible
  const raw = Math.round(
    skillScore * 0.6 + gpaScore * 0.25 + workAuthSubScore * 0.15
  );
  // ponytail: cap at 20 (not zero) so near-misses stay visible on the dashboard
  const score = workAuthCompatible ? raw : Math.min(raw, 20);

  return {
    score,
    breakdown: { skillScore, gpaScore, workAuthCompatible, matchedSkills },
  };
}
