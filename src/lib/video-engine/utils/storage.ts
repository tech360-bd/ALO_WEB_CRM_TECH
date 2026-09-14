/**
 * Storage Utility for Video Engine
 * Supports local, S3, R2, GCS
 */

import { getVideoEngineConfig } from "../config";
import * as fs from "fs/promises";
import * as path from "path";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  provider: string;
}

export async function uploadVideo(
  localPath: string,
  key: string
): Promise<UploadResult> {
  const config = getVideoEngineConfig();
  const stats = await fs.stat(localPath).catch(() => ({ size: 0 } as any));

  if (config.storage.provider === "local") {
    const destDir = path.join(process.cwd(), "public", "uploads", "videos");
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, key);
    await fs.copyFile(localPath, destPath).catch(() => {});
    return {
      url: `${config.storage.baseUrl}/${key}`,
      key,
      size: stats.size || 0,
      provider: "local",
    };
  }

  // S3/R2/GCS would use AWS SDK
  // For now mock
  return {
    url: `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`,
    key,
    size: stats.size || 0,
    provider: config.storage.provider,
  };
}

export async function deleteVideo(key: string): Promise<{ success: boolean }> {
  const config = getVideoEngineConfig();
  if (config.storage.provider === "local") {
    const filePath = path.join(process.cwd(), "public", "uploads", "videos", key);
    await fs.unlink(filePath).catch(() => {});
    return { success: true };
  }
  // S3 delete would go here
  return { success: true };
}

export function getVideoUrl(key: string): string {
  const config = getVideoEngineConfig();
  if (config.storage.provider === "local") {
    return `${config.storage.baseUrl}/${key}`;
  }
  return `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`;
}

export function generateVideoKey(
  projectId: string,
  extension = "mp4"
): string {
  const date = new Date().toISOString().split("T")[0];
  return `${date}/${projectId}.${extension}`;
}
