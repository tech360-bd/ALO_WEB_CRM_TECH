'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export default function DataReviewRoute() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Data Review Portal</h1>
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl text-xs space-y-2">
        <p className="font-semibold text-slate-700">Review staged records before publishing to public search.</p>
        <p className="text-slate-500">Only records with verification status <strong>VERIFIED</strong> and publication status <strong>PUBLISHED</strong> are visible to public applicants by default.</p>
      </Card>
    </div>
  );
}
