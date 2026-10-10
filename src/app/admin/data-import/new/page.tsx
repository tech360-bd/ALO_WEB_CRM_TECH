'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function NewDataImportRoute() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV or XLSX file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchName', `Batch-${file.name}`);

      const res = await fetch('/api/admin/data-import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Structured CSV / XLSX Data Import</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload 01_universities.csv, 02_courses.csv, or master workbook for automated server-side validation and transactional staging.
        </p>
      </div>

      <Card className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-white text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Select CSV or XLSX File</h3>
          <p className="text-xs text-slate-500 mt-1">Supports templates up to 20MB</p>
        </div>

        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 max-w-xs mx-auto"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs rounded-xl px-5 flex items-center gap-2 mx-auto"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Processing File...' : 'Upload & Validate File'}
        </Button>
      </Card>

      {result && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Import Staged Successfully
            </h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs rounded-full">
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Batch ID</span>
              <p className="font-bold text-slate-800 mt-0.5">{result.batchId}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">File Name</span>
              <p className="font-bold text-slate-800 mt-0.5">{result.fileName}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Staged Rows</span>
              <p className="font-bold text-emerald-600 mt-0.5">{result.stagedRows}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Errors</span>
              <p className="font-bold text-slate-600 mt-0.5">{result.errorsEncountered}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-xs">Mapped Header Dictionary:</h4>
            <div className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto">
              {result.mappedHeaders?.join(' | ')}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link href="/admin/change-approval">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl">
                Open Approval Queue
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
