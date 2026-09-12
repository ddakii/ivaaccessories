import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfigured, env } from "./env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(here, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (cloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export async function saveImageBuffer(buffer: Buffer, filename: string, folder = "iva") {
  if (cloudinaryConfigured()) {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, uploaded) => {
          if (error || !uploaded) reject(error ?? new Error("Cloudinary upload failed"));
          else resolve({ secure_url: uploaded.secure_url });
        }
      );
      stream.end(buffer);
    });
    return result.secure_url;
  }

  const safe = `${Date.now()}-${filename.replace(/[^\w.\-]+/g, "_")}`;
  const dest = path.join(uploadsDir, safe);
  await fs.promises.writeFile(dest, buffer);
  return `/uploads/${safe}`;
}

export function publicFileUrl(storedPath: string) {
  if (storedPath.startsWith("http")) return storedPath;
  return `${env.serverUrl}${storedPath.startsWith("/") ? "" : "/"}${storedPath}`;
}
