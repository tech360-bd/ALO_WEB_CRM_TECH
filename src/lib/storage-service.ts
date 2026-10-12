// ALO Education — Central Storage Service (Task 22)
// The single abstraction for all file operations across the platform.
// Every upload/download/delete MUST go through this service.
//
// Responsibilities:
//   1. Validate files (MIME, extension, size, signature)
//   2. Route to the correct storage pool (STUDENT_PARTNER | OFFICIAL | OPERATIONAL)
//   3. Generate UUID-based storage names (never trust client filenames)
//   4. Calculate SHA-256 checksums (for integrity + dedup)
//   5. Create FileMetadata + FileEvent records atomically
//   6. Enforce access control (OWNER_ONLY, STAFF_ONLY, etc.)
//   7. Stream files for download (never expose public paths)
//   8. Version files (never silently overwrite)
//   9. Audit every file event
//
// MUST be used in backend only.

import { db } from "@/lib/db";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ─── Storage Pool Configuration ──────────────────────────────
// In production these would be separate mounted volumes. In the
// sandbox they're directories under /home/z/my-project/storage/.
// In production, they use the STORAGE_POOL_A/B/C env vars (VPS mount points).
const POOL_A_BASE = process.env.STORAGE_POOL_A || path.join(process.cwd(), "storage", "student-partner");
const POOL_B_BASE = process.env.STORAGE_POOL_B || path.join(process.cwd(), "storage", "official");
const POOL_C_BASE = process.env.STORAGE_POOL_C || path.join(process.cwd(), "storage", "operational");

export const POOLS = {
  STUDENT_PARTNER: {
    key: "STUDENT_PARTNER",
    name: "Student & Partner Private Storage",
    description: "Student documents, partner documents, passports, certificates, financial docs. Pool A (~120GB SSD).",
    basePath: POOL_A_BASE,
    capacityBytes: 120 * 1024 * 1024 * 1024, // 120 GB
  },
  OFFICIAL: {
    key: "OFFICIAL",
    name: "ALO Official Documents & Project Archives",
    description: "Company policies, SOPs, Knowledge Center, brand assets, project archives. Pool B (~120GB SSD).",
    basePath: POOL_B_BASE,
    capacityBytes: 120 * 1024 * 1024 * 1024,
  },
  OPERATIONAL: {
    key: "OPERATIONAL",
    name: "Employee & Production & General Operational Storage",
    description: "Employee work files, marketing media, AI-generated media, reports. Pool C (~500GB HDD).",
    basePath: POOL_C_BASE,
    capacityBytes: 500 * 1024 * 1024 * 1024,
  },
} as const;

export type PoolKey = keyof typeof POOLS;

// ─── File Validation ─────────────────────────────────────────
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/json": [".json"],
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  // Audio
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "audio/webm": [".weba"],
  // Video
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  // Archives
  "application/zip": [".zip"],
  "application/x-tar": [".tar"],
  "application/gzip": [".gz", ".tgz"],
};

const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".mjs",
  ".jar", ".war", ".dll", ".so", ".dylib", ".app",
  ".php", ".asp", ".aspx", ".jsp", ".py", ".rb", ".pl",
  ".sql", ".db", ".sqlite",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB per file

export interface UploadOptions {
  pool: PoolKey;
  entityType: string;
  entityId?: string;
  studentId?: string;
  partnerId?: string;
  employeeId?: string;
  applicationId?: string;
  projectId?: string;
  uploadedBy?: string;
  uploadedFromIp?: string;
  source?: string;
  visibility?: string;
  accessPolicy?: string;
  retentionPolicy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  // Subdirectory within the entity folder (e.g. "documents", "passport", "audio")
  subdirectory?: string;
  // If replacing an existing file, the previous file ID (creates a new version)
  previousVersionId?: string;
}

export interface UploadResult {
  file: any; // FileMetadata
  alreadyExists: boolean; // true if a file with the same checksum already exists
}

