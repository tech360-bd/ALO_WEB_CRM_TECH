'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Search, Filter, RefreshCw, Eye, Check, X,
  AlertTriangle, FileText, Download, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function DocumentReviewPage() {
  const token = usePortalStore(state => state.token);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/documents/verification-queue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.documents || json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Application Document Review Queue</h1>
              <p className="text-gray-400 text-sm">Passports, Academic Transcripts, English Tests, SOPs & Financial Evidence</p>
            </div>
          </div>
        </div>

        <Button onClick={fetchDocuments} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Pending Verification Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">Student / App</th>
                  <th className="p-3 font-medium">Document Category</th>
                  <th className="p-3 font-medium">File Name</th>
                  <th className="p-3 font-medium">Uploaded Date</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      All application documents have been reviewed. Queue is clear.
                    </td>
                  </tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-white">{doc.student?.name || doc.studentId}</td>
                      <td className="p-3 text-xs text-blue-400">{doc.category}</td>
                      <td className="p-3 text-gray-300 text-xs">{doc.fileName || 'file.pdf'}</td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                          {doc.status || 'UNDER REVIEW'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
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
