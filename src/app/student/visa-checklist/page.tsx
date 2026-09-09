'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Shield, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Upload, Eye, Download, Sparkles, RefreshCw, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function StudentVisaChecklistPage() {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('student_session_token');
      const res = await fetch('/api/student-portal/visa', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setChecklist(json.checklist || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-[#E8501A] flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Visa Documents & Compliance Checklist</h1>
              <p className="text-gray-400 text-sm">Official checklist verified by your ALO Visa Interview Officer</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/visa">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
              View Readiness Overview
            </Button>
          </Link>
          <Button onClick={fetchChecklist} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Checklist Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10">
          <CardTitle className="text-base font-semibold">Required Compliance Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">Document Item</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Mandatory</th>
                  <th className="p-3 font-medium">Verification Status</th>
                  <th className="p-3 font-medium">Officer Guidance</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {checklist.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Loading your verified checklist...
                    </td>
                  </tr>
                ) : (
                  checklist.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>{item.item}</span>
                      </td>
                      <td className="p-3 text-xs text-gray-400 capitalize">{item.category}</td>
                      <td className="p-3">
                        {item.isRequired ? (
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">Required</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 text-[10px]">Optional</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={
                          item.status === 'approved' || item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]' :
                          item.status === 'uploaded' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]'
                        }>
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-300 max-w-xs">{item.note || 'Ensure high-resolution scan in PDF format.'}</td>
                      <td className="p-3 text-right">
                        <Link href="/student/documents">
                          <Button size="sm" className="bg-[#0057B8] hover:bg-[#0046a0] text-white text-xs h-7">
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