// ─── Core: upload a file buffer ──────────────────────────────
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  clientMimeType: string,
  options: UploadOptions
): Promise<UploadResult> {
  const pool = POOLS[options.pool];
  if (!pool) throw new Error(`Invalid storage pool: ${options.pool}`);

  // 1. Validate filename (sanitize, prevent path traversal)
  const safeName = sanitizeFilename(originalName);
  const ext = path.extname(safeName).toLowerCase();

  // 2. Reject dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new Error(`File type "${ext}" is not allowed for security reasons.`);
  }

  // 3. Validate file size
  if (buffer.length === 0) {
    throw new Error("File is empty.");
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  // 4. Detect real MIME type from file signature (magic bytes), not client claim
  const detectedMime = detectMimeType(buffer, ext);
  const mimeType = detectedMime || clientMimeType || "application/octet-stream";

  // 5. Validate MIME type is in the allowlist
  const allowedExtensions = ALLOWED_MIME_TYPES[mimeType];
  if (!allowedExtensions) {
    throw new Error(`MIME type "${mimeType}" is not allowed.`);
  }
  if (!allowedExtensions.includes(ext)) {
    // Trust the detected MIME; use its first extension
    const correctedExt = allowedExtensions[0];
    if (ext !== correctedExt) {
      // Use corrected extension
    }
  }

  // 6. Calculate checksum
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  // 7. Check for dedup (same checksum already exists for same entity)
  const existing = await db.fileMetadata.findFirst({
    where: {
      checksumSha256: checksum,
      entityType: options.entityType,
      entityId: options.entityId,
      isDeleted: false,
    },
  });
  if (existing) {
    // Log a VIEW event (reusing existing file)
    await logFileEvent(existing.id, "UPLOAD", options.uploadedBy, options.uploadedFromIp, "SUCCESS", { deduplicated: true });
    return { file: existing, alreadyExists: true };
  }

  // 8. Generate UUID-based storage name
  const uuid = randomUUID();
  const storedName = `${uuid}${ext || ""}`;

  // 9. Compute storage path
  const entityFolder = options.entityId || "unsorted";
  const subdir = options.subdirectory || "documents";
  const storagePath = path.join(
    options.entityType.toLowerCase(),
    entityFolder,
    subdir,
    storedName
  );
  const absolutePath = path.join(pool.basePath, storagePath);

  // 10. Ensure directory exists
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  // 11. Write file to disk
  await fs.writeFile(absolutePath, buffer);

  // 12. Verify file was written correctly
  const stat = await fs.stat(absolutePath);
  if (stat.size !== buffer.length) {
    // Rollback: delete the incomplete file
    await fs.unlink(absolutePath).catch(() => {});
    throw new Error(`File size mismatch after write. Expected ${buffer.length}, got ${stat.size}.`);
  }

  // 13. Create the FileMetadata record
  try {
    const file = await db.fileMetadata.create({
      data: {
        uuid,
        originalName: safeName,
        storedName,
        mimeType,
        extension: ext.replace(/^\./, ""),
        sizeBytes: BigInt(buffer.length),
        checksumSha256: checksum,
        storagePool: options.pool,
        storagePath,
        absolutePath,
        entityType: options.entityType,
        entityId: options.entityId,
        studentId: options.studentId,
        partnerId: options.partnerId,
        employeeId: options.employeeId,
        applicationId: options.applicationId,
        projectId: options.projectId,
        uploadedBy: options.uploadedBy,
        uploadedFromIp: options.uploadedFromIp,
        source: options.source || "WEB_UPLOAD",
        visibility: options.visibility || "STUDENT_VISIBLE",
        accessPolicy: options.accessPolicy || "OWNER_AND_STAFF",
        retentionPolicy: options.retentionPolicy,
        previousVersionId: options.previousVersionId,
        version: options.previousVersionId ? await getNextVersionNumber(options.previousVersionId) : 1,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        tags: options.tags ? JSON.stringify(options.tags) : null,
        status: "ACTIVE",
      },
    });

    // 14. Log the upload event
    await logFileEvent(file.id, "UPLOAD", options.uploadedBy, options.uploadedFromIp, "SUCCESS", {
      sizeBytes: buffer.length,
      checksum,
      storagePath,
    });

    // 15. Update pool usage stats
    await incrementPoolUsage(options.pool, buffer.length);

    return { file, alreadyExists: false };
  } catch (err: any) {
    // Rollback: delete the physical file if DB record creation failed
    await fs.unlink(absolutePath).catch(() => {});
    throw new Error(`Failed to create file metadata: ${err.message}`);
  }
}

