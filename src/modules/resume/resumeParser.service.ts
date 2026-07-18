import Groq from "groq-sdk";
import { uploadResume } from "@/lib/cloudinary";

// ponytail: no pdf-parse installed — latin1 decode extracts readable text tokens from PDF byte stream;
// quality is lower than a real PDF parser but avoids a new dependency. Upgrade path: `bun add pdf-parse`.

export interface ParseResumeResult {
  resumeUrl: string;
  parsedSkills: string[];
  analysisWarning?: string;
}

export class ResumeValidationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function parseResume(
  fileBuffer: Buffer,
  mimeType: string,
  size: number
): Promise<ParseResumeResult> {
  // 1. Validate BEFORE touching Cloudinary (Req 8.2)
  if (mimeType !== "application/pdf" || size > MAX_SIZE) {
    throw new ResumeValidationError(
      400,
      mimeType !== "application/pdf"
        ? "Only PDF files are accepted"
        : "File exceeds the 5 MB limit"
    );
  }

  // 2. Upload to Cloudinary — let errors propagate (caller maps to 502)
  const filename = `resume-${Date.now()}`;
  const { url: resumeUrl } = await uploadResume(fileBuffer, filename);

  // 3. Extract text from PDF buffer (latin1 exposes readable strings in the byte stream)
  const rawText = fileBuffer.toString("latin1");

  // 4. Call Groq — failures are fully swallowed (Req 8.5)
  let parsedSkills: string[] = [];
  let analysisWarning: string | undefined;
  try {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing");

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      maxRetries: 1,
    });
    const completion = await groq.chat.completions.create(
      {
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You extract technical skills from resumes and return valid JSON only.",
          },
          {
            role: "user",
            content: `Extract a JSON array of technical skills from this resume text. Respond with ONLY valid JSON in this exact format: {"skills": ["skill1", "skill2"]}. No markdown, no explanation.\n\n${rawText.slice(0, 8000)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      },
      { timeout: 10_000 } // Req 8.5: fail after 10 s
    );

    const raw = completion.choices[0]?.message?.content ?? "";
    parsedSkills = parseGroqResponse(raw);
  } catch (error) {
    console.error("Resume analysis failed", error);
    // Groq failure must NEVER throw (Req 8.5) — return empty skills
    parsedSkills = [];
    analysisWarning = "Resume uploaded, but skill analysis is temporarily unavailable.";
  }

  return { resumeUrl, parsedSkills, analysisWarning };
}

// ── Defensive Groq response parser (Req 8.4) ─────────────────────────────────

function parseGroqResponse(raw: string): string[] {
  try {
    // Strip markdown fences: ```json ... ``` or ``` ... ```
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(stripped);
    if (!parsed || !Array.isArray(parsed.skills)) return [];
    // Lowercase all, cap at 50, filter non-strings (Req 8.4, 8.8)
    return (parsed.skills as unknown[])
      .filter((s): s is string => typeof s === "string")
      .slice(0, 50)
      .map((s) => s.toLowerCase());
  } catch {
    return [];
  }
}
