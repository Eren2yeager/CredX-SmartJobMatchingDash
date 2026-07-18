import { after } from "next/server";
import Listing, { IListing } from "@/modules/listings/listing.model";
import User from "@/modules/user/user.model";

// Lazy import to break circular: match.service → listing.model, listing.service → match.service
// ponytail: dynamic import breaks the cycle at runtime; no perf concern (called once per mutation)
async function triggerRecompute(listingId: string) {
  const { recomputeForListing } = await import("@/modules/matching/match.service");
  await recomputeForListing(listingId);
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_WORK_MODES = ["remote", "onsite", "hybrid"] as const;
type WorkMode = (typeof VALID_WORK_MODES)[number];

export interface ListingInput {
  title: string;
  company: string;
  requiredSkills: string[];
  minGpa: number;
  location: string;
  workMode: WorkMode;
  sponsorshipOffered: boolean;
  description: string;
}

export interface ListingFilters {
  workMode?: WorkMode;
  sponsorship?: boolean;
  location?: string;
}

type ValidationError = { ok: false; fields: Record<string, string> };
type ValidationOk<T> = { ok: true; data: T };

function validateCreate(body: unknown): ValidationOk<ListingInput> | ValidationError {
  const b = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  if (typeof b?.title !== "string" || b.title.length < 1 || b.title.length > 200)
    fields.title = "must be a string between 1 and 200 characters";

  if (typeof b?.company !== "string" || b.company.length < 1 || b.company.length > 200)
    fields.company = "must be a string between 1 and 200 characters";

  if (!Array.isArray(b?.requiredSkills) || b.requiredSkills.length === 0 || b.requiredSkills.length > 50)
    fields.requiredSkills = "must be a non-empty array with at most 50 items";

  if (typeof b?.minGpa !== "number" || b.minGpa < 0 || b.minGpa > 10)
    fields.minGpa = "must be a number in [0.0, 10.0]";

  if (typeof b?.location !== "string" || b.location.length < 1 || b.location.length > 200)
    fields.location = "must be a string between 1 and 200 characters";

  if (!VALID_WORK_MODES.includes(b?.workMode as WorkMode))
    fields.workMode = "must be one of: remote, onsite, hybrid";

  if (typeof b?.sponsorshipOffered !== "boolean")
    fields.sponsorshipOffered = "must be a boolean";

  if (typeof b?.description !== "string" || b.description.length < 1 || b.description.length > 2000)
    fields.description = "must be a string between 1 and 2000 characters";

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data: b as unknown as ListingInput };
}

// ── Service errors ────────────────────────────────────────────────────────────

export class ListingValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("Validation failed");
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function list(
  filters: ListingFilters,
  page: number,
  pageSize: number
): Promise<IListing[]> {
  const query: Record<string, unknown> = {};

  if (filters.workMode) query.workMode = filters.workMode;
  if (filters.sponsorship !== undefined) query.sponsorshipOffered = filters.sponsorship;
  if (filters.location) query.location = { $regex: filters.location, $options: "i" };

  // ponytail: pageSize capped at 100 per requirements; no skip-based pagination upgrade path needed at hackathon scale
  const size = Math.min(pageSize, 100);
  const skip = (page - 1) * size;

  return Listing.find(query).sort({ createdAt: -1 }).skip(skip).limit(size).lean();
}

export async function create(
  recruiterId: string,
  rawInput: unknown
): Promise<IListing> {
  const validation = validateCreate(rawInput);
  if (!validation.ok) throw new ListingValidationError(validation.fields);

  const { data } = validation;

  const listing = await Listing.create({
    recruiterId,
    title:              data.title,
    company:            data.company,
    requiredSkills:     data.requiredSkills.map((s) => s.toLowerCase()),
    minGpa:             data.minGpa,
    location:           data.location,
    workMode:           data.workMode,
    sponsorshipOffered: data.sponsorshipOffered,
    description:        data.description,
    createdAt:          new Date(),
  });

  // Set isRecruiter: true on the user — fire-and-forget, non-blocking
  after(async () => {
    try {
      await User.findByIdAndUpdate(recruiterId, { $set: { isRecruiter: true } });
    } catch (err) {
      console.error("[listing-create] failed to set isRecruiter on user", recruiterId, err);
    }
  });

  // Non-blocking recompute — swallow errors so listing response is unaffected
  after(async () => {
    try {
      await triggerRecompute(listing._id.toString());
    } catch (err) {
      console.error("[match-recompute] failed for listing", listing._id, err);
    }
  });

  return listing.toObject();
}
