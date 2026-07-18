import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as Profile_Service from "@/modules/profile/profile.service";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const profile = await Profile_Service.get(session.user.id);
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  return Response.json(profile);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json().catch(() => ({}));

  try {
    const profile = await Profile_Service.create(session.user.id, body);
    return Response.json(profile, { status: 201 });
  } catch (err) {
    if (err instanceof Profile_Service.ProfileValidationError)
      return Response.json({ error: "Validation failed", fields: err.fields }, { status: 422 });
    if (err instanceof Profile_Service.ProfileAlreadyExistsError)
      return Response.json({ error: err.message }, { status: 409 });
    throw err;
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json().catch(() => ({}));

  try {
    const profile = await Profile_Service.update(session.user.id, body);
    return Response.json(profile);
  } catch (err) {
    if (err instanceof Profile_Service.ProfileValidationError)
      return Response.json({ error: "Validation failed", fields: err.fields }, { status: 422 });
    if (err instanceof Profile_Service.ProfileNotFoundError)
      return Response.json({ error: err.message }, { status: 404 });
    throw err;
  }
}
