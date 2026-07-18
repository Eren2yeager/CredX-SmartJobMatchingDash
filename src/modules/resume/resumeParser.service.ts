import Groq from "groq-sdk";
import * as mammoth from "mammoth";
import { uploadResume } from "@/lib/cloudinary";

export interface ParseResumeResult {
  resumeUrl: string;
  parsedSkills: string[];
  extractedData: ResumeExtraction;
  analysisWarning?: string;
}

export interface ResumeExtraction {
  skills: string[];
  gpa: number | null;
  education: string[];
  yearsOfExperience: number | null;
  location: string | null;
}

export class ResumeValidationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type ResumeKind = "docx" | "image";

const MAX_SIZE = 5 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_RESUME_TEXT_CHARS = 12_000;
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function parseResume(
  fileBuffer: Buffer,
  mimeType: string,
  size: number,
  originalName: string
): Promise<ParseResumeResult> {
  if (size > MAX_SIZE) {
    throw new ResumeValidationError(400, "File exceeds the 5 MB limit");
  }

  const kind = detectResumeKind(fileBuffer, mimeType, originalName);
  const extension = kind === "image" ? imageExtension(mimeType) : kind;
  const filename = `resume-${Date.now()}.${extension}`;
  const { url: resumeUrl } = await uploadResume(fileBuffer, filename);

  let extractedData = emptyResumeExtraction();
  let analysisWarning: string | undefined;
  try {
    extractedData = await analyzeResume(fileBuffer, mimeType, kind);
  } catch (error) {
    if (error instanceof ResumeValidationError) {
      analysisWarning = error.message;
    } else {
      console.error("Resume analysis failed", error);
      analysisWarning = humanizeAnalysisError(error, kind);
    }
  }

  return { resumeUrl, parsedSkills: extractedData.skills, extractedData, analysisWarning };
}

function detectResumeKind(buffer: Buffer, mimeType: string, originalName: string): ResumeKind {
  const lowerName = originalName.toLowerCase();
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (mimeType === DOCX_MIME && lowerName.endsWith(".docx") && isZip) return "docx";

  if (IMAGE_MIMES.has(mimeType) && hasImageSignature(buffer, mimeType)) return "image";

  throw new ResumeValidationError(
    400,
    "Upload a valid DOCX, PNG, JPEG, or WebP resume."
  );
}

function hasImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return (
    mimeType === "image/webp" &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function imageExtension(mimeType: string): "jpg" | "png" | "webp" {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

async function extractDocxText(fileBuffer: Buffer): Promise<string> {
  try {
    return (await mammoth.extractRawText({ buffer: fileBuffer })).value;
  } catch {
    throw new ResumeValidationError(
      400,
      "The DOCX file could not be read. It may be damaged or password-protected."
    );
  }
}

function createGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing");
  return new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 1 });
}

async function analyzeResume(
  fileBuffer: Buffer,
  mimeType: string,
  kind: ResumeKind
): Promise<ResumeExtraction> {
  if (kind === "docx") {
    const rawText = await extractDocxText(fileBuffer);
    if (!rawText.trim()) {
      throw new ResumeValidationError(400, "No readable text was found in the DOCX resume.");
    }
    return analyzeTextResume(rawText);
  }

  return analyzeVisionResume(bufferToDataUrl(fileBuffer, mimeType));
}

