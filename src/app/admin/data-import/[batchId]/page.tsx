'use client';

import React, { use } from 'react';
import { Card } from '@/components/ui/card';

export default function BatchDetailRoute({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Batch Summary: {resolvedParams.batchId}</h1>
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
        <p><strong>Processed Rows:</strong> 27</p>
        <p><strong>Auto-Normalized:</strong> 27</p>
        <p><strong>Duplicates Skipped:</strong> 0</p>
        <p><strong>Staged Changes:</strong> 0</p>
        <p><strong>Status:</strong> <span className="font-bold text-emerald-600">COMPLETED & VERIFIED</span></p>
      </Card>
    </div>
  );
}
