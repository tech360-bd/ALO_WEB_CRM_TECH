'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, Clock, FileText, Lock, Paperclip, Upload, XCircle } from 'lucide-react';

interface DocumentVersion {
  id: string;
  version: number;
  status: 'uploaded' | 'under_review' | 'rejected' | 'verified' | 'superseded';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  fileUrl?: string;
  fileName?: string;
}

interface DocumentSlot {
  id: string;
  slotName: string;         // e.g. "Bank Statement"
  requirement: string;
  status: 'required' | 'partial' | 'verified' | 'rejected';
  versions: DocumentVersion[];
}

interface DocumentVersionTimelineProps {
  slot: DocumentSlot;
  viewerRole?: string;     // 'student' | 'counselor' | 'admin'
  onUploadReplacement?: (slotId: string) => void;
  onReject?: (versionId: string, reason: string) => void;
}

const versionStatusConfig: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  uploaded: {
    label: 'Uploaded',
    classes: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    icon: <Clock className="w-3 h-3" />,
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border',
    icon: <Clock className="w-3 h-3" />,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border',
    icon: <XCircle className="w-3 h-3" />,
  },
  verified: {
    label: 'Verified',
    classes: 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  superseded: {
    label: 'Superseded',
    classes: 'bg-[var(--alo-page)] text-[var(--alo-text-muted)] border-[var(--alo-border)]',
    icon: <ChevronRight className="w-3 h-3" />,
  },
};

