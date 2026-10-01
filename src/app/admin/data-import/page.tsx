'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, History, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DataImportDashboardRoute() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">University & Course Data Import Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload CSV templates, validate schema, normalize degree aliases, and stage changes for Super Admin approval.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/data-import/new">
            <Button className="bg-[#0B5ED7] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> New Multi-CSV Upload
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Total Batches Processed</span>
          <p className="text-2xl font-bold text-slate-900">42</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Pending Approval Items</span>
          <p className="text-2xl font-bold text-amber-600">8</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Auto-Normalized Records</span>
          <p className="text-2xl font-bold text-emerald-600">1,240</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Duplicates Skipped</span>
          <p className="text-2xl font-bold text-slate-600">154</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Standard ALO Education CSV Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            '01_universities.csv',
            '02_courses.csv',
            '03_course_intakes_fees.csv',
            '04_course_requirements.csv',
            '05_rankings.csv',
            '06_sources_verification.csv',
            '07_change_approval_queue.csv',
          ].map((file) => (
            <div key={file} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-slate-800">{file}</span>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7 text-[11px] text-blue-600 hover:text-blue-700">Template</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
