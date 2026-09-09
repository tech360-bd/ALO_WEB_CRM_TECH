'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export default function ImportHistoryRoute() {
  const history = [
    { id: 'BATCH-001', file: '01_universities.csv', user: 'Super Admin', records: 27, status: 'COMPLETED', date: '2026-07-31' },
    { id: 'BATCH-002', file: '02_courses.csv', user: 'Super Admin', records: 26, status: 'COMPLETED', date: '2026-07-31' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Import Batch History</h1>
      <Card className="p-4 bg-white border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 pb-2">
              <th className="p-2">Batch ID</th>
              <th className="p-2">Filename</th>
              <th className="p-2">Uploaded By</th>
              <th className="p-2">Records</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b border-slate-100">
                <td className="p-2 font-mono text-blue-600">{h.id}</td>
                <td className="p-2 font-semibold text-slate-800">{h.file}</td>
                <td className="p-2 text-slate-600">{h.user}</td>
                <td className="p-2 text-slate-600">{h.records}</td>
                <td className="p-2 font-bold text-emerald-600">{h.status}</td>
                <td className="p-2 text-slate-500">{h.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
