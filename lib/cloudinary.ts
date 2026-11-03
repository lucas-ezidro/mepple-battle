// Server-only: Cloudinary configuration and profile avatar upload helper.
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class InvalidAvatarFileError extends Error {}

function getCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET não configurados");
  }

  return { cloudName, apiKey, apiSecret };
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new InvalidAvatarFileError("invalid_type");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new InvalidAvatarFileError("file_too_large");
  }

  const { cloudName, apiKey, apiSecret } = getCredentials();
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    // Fixed public_id per user so re-uploads overwrite the previous avatar instead of accumulating assets.
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        public_id: userId,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
      },
      (error, response) => {
        if (error || !response) reject(error ?? new Error("cloudinary_upload_failed"));
        else resolve(response);
      }
    );
    stream.end(buffer);
  });

  return result.secure_url;
}