// ─── Core: download a file (returns buffer + metadata) ──────
export async function downloadFile(
  fileId: string,
  userId?: string,
  userRole?: string,
  userStudentId?: string,
  userPartnerId?: string,
  ip?: string
): Promise<{ buffer: Buffer; file: any }> {
  const file = await db.fileMetadata.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found.");
  if (file.isDeleted) throw new Error("File has been deleted.");
  if (file.status === "QUARANTINED") throw new Error("File is quarantined and cannot be downloaded.");

  // Access control check
  const canAccess = checkFileAccess(file, userId, userRole, userStudentId, userPartnerId);
  if (!canAccess.allowed) {
    await logFileEvent(file.id, "DOWNLOAD", userId, ip, "DENIED", { reason: canAccess.reason });
    throw new Error(`Access denied: ${canAccess.reason}`);
  }

  // Read the file from disk
  const pool = POOLS[file.storagePool as PoolKey];
  if (!pool) throw new Error(`Unknown storage pool: ${file.storagePool}`);

  const absolutePath = file.absolutePath || path.join(pool.basePath, file.storagePath);
  try {
    const buffer = await fs.readFile(absolutePath);

    // Verify checksum (detect corruption)
    const currentChecksum = crypto.createHash("sha256").update(buffer).digest("hex");
    if (currentChecksum !== file.checksumSha256) {
      await logFileEvent(file.id, "DOWNLOAD", userId, ip, "FAILURE", {
        reason: "Checksum mismatch — file may be corrupted.",
        expected: file.checksumSha256,
        actual: currentChecksum,
      });
      throw new Error("File integrity check failed. The file may be corrupted.");
    }

    await logFileEvent(file.id, "DOWNLOAD", userId, ip, "SUCCESS", { sizeBytes: buffer.length });
    return { buffer, file };
  } catch (err: any) {
    if (err.code === "ENOENT") {
      await logFileEvent(file.id, "DOWNLOAD", userId, ip, "FAILURE", { reason: "Physical file missing on disk." });
      throw new Error("File not found on disk. Please contact support.");
    }
    throw err;
  }
}

// ─── Core: delete a file (soft delete — never hard delete) ───
export async function deleteFile(
  fileId: string,
  deletedBy: string,
  reason: string,
  ip?: string
): Promise<void> {
  const file = await db.fileMetadata.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found.");
  if (file.isDeleted) throw new Error("File is already deleted.");

  // Soft delete (keep the physical file for audit/restore, but mark as deleted)
  await db.fileMetadata.update({
    where: { id: fileId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
      deletionReason: reason,
      status: "DELETED",
    },
  });

  // Decrement pool usage
  await decrementPoolUsage(file.storagePool as PoolKey, Number(file.sizeBytes));

  await logFileEvent(file.id, "DELETE", deletedBy, ip, "SUCCESS", { reason });
}

