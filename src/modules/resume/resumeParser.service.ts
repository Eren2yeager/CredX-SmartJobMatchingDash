import Groq from "groq-sdk";
import * as mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import englishOcrData from "@tesseract.js-data/eng";
import { uploadResume } from "@/lib/cloudinary";

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

type ResumeKind = "pdf" | "docx" | "image";

const MAX_SIZE = 5 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  let rawText = "";

  if (kind === "pdf") rawText = await extractPdfText(fileBuffer);
  if (kind === "docx") rawText = await extractDocxText(fileBuffer);
  if (kind === "image") rawText = await extractImageText(fileBuffer);

  if (!rawText.trim()) {
    throw new ResumeValidationError(
      400,
      "No readable text was found. For scanned resumes, upload a clear PNG, JPEG, or WebP image."
    );
  }

  const extension = kind === "image" ? imageExtension(mimeType) : kind;
  const filename = `resume-${Date.now()}.${extension}`;
  const { url: resumeUrl } = await uploadResume(fileBuffer, filename);

  let parsedSkills: string[] = [];
  let analysisWarning: string | undefined;
  try {
    parsedSkills = await analyzeTextResume(rawText);
  } catch (error) {
    console.error("Resume analysis failed", error);
    analysisWarning = "Resume uploaded, but skill analysis is temporarily unavailable.";
  }

  return { resumeUrl, parsedSkills, analysisWarning };
}

function detectResumeKind(buffer: Buffer, mimeType: string, originalName: string): ResumeKind {
  const lowerName = originalName.toLowerCase();
  const isPdf =
    mimeType === "application/pdf" &&
    lowerName.endsWith(".pdf") &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (isPdf) return "pdf";

  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (mimeType === DOCX_MIME && lowerName.endsWith(".docx") && isZip) return "docx";

  if (IMAGE_MIMES.has(mimeType) && hasImageSignature(buffer, mimeType)) return "image";

  throw new ResumeValidationError(
    400,
    "Upload a valid PDF, DOCX, PNG, JPEG, or WebP resume."
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

async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    return (await parser.getText()).text;
  } catch {
    throw new ResumeValidationError(
      400,
      "The PDF could not be read. It may be damaged or password-protected."
    );
  } finally {
    await parser.destroy();
  }
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

async function extractImageText(fileBuffer: Buffer): Promise<string> {
  const worker = await createWorker("eng", 1, {
    langPath: englishOcrData.langPath,
    gzip: englishOcrData.gzip,
    cacheMethod: "none",
  });
  try {
    return (await worker.recognize(fileBuffer)).data.text;
  } catch {
    throw new ResumeValidationError(
      400,
      "The resume image could not be read. Upload a clearer PNG, JPEG, or WebP image."
    );
  } finally {
    await worker.terminate();
  }
}

function createGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing");
  return new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 1 });
}

async function analyzeTextResume(rawText: string): Promise<string[]> {
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
              content: "You extract technical skills from resumes and return valid JSON only.",
            },
            {
              role: "user",
              content: `${skillPrompt()}\n\nResume text:\n${rawText.slice(0, 12_000)}`,
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

function skillPrompt(): string {
  return 'Read this resume and extract technical and professional skills. Return ONLY valid JSON in this exact format: {"skills":["skill1","skill2"]}. Do not infer skills that are not present.';
}

function parseGroqResponse(raw: string): string[] {
  try {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(stripped);
    if (!parsed || !Array.isArray(parsed.skills)) return [];
    return [...new Set(
      (parsed.skills as unknown[])
        .filter((skill): skill is string => typeof skill === "string")
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean)
    )].slice(0, 50);
  } catch {
    return [];
  }
}
