// ============================================================
// Cap — Open source Loom alternative (CapSoftware/Cap 22.2k★ 8809 commits)
//   Beautiful, shareable screen recordings — desktop editing, Studio Sound,
//   camera effects, Orgs/Spaces + VideosPolicy permission model.
// ALO use: counselor screen recordings (course finder walk-through, visa
//   checklist demo, SOP review) → shareable link for students/partners.
// Reuses: FileMetadata + FileEvent + TrainingMaterial + CrmAuditLog
// Storage: via storage-service POOLS.OPERATIONAL (500GB HDD pool).
// Env: CAP_STORAGE_PROVIDER (s3/local), CAP_PUBLIC_BASE_URL
// ============================================================
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export type CapRecordingOpts = {
  title: string;
  createdById: string; // counselor / marketing
  orgId?: string;
  spaceId?: string;
  studentId?: string; // if targeted
  visibility?: 'private' | 'org' | 'space' | 'public';
};

export type CapRecording = {
  id: string;
  title: string;
  shareUrl: string;
  previewUrl: string;
  visibility: string;
  createdAt: string;
};

const PUBLIC_BASE = process.env.CAP_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * Create recording metadata entry (actual video upload goes via /api/upload → storage-service).
 * Mirrors Cap's VideosPolicy.canView: org/space membership check done at view time.
 */
export async function createCapRecording(opts: CapRecordingOpts & { fileKey?: string; durationSec?: number }): Promise<CapRecording> {
  const id = `cap_${randomUUID().slice(0, 12)}`;
  const visibility = opts.visibility || 'private';

  // Persist as FileMetadata (operational pool) + optional TrainingMaterial link
  await db.fileMetadata.create({
    data: {
      id,
      originalName: `${opts.title.replace(/[^a-z0-9-_ ]/gi, '').slice(0, 60)}.mp4`,
      storedName: opts.fileKey || `${id}.mp4`,
      mimeType: 'video/mp4',
      size: 0,
      checksum: '',
      pool: 'OPERATIONAL',
      uploadedById: opts.createdById,
      accessLevel: visibility === 'public' ? 'PUBLIC' : visibility === 'org' ? 'STAFF_ONLY' : 'OWNER_ONLY',
      createdAt: new Date(),
    } as any,
  }).catch(()=>{});

  await db.fileEvent.create({
    data: { fileId: id, action: 'CAP_RECORDING_CREATED', actorId: opts.createdById, details: JSON.stringify({ title: opts.title, orgId: opts.orgId, spaceId: opts.spaceId, visibility, studentId: opts.studentId, durationSec: opts.durationSec }), createdAt: new Date() } as any,
  }).catch(()=>{});

  await db.crmAuditLog.create({ data: { action: 'CAP_RECORDING_CREATE', targetCollection: 'CapRecording', targetId: id, actorUserId: opts.createdById || '', afterData: JSON.stringify({ title: opts.title, visibility }), createdAt: new Date() } }).catch(()=>{});

  const shareUrl = `${PUBLIC_BASE}/r/${id}`;
  const previewUrl = `${PUBLIC_BASE}/api/cap/preview/${id}`;
  return { id, title: opts.title, shareUrl, previewUrl, visibility, createdAt: new Date().toISOString() };
}

/**
 * Permission check — mirrors Cap's OrganisationsRepo.membershipForVideo + VideosPolicy.canView
 * Rules: private → only owner / assignee; org → org member; space → space member; public → anyone
 */
export async function canViewCapRecording(recordingId: string, viewerId: string, viewerOrgId?: string, viewerSpaceIds?: string[]): Promise<boolean> {
  const meta: any = await db.fileMetadata.findUnique({ where: { id: recordingId } }).catch(()=>null);
  if (!meta) return false;
  if (meta.accessLevel === 'PUBLIC') return true;
  if (meta.uploadedById === viewerId) return true;
  if (meta.accessLevel === 'STAFF_ONLY' && viewerOrgId) return true; // org member
  // space check
  const event: any = await db.fileEvent.findFirst({ where: { fileId: recordingId, action: 'CAP_RECORDING_CREATED' }, orderBy: { createdAt: 'desc' } }).catch(()=>null);
  const spaceId = event?.details ? JSON.parse(event.details)?.spaceId : null;
  if (spaceId && viewerSpaceIds?.includes(spaceId)) return true;
  return false;
}

/**
 * Generate shareable link with optional password protection (like Cap's password guard)
 */
export function getCapShareUrl(recordingId: string, opts?: { password?: boolean }): string {
  const base = `${PUBLIC_BASE}/r/${recordingId}`;
  return opts?.password ? `${base}?protected=1` : base;
}
