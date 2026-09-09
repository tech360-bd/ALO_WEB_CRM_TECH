'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export default function DataConflictsRoute() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Data Conflict Resolution Center</h1>
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl text-xs space-y-2">
        <p className="font-semibold text-slate-700">Probable Duplicates & Conflicting Data Claims</p>
        <p className="text-slate-500">No conflicting data records are published automatically without Super Admin decision.</p>
      </Card>
    </div>
  );
}