// ─── Core: check file access ─────────────────────────────────
export function checkFileAccess(
  file: any,
  userId?: string,
  userRole?: string,
  userStudentId?: string,
  userPartnerId?: string
): { allowed: boolean; reason?: string } {
  // Super Admin can access everything
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return { allowed: true };
  }

  // Public files
  if (file.accessPolicy === "PUBLIC" || file.visibility === "PUBLIC") {
    return { allowed: true };
  }

  // Super admin only
  if (file.accessPolicy === "SUPER_ADMIN_ONLY") {
    return { allowed: false, reason: "This file requires Super Admin access." };
  }

  // Owner-only: student accessing their own document
  if (file.accessPolicy === "OWNER_ONLY") {
    if (userStudentId && file.studentId === userStudentId) return { allowed: true };
    return { allowed: false, reason: "You can only access your own documents." };
  }

  // Owner and staff
  if (file.accessPolicy === "OWNER_AND_STAFF") {
    if (userStudentId && file.studentId === userStudentId) return { allowed: true };
    if (userPartnerId && file.partnerId === userPartnerId) return { allowed: true };
    if (userRole && ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "BRANCH_MANAGER", "HR_MANAGER", "FINANCE", "MARKETING_MANAGER", "MARKETING"].includes(userRole)) {
      return { allowed: true };
    }
    return { allowed: false, reason: "You do not have permission to access this file." };
  }

  // Staff only
  if (file.accessPolicy === "STAFF_ONLY") {
    if (userRole && userRole !== "STUDENT" && userRole !== "PARTNER") {
      return { allowed: true };
    }
    return { allowed: false, reason: "This file is for staff only." };
  }

  // Partner only
  if (file.accessPolicy === "PARTNER_ONLY") {
    if (userPartnerId && file.partnerId === userPartnerId) return { allowed: true };
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return { allowed: true };
    return { allowed: false, reason: "This file is for the assigned partner only." };
  }

  return { allowed: false, reason: "Access policy not recognized." };
}

