import { v2 as cloudinary } from "cloudinary";

export class ResumeStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ResumeStorageError";
  }
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ResumeStorageError("Resume storage is not configured");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export async function uploadResume(
  buffer: Buffer,
  filename: string
): Promise<{ url: string }> {
  configureCloudinary();

  const publicId = filename;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await uploadOnce(buffer, publicId);
    } catch (error) {
      lastError = error;
    }
  }

  throw new ResumeStorageError("Cloudinary could not store the resume", {
    cause: lastError,
  });
}

function uploadOnce(buffer: Buffer, publicId: string): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "resumes",
        public_id: publicId,
        overwrite: true,
        timeout: 30_000,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary returned no secure URL"));
          return;
        }
        resolve({ url: result.secure_url });
      }
    );
    stream.end(buffer);
  });
}
