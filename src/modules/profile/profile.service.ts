import { after } from "next/server";
import StudentProfile, { IStudentProfile } from "@/modules/profile/profile.model";

// Lazy import to avoid circular: match.service → profile.model, profile.service → match.service
// ponytail: dynamic import breaks the cycle at runtime; no perf concern (called once per mutation)
async function triggerRecompute(studentId: string) {
  const { recomputeForStudent } = await import("@/modules/matching/match.service");
  await recomputeForStudent(studentId);
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_WORK_AUTH = [
  "citizen",
  "permanent_resident",
  "visa_sponsorship_required",
  "other",
] as const;

type WorkAuthStatus = (typeof VALID_WORK_AUTH)[number];

export interface ProfileInput {
  skills: string[];
  gpa: number;
  workAuthStatus: WorkAuthStatus;
  location?: string;
}

export interface ProfilePatch {
  skills?: string[];
  gpa?: number;
  workAuthStatus?: WorkAuthStatus;
  location?: string;
}

type ValidationError = { ok: false; fields: Record<string, string> };
type ValidationOk<T> = { ok: true; data: T };

function validateCreate(body: unknown): ValidationOk<ProfileInput> | ValidationError {
  const b = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  if (!Array.isArray(b?.skills) || b.skills.length === 0)
    fields.skills = "must be a non-empty array";

  if (typeof b?.gpa !== "number" || b.gpa < 0 || b.gpa > 10)
    fields.gpa = "must be a number in [0.0, 10.0]";

  if (!VALID_WORK_AUTH.includes(b?.workAuthStatus as WorkAuthStatus))
    fields.workAuthStatus = "must be one of: citizen, permanent_resident, visa_sponsorship_required, other";

  if (b?.location !== undefined && typeof b.location !== "string")
    fields.location = "must be a string";

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data: b as unknown as ProfileInput };
}

function validatePatch(body: unknown): ValidationOk<ProfilePatch> | ValidationError {
  const b = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  if (b?.skills !== undefined) {
    if (!Array.isArray(b.skills) || b.skills.length === 0)
      fields.skills = "must be a non-empty array";
  }

  if (b?.gpa !== undefined) {
    if (typeof b.gpa !== "number" || b.gpa < 0 || b.gpa > 10)
      fields.gpa = "must be a number in [0.0, 10.0]";
  }

  if (b?.workAuthStatus !== undefined) {
    if (!VALID_WORK_AUTH.includes(b.workAuthStatus as WorkAuthStatus))
      fields.workAuthStatus = "must be one of: citizen, permanent_resident, visa_sponsorship_required, other";
  }

  if (b?.location !== undefined && typeof b.location !== "string")
    fields.location = "must be a string";

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data: b as ProfilePatch };
}

function normalizeSkills(skills: string[]): string[] {
  return skills.map((s) => s.toLowerCase());
}

// ── Service errors ────────────────────────────────────────────────────────────

export class ProfileNotFoundError extends Error {}
export class ProfileAlreadyExistsError extends Error {}
export class ProfileValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("Validation failed");
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function get(userId: string): Promise<IStudentProfile | null> {
  return StudentProfile.findOne({ userId }).lean();
}

export async function create(
  userId: string,
  rawInput: unknown
): Promise<IStudentProfile> {
  const validation = validateCreate(rawInput);
  if (!validation.ok) throw new ProfileValidationError(validation.fields);

  const { data } = validation;

  // Check for existing profile (409)
  const existing = await StudentProfile.findOne({ userId }).lean();
  if (existing) throw new ProfileAlreadyExistsError("Profile already exists");

  const now = new Date();
  const profile = await StudentProfile.create({
    userId,
    skills:        normalizeSkills(data.skills),
    gpa:           data.gpa,
    workAuthStatus: data.workAuthStatus,
    location:      data.location,
    createdAt:     now,
    updatedAt:     now,
  });

  // Non-blocking recompute — swallow errors so profile response is unaffected
  after(async () => {
    try {
      await triggerRecompute(profile._id.toString());
    } catch (err) {
      console.error("[match-recompute] failed for student", profile._id, err);
    }
  });

  return profile.toObject();
}

export async function update(
  userId: string,
  rawInput: unknown
): Promise<IStudentProfile> {
  const validation = validatePatch(rawInput);
  if (!validation.ok) throw new ProfileValidationError(validation.fields);

  const { data } = validation;

  const patch: Partial<IStudentProfile> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (data.skills !== undefined) patch.skills = normalizeSkills(data.skills);
  if (data.gpa !== undefined) patch.gpa = data.gpa;
  if (data.workAuthStatus !== undefined) patch.workAuthStatus = data.workAuthStatus;
  if (data.location !== undefined) patch.location = data.location;

  const updated = await StudentProfile.findOneAndUpdate(
    { userId },
    { $set: patch },
    { new: true }
  ).lean();

  if (!updated) throw new ProfileNotFoundError("Profile not found");

  // Non-blocking recompute — swallow errors
  after(async () => {
    try {
      await triggerRecompute(updated._id.toString());
    } catch (err) {
      console.error("[match-recompute] failed for student", updated._id, err);
    }
  });

  return updated;
}
