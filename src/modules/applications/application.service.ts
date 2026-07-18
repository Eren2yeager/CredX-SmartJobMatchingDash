import Application from "@/modules/applications/application.model";
import Listing from "@/modules/listings/listing.model";

// ── Service errors ────────────────────────────────────────────────────────────

export class ApplicationListingNotFoundError extends Error {}
export class ApplicationDuplicateError extends Error {}
export class ApplicationNotFoundError extends Error {}
export class ApplicationForbiddenError extends Error {}
export class ApplicationValidationError extends Error {}

// ── Service functions ─────────────────────────────────────────────────────────

const VALID_STATUSES = ["under_review", "accepted", "rejected"] as const;

export async function apply(studentId: string, listingId: string) {
  const listing = await Listing.findById(listingId).lean();
  if (!listing) throw new ApplicationListingNotFoundError("Listing not found");

  const now = new Date();
  try {
    const application = await Application.create({
      studentId,
      listingId,
      status: "applied",
      appliedAt: now,
      updatedAt: now,
    });
    return application.toObject();
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === 11000
    )
      throw new ApplicationDuplicateError("Already applied");
    throw err;
  }
}

export async function listForStudent(studentId: string) {
  return Application.find({ studentId })
    .populate("listingId", "title company location")
    .sort({ appliedAt: -1 })
    .lean();
}

export async function listForRecruiter(recruiterId: string) {
  const listings = await Listing.find({ recruiterId }).select("_id").lean();
  const listingIds = listings.map((listing) => listing._id);

  return Application.find({ listingId: { $in: listingIds } })
    .populate("listingId", "title company location")
    .populate("studentId", "name email image")
    .sort({ appliedAt: -1 })
    .lean();
}

export async function updateStatus(
  applicationId: string,
  newStatus: string,
  requesterId: string
) {
  if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number]))
    throw new ApplicationValidationError(`Invalid status: ${newStatus}`);

  const application = await Application.findById(applicationId)
    .populate<{ listingId: { recruiterId: { toString(): string } } }>("listingId", "recruiterId")
    .exec();
  if (!application) throw new ApplicationNotFoundError("Application not found");

  const listing = application.listingId as { recruiterId: { toString(): string } | null };
  if (!listing?.recruiterId || listing.recruiterId.toString() !== requesterId)
    throw new ApplicationForbiddenError("Forbidden");

  application.status = newStatus as "under_review" | "accepted" | "rejected";
  application.updatedAt = new Date();
  await application.save();
  return application.toObject();
}
