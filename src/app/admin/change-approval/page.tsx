'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { ProposedFieldChange, processApprovalDecision } from '@/lib/approval-queue';

export default function ChangeApprovalQueueRoute() {
  const [changes, setChanges] = useState<ProposedFieldChange[]>([
    {
      id: 'CHG-1001',
      entityType: 'Course',
      entityId: 'CRS-0001',
      entityName: 'MSc Data Science & AI (University of Oxford)',
      fieldName: 'tuition_fee',
      currentValue: '$41,000 / year',
      proposedValue: '$42,500 / year',
      sourceUrl: 'https://www.oxford.ac.uk/courses/msc-data-science',
      aiConfidence: 94,
      changeType: 'FEE_CHANGED',
      detectedAt: '2026-07-31 12:00 UTC',
      status: 'PENDING',
    },
  ]);

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT' | 'ROLLBACK') => {
    setChanges(prev =>
      prev.map(c => (c.id === id ? processApprovalDecision(c, action, 'SUPER_ADMIN_USER') : c))
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin Field-Level Change Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review material AI-detected university, fee, deadline, and entry requirement changes before publishing.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {changes.map((c) => (
          <Card key={c.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {c.changeType}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Confidence: {c.aiConfidence}%
                </span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                c.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {c.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{c.entityName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Source URL: <a href={c.sourceUrl} target="_blank" className="text-blue-600 underline">{c.sourceUrl}</a></p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Current Production Value:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{String(c.currentValue)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Proposed AI / Import Value:</span>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">{String(c.proposedValue)}</p>
              </div>
            </div>

            {c.status === 'PENDING' && (
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={() => handleAction(c.id, 'APPROVE')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Approve & Publish
                </Button>
                <Button onClick={() => handleAction(c.id, 'REJECT')} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Reject Change
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
