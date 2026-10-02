'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Upload, FileText, ChevronRight, Lock } from 'lucide-react';

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
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock className="w-3 h-3" />,
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-amber-50 text-amber-700 border-amber-300',
    icon: <Clock className="w-3 h-3" />,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-50 text-red-700 border-red-300',
    icon: <XCircle className="w-3 h-3" />,
  },
  verified: {
    label: 'Verified ✓',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  superseded: {
    label: 'Superseded',
    classes: 'bg-slate-50 text-slate-500 border-slate-200',
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
      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0B5ED7]" />
          <div>
            <p className="font-bold text-sm text-slate-900">{slot.slotName}</p>
            <p className="text-[11px] text-slate-500">{slot.requirement}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[10px] font-bold border ${
              slot.status === 'verified'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : slot.status === 'rejected'
                ? 'bg-red-50 text-red-700 border-red-300'
                : slot.status === 'partial'
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-300'
            }`}
          >
            {slot.status.toUpperCase()}
          </Badge>
          {viewerRole === 'student' && slot.status === 'verified' && (
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
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
                <div className="absolute left-3.5 top-7 bottom-0 w-px bg-slate-200" />
              )}

              {/* Version dot */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 ${
                ver.status === 'verified'
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                  : ver.status === 'rejected'
                  ? 'bg-red-100 border-red-400 text-red-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                V{ver.version}
              </div>

              {/* Version card */}
              <div className={`flex-1 p-3 rounded-xl border text-xs mb-1 ${cfg.classes}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {cfg.icon}
                    <span className="font-bold">{cfg.label}</span>
                    {isLatest && <Badge className="bg-white text-slate-600 text-[9px] border border-slate-300 px-1.5">LATEST</Badge>}
                  </div>
                  <span className="text-[10px] opacity-70">{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                </div>

                {ver.fileName && (
                  <p className="font-mono text-[10px] opacity-80 mt-0.5">📎 {ver.fileName}</p>
                )}

                {ver.status === 'rejected' && ver.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-bold text-red-800 text-[10px] uppercase tracking-wide mb-0.5">Rejection Reason:</p>
                    <p className="text-red-700 text-[11px]">{ver.rejectionReason}</p>
                  </div>
                )}

                {ver.status === 'verified' && (
                  <div className="mt-1.5 flex items-center gap-1 text-emerald-700 text-[10px]">
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
        <div className="ml-4 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <p className="text-xs font-bold text-amber-900">
            📄 DOCUMENT REJECTED — Upload a replacement
          </p>
          <p className="text-[11px] text-amber-700">
            Reason: <strong>{latestVersion?.rejectionReason}</strong>
          </p>
          <Button
            onClick={() => onUploadReplacement?.(slot.id)}
            size="sm"
            className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold gap-2"
          >
            <Upload className="w-3.5 h-3.5" /> UPLOAD REPLACEMENT (will create V{(latestVersion?.version || 0) + 1})
          </Button>
          <p className="text-[10px] text-amber-600">Version {latestVersion?.version} will remain in history</p>
        </div>
      )}

      {/* Counselor: Reject Button */}
      {canReject && (
        <div className="ml-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectModal(latestVersion?.id || '')}
            className="text-[11px] text-red-600 border-red-200 hover:bg-red-50 font-bold gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject (with Reason)
          </Button>
          <p className="text-[10px] text-slate-500 self-center">
            Reject ≠ Delete — rejected documents remain in history
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Reject Document — Reason Required
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select reason *</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Additional notes (optional)</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Page 2 is missing from the scan..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs resize-none h-20"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              ⚠️ The rejected document will remain in version history. The student will receive this rejection reason.
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold"
                onClick={() => setShowRejectModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
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
