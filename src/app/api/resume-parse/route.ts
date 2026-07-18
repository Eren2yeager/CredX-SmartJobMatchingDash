import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import * as Resume_Parser from "@/modules/resume/resumeParser.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return Response.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("resume");
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "Missing resume field" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { resumeUrl, parsedSkills } = await Resume_Parser.parseResume(
      buffer,
      file.type,
      file.size
    );
    return Response.json({ resumeUrl, parsedSkills }, { status: 200 });
  } catch (err) {
    if (err instanceof Resume_Parser.ResumeValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    // Cloudinary failure or other unexpected error → 502
    return Response.json({ error: "Upload failed" }, { status: 502 });
  }
}
