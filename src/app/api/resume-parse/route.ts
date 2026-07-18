import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ResumeStorageError } from "@/lib/cloudinary";
import * as Resume_Parser from "@/modules/resume/resumeParser.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return Response.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("resume");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Missing resume field" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { resumeUrl, parsedSkills, analysisWarning } = await Resume_Parser.parseResume(
      buffer,
      file.type,
      file.size,
      file.name
    );
    return Response.json({ resumeUrl, parsedSkills, analysisWarning }, { status: 200 });
  } catch (err) {
    if (err instanceof Resume_Parser.ResumeValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    // Cloudinary failure or other unexpected error → 502
    console.error("Resume upload failed", err);
    if (err instanceof ResumeStorageError) {
      return Response.json(
        { error: "We could not store your resume. Please try again." },
        { status: 502 }
      );
    }
    return Response.json(
      { error: "Resume processing failed. Please try again." },
      { status: 500 }
    );
  }
}