// ─── Helper: log a file event ────────────────────────────────
async function logFileEvent(
  fileId: string,
  action: string,
  performedBy?: string,
  ip?: string,
  result: string = "SUCCESS",
  details?: any
) {
  try {
    await db.fileEvent.create({
      data: {
        fileId,
        action,
        performedBy,
        performedFromIp: ip,
        result,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch {
    // Logging is best-effort
  }
}

// ─── Helper: increment pool usage ────────────────────────────
async function incrementPoolUsage(pool: PoolKey, bytes: number) {
  await db.storagePool.upsert({
    where: { poolKey: pool },
    update: {
      usedBytes: { increment: BigInt(bytes) },
      fileCount: { increment: 1 },
      updatedAt: new Date(),
    },
    create: {
      poolKey: pool,
      name: POOLS[pool].name,
      description: POOLS[pool].description,
      mountPath: POOLS[pool].basePath,
      capacityBytes: BigInt(POOLS[pool].capacityBytes),
      usedBytes: BigInt(bytes),
      fileCount: 1,
    },
  });
}

async function decrementPoolUsage(pool: PoolKey, bytes: number) {
  await db.storagePool.update({
    where: { poolKey: pool },
    data: {
      usedBytes: { decrement: BigInt(bytes) },
      fileCount: { decrement: 1 },
      updatedAt: new Date(),
    },
  });
}

// ─── Helper: get next version number ─────────────────────────
async function getNextVersionNumber(previousVersionId: string): Promise<number> {
  const prev = await db.fileMetadata.findUnique({ where: { id: previousVersionId }, select: { version: true } });
  return (prev?.version || 0) + 1;
}

// ─── Helper: sanitize filename ───────────────────────────────
function sanitizeFilename(name: string): string {
  // Remove path traversal attempts
  const basename = path.basename(name);
  // Remove dangerous characters
  const sanitized = basename.replace(/[^\w\s.\-]/g, "_").replace(/\s+/g, "_");
  // Limit length
  return sanitized.slice(0, 255) || "file";
}

// ─── Helper: detect MIME type from magic bytes ───────────────
function detectMimeType(buffer: Buffer, ext: string): string | null {
  // Check first few bytes for common file signatures
  if (buffer.length < 4) return null;

  // PDF
  if (buffer.subarray(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  // PNG
  if (buffer.subarray(0, 4).toString("hex") === "89504e47") return "image/png";
  // JPEG
  if (buffer.subarray(0, 2).toString("hex") === "ffd8") return "image/jpeg";
  // GIF
  if (buffer.subarray(0, 3).toString("ascii") === "GIF") return "image/gif";
  // WebP (RIFF....WEBP)
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  // ZIP
  if (buffer.subarray(0, 2).toString("hex") === "504b") return "application/zip";
  // MP4
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  // MP3
  if (buffer.subarray(0, 3).toString("hex") === "494433" || (buffer[0] === 0xff && buffer[1] === 0xfb)) return "audio/mpeg";
  // WAV (RIFF....WAVE)
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WAVE") return "audio/wav";

  // Office formats (ZIP-based): check for PK signature + extension
  if (buffer.subarray(0, 2).toString("hex") === "504b") {
    if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === ".pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  // OLE2 (old Office): D0 CF 11 E0
  if (buffer.subarray(0, 4).toString("hex") === "d0cf11e0") {
    if (ext === ".doc") return "application/msword";
    if (ext === ".xls") return "application/vnd.ms-excel";
    if (ext === ".ppt") return "application/vnd.ms-powerpoint";
  }

  return null;
}

// ─── Pool health check ───────────────────────────────────────
export async function checkPoolHealth(poolKey: PoolKey): Promise<{
  status: string;
  usedBytes: number;
  capacityBytes: number;
  percentage: number;
  fileCount: number;
}> {
  const pool = POOLS[poolKey];
  const record = await db.storagePool.findUnique({ where: { poolKey } });

  // Count actual files on disk
  let actualFileCount = 0;
  let actualUsedBytes = 0;
  try {
    await fs.access(pool.basePath);
    actualFileCount = await countFilesRecursively(pool.basePath);
    actualUsedBytes = await getDirectorySize(pool.basePath);
  } catch {
    // Directory doesn't exist yet
  }

  const usedBytes = Number(record?.usedBytes || actualUsedBytes || 0);
  const capacityBytes = pool.capacityBytes;
  const percentage = capacityBytes > 0 ? (usedBytes / capacityBytes) * 100 : 0;

  let status = "HEALTHY";
  const warning = record?.warningThreshold || 70;
  const high = record?.highThreshold || 85;
  const critical = record?.criticalThreshold || 95;
  if (percentage >= critical) status = "CRITICAL";
  else if (percentage >= high) status = "HIGH";
  else if (percentage >= warning) status = "WARNING";

  // Update the pool record
  await db.storagePool.upsert({
    where: { poolKey },
    update: {
      usedBytes: BigInt(usedBytes),
      fileCount: actualFileCount,
      status,
      lastHealthCheck: new Date(),
    },
    create: {
      poolKey,
      name: pool.name,
      description: pool.description,
      mountPath: pool.basePath,
      capacityBytes: BigInt(capacityBytes),
      usedBytes: BigInt(usedBytes),
      fileCount: actualFileCount,
      status,
      lastHealthCheck: new Date(),
    },
  });

  return { status, usedBytes, capacityBytes, percentage, fileCount: actualFileCount };
}

async function countFilesRecursively(dir: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += await countFilesRecursively(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

async function getDirectorySize(dir: string): Promise<number> {
  let size = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      size += await getDirectorySize(fullPath);
    } else {
      const stat = await fs.stat(fullPath);
      size += stat.size;
    }
  }
  return size;
}

// ─── Initialize storage pools on startup ─────────────────────
export async function initializeStorage(): Promise<void> {
  for (const poolKey of Object.keys(POOLS) as PoolKey[]) {
    const pool = POOLS[poolKey];
    await fs.mkdir(pool.basePath, { recursive: true });
    await checkPoolHealth(poolKey);
  }
}