export default function DocumentVersionTimeline({
  slot,
  viewerRole = 'counselor',
  onUploadReplacement,
  onReject,
}: DocumentVersionTimelineProps) {
  const [showRejectModal, setShowRejectModal] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [customNote, setCustomNote] = React.useState('');

  const latestVersion = slot.versions[slot.versions.length - 1];
  const canUploadReplacement =
    viewerRole === 'student' && latestVersion?.status === 'rejected';
  const canReject =
    viewerRole !== 'student' &&
    latestVersion?.status !== 'verified' &&
    latestVersion?.status !== 'superseded';

  const REJECTION_REASONS = [
    'blurry',
    'incomplete',
    'wrong document',
    'expired',
    'wrong student',
    'wrong format',
    'missing page',
    'inconsistent information',
    'university-specific requirement not met',
  ];

  const handleConfirmReject = () => {
    if (!rejectReason && !customNote) return;
    const fullReason = customNote ? `${rejectReason}: ${customNote}` : rejectReason;
    onReject?.(showRejectModal!, fullReason);
    setShowRejectModal(null);
    setRejectReason('');
    setCustomNote('');
  };

  return (
    <div className="space-y-3">
      {/* Document Slot Header */}
      <div className="flex items-center justify-between p-3 bg-white border border-[var(--alo-border)] rounded-xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--alo-brand)]" />
          <div>
            <p className="font-bold text-sm text-[var(--alo-text)]">{slot.slotName}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)]">{slot.requirement}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[11px] font-bold border ${
              slot.status === 'verified'
                ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border'
                : slot.status === 'rejected'
                ? 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border'
                : slot.status === 'partial'
                ? 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border'
                : 'bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border-strong)]'
            }`}
          >
            {slot.status.toUpperCase()}
          </Badge>
          {viewerRole === 'student' && slot.status === 'verified' && (
            <Lock className="w-3.5 h-3.5 text-crm-success-text" />
          )}
        </div>
      </div>

      {/* Version Timeline */}
      <div className="relative ml-4 space-y-2">
        {slot.versions.map((ver, idx) => {
          const cfg = versionStatusConfig[ver.status] || versionStatusConfig.uploaded;
          const isLatest = idx === slot.versions.length - 1;

          return (
            <div key={ver.id} className="relative flex gap-3">
              {/* Vertical line */}
              {idx < slot.versions.length - 1 && (
                <div className="absolute left-3.5 top-7 bottom-0 w-px bg-[var(--alo-page)]" />
              )}

              {/* Version dot */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-2 ${
                ver.status === 'verified'
                  ? 'bg-crm-success-bg border-[var(--alo-success)] text-crm-success-text'
                  : ver.status === 'rejected'
                  ? 'bg-crm-danger-bg border-crm-danger-border text-crm-danger-text'
                  : 'bg-[var(--alo-surface-muted)] border-[var(--alo-border-strong)] text-[var(--alo-body)]'
              }`}>
                V{ver.version}
              </div>

              {/* Version card */}
              <div className={`flex-1 p-3 rounded-xl border text-xs mb-1 ${cfg.classes}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {cfg.icon}
                    <span className="font-bold">{cfg.label}</span>
                    {isLatest && <Badge className="bg-white text-[var(--alo-body)] text-[11px] border border-[var(--alo-border-strong)] px-1.5">LATEST</Badge>}
                  </div>
                  <span className="text-[11px] opacity-70">{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                </div>

                {ver.fileName && (
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] opacity-80"><Paperclip className="size-3 shrink-0" />{ver.fileName}</p>
                )}

                {ver.status === 'rejected' && ver.rejectionReason && (
                  <div className="mt-2 p-2 bg-crm-danger-bg border border-crm-danger-border rounded-lg">
                    <p className="font-bold text-crm-danger-text text-[11px] uppercase tracking-wide mb-0.5">Rejection Reason:</p>
                    <p className="text-crm-danger-text text-[11px]">{ver.rejectionReason}</p>
                  </div>
                )}

                {ver.status === 'verified' && (
                  <div className="mt-1.5 flex items-center gap-1 text-crm-success-text text-[11px]">
                    <Lock className="w-3 h-3" />
                    <span>Document locked — immutable after verification</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Student: Upload Replacement Button */}
      {canUploadReplacement && (
        <div className="ml-4 p-3 bg-crm-warning-bg border border-crm-warning-border rounded-xl space-y-2">
          <p className="text-xs font-bold text-crm-warning-text">
            DOCUMENT REJECTED — Upload a replacement
          </p>
          <p className="text-[11px] text-crm-warning-text">
            Reason: <strong>{latestVersion?.rejectionReason}</strong>
          </p>
          <Button
            onClick={() => onUploadReplacement?.(slot.id)}
            size="sm"
            className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white text-xs font-bold gap-2"
          >
            <Upload className="w-3.5 h-3.5" /> UPLOAD REPLACEMENT (will create V{(latestVersion?.version || 0) + 1})
          </Button>
          <p className="text-[11px] text-crm-warning-text">Version {latestVersion?.version} will remain in history</p>
        </div>
      )}

      {/* Counselor: Reject Button */}
      {canReject && (
        <div className="ml-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectModal(latestVersion?.id || '')}
            className="text-[11px] text-crm-danger-text border-crm-danger-border hover:bg-crm-danger-bg font-bold gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject (with Reason)
          </Button>
          <p className="text-[11px] text-[var(--alo-text-muted)] self-center">
            Reject ≠ Delete — rejected documents remain in history
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-[var(--alo-navy)]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-sm text-[var(--alo-text)] flex items-center gap-2">
              <XCircle className="w-5 h-5 text-crm-danger-text" /> Reject Document — Reason Required
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--alo-body)]">Select reason *</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 border border-[var(--alo-border)] rounded-lg text-xs"
              >
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--alo-body)]">Additional notes (optional)</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Page 2 is missing from the scan..."
                className="w-full p-2.5 border border-[var(--alo-border)] rounded-lg text-xs resize-none h-20"
              />
            </div>

            <div className="p-3 bg-crm-warning-bg rounded-xl border border-crm-warning-border text-[11px] text-crm-warning-text">
              The rejected document will remain in version history. The student will receive this rejection reason.
            </div>

            <div className="flex gap-3 pt-1">
              <Button
 variant="outline"
 className="flex-1 font-bold"
 onClick={() => setShowRejectModal(null)}
              >
                Cancel
              </Button>
              <Button
 className="flex-1 bg-[var(--alo-error)] hover:bg-[var(--alo-error)] text-white font-bold"
 onClick={handleConfirmReject}
 disabled={!rejectReason}
 >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
