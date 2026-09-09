'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export default function DataFreshnessRoute() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Data Freshness & Verification Cadence Monitor</h1>
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl text-xs space-y-2">
        <p className="font-semibold text-slate-700">Verification Cadence Rules:</p>
        <ul className="list-disc pl-4 text-slate-600 space-y-1">
          <li>Tuition Fees & Scholarships: Every 30–90 days</li>
          <li>Intakes & Deadlines: Every 7–30 days</li>
          <li>Academic & English Requirements: Every 60–90 days</li>
          <li>Funded Research Opportunities: Weekly</li>
        </ul>
      </Card>
    </div>
  );
}