async function analyzeTextResume(rawText: string): Promise<ResumeExtraction> {
  const groq = createGroqClient();
  let lastError: unknown;

  for (const model of ["openai/gpt-oss-20b", "llama-3.1-8b-instant"]) {
    try {
      const completion = await groq.chat.completions.create(
        {
          model,
          messages: [
            {
              role: "system",
              content: "You read resumes and return valid JSON only.",
            },
            {
              role: "user",
              content: `${structuredResumePrompt("text")}\n\nResume text:\n${rawText.slice(0, MAX_RESUME_TEXT_CHARS)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        },
        { timeout: 30_000 }
      );
      return parseGroqResponse(completion.choices[0]?.message?.content ?? "");
    } catch (error) {
      lastError = error;
      console.warn(`Resume analysis model ${model} failed; trying fallback.`);
    }
  }

  throw lastError ?? new Error("No Groq analysis model was available");
}

async function analyzeVisionResume(imageDataUrl: string): Promise<ResumeExtraction> {
  const groq = createGroqClient();
  let lastError: unknown;

  for (const model of [VISION_MODEL, "qwen/qwen3.6-27b"]) {
    try {
      const completion = await groq.chat.completions.create(
        {
          model,
          messages: [
            {
              role: "system",
              content: "You read resume images carefully and return valid JSON only.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: structuredResumePrompt("vision"),
                },
                {
                  type: "image_url",
                  image_url: { url: imageDataUrl },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        },
        { timeout: 30_000 }
      );
      return parseGroqResponse(completion.choices[0]?.message?.content ?? "");
    } catch (error) {
      lastError = error;
      console.warn(`Resume vision model ${model} failed; trying fallback.`);
    }
  }

  throw lastError ?? new Error("No Groq vision model was available");
}

function structuredResumePrompt(mode: "text" | "vision"): string {
  const baseInstruction =
    'Return ONLY valid JSON in this exact shape: {"skills":[],"gpa":null,"education":[],"yearsOfExperience":null,"location":null}. Use [] for unknown arrays and null for unknown scalar values. Do not infer facts that are not present.';
  if (mode === "vision") {
    return `Read all visible text from this resume image or scanned page and extract structured resume data. ${baseInstruction}`;
  }
  return `Read this resume text and extract structured resume data. ${baseInstruction}`;
}

function parseGroqResponse(raw: string): ResumeExtraction {
  try {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    return normalizeResumeExtraction(JSON.parse(stripped));
  } catch {
    return emptyResumeExtraction();
  }
}

function normalizeResumeExtraction(value: unknown): ResumeExtraction {
  const parsed = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  return {
    skills: normalizeSkills(parsed.skills),
    gpa: normalizeNullableNumber(parsed.gpa, { min: 0, max: 10 }),
    education: normalizeStringArray(parsed.education, 10),
    yearsOfExperience: normalizeNullableNumber(parsed.yearsOfExperience, { min: 0, max: 80 }),
    location: normalizeNullableString(parsed.location),
  };
}

function normalizeSkills(value: unknown): string[] {
  return normalizeStringArray(value, 50).map((skill) => skill.toLowerCase());
}

function normalizeStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      const single = value.trim();
      return single ? [single] : [];
    }
    return [];
  }

  return [...new Set(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  )].slice(0, limit);
}

function normalizeNullableNumber(
  value: unknown,
  range: { min: number; max: number }
): number | null {
  const candidate = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number.parseFloat(value)
      : Number.NaN;

  if (!Number.isFinite(candidate)) return null;
  if (candidate < range.min || candidate > range.max) return null;
  return Number(candidate.toFixed(2));
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function emptyResumeExtraction(): ResumeExtraction {
  return {
    skills: [],
    gpa: null,
    education: [],
    yearsOfExperience: null,
    location: null,
  };
}

function bufferToDataUrl(fileBuffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

function humanizeAnalysisError(error: unknown, kind: ResumeKind): string {
  const status = typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: number }).status
    : undefined;
  const code = typeof error === "object" && error !== null && "error" in error
    ? extractErrorCode((error as { error?: unknown }).error)
    : undefined;

  if (kind !== "docx" && (status === 404 || code === "model_not_found")) {
    return "Resume uploaded, but image-based analysis is unavailable for this Groq account right now. Try a DOCX file or enable a Groq vision model.";
  }

  return "Resume uploaded, but skill analysis is temporarily unavailable.";
}

function extractErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const nested = error as { error?: { code?: string } };
  return nested.error?.code;
}
