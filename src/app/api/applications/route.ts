import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as Application_Service from "@/modules/applications/application.service";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const applications = await Application_Service.listForStudent(session.user.id);
  return Response.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json().catch(() => ({}));

  try {
    const application = await Application_Service.apply(session.user.id, body.listingId);
    return Response.json(application, { status: 201 });
  } catch (err) {
    if (err instanceof Application_Service.ApplicationListingNotFoundError)
      return Response.json({ error: err.message }, { status: 404 });
    if (err instanceof Application_Service.ApplicationDuplicateError)
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
    const application = await Application_Service.updateStatus(
      body.applicationId,
      body.status,
      session.user.id
    );
    return Response.json(application);
  } catch (err) {
    if (err instanceof Application_Service.ApplicationNotFoundError)
      return Response.json({ error: err.message }, { status: 404 });
    if (err instanceof Application_Service.ApplicationForbiddenError)
      return Response.json({ error: err.message }, { status: 403 });
    if (err instanceof Application_Service.ApplicationValidationError)
      return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
