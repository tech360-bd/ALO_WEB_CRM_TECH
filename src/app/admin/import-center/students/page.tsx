'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  ArrowRight, Shield, Play, RotateCcw, Search, Eye, Users, ChevronRight,
  Database, GitMerge, FileSpreadsheet, Download, Check, X, Loader2
} from 'lucide-react';

interface Batch {
  id: string;
  sourceCrmName: string;
  fileName: string;
  totalRows: number;
  newCount: number;
  matchedCount: number;
  duplicateCount: number;
  errorCount: number;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface StagedStudent {
  id: string;
  studentName: string;
  phone: string;
  whatsapp: string;
  email: string;
  passportNumber: string;
  countryInterest: string;
  courseInterest: string;
  universityInterest: string;
  duplicateRiskLevel: string;
  matchedStudentId: string;
  status: string;
}

export default function StudentMigrationCenter() {
  const token = usePortalStore(state => state.token);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [stagedStudents, setStagedStudents] = useState<StagedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sourceCrmName, setSourceCrmName] = useState('Old CRM');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'upload' | 'batches' | 'preview' | 'merge'>('batches');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/import/batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const rows: any[] = [];
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cells[idx] || '';
          });
          rows.push({
            studentName: rowObj['Student Name'] || rowObj['Name'] || rowObj['studentName'] || `Student ${i}`,
            phone: rowObj['Phone'] || rowObj['Mobile'] || rowObj['phone'] || '',
            whatsapp: rowObj['WhatsApp'] || rowObj['whatsapp'] || '',
            email: rowObj['Email'] || rowObj['email'] || '',
            passportNumber: rowObj['Passport'] || rowObj['passportNumber'] || '',
            countryInterest: rowObj['Country'] || rowObj['countryInterest'] || 'UK',
            courseInterest: rowObj['Course'] || rowObj['courseInterest'] || '',
            universityInterest: rowObj['University'] || rowObj['universityInterest'] || '',
            applicationStatus: rowObj['Status'] || 'new',
            counselorName: rowObj['Counselor'] || '',
          });
        }
      }

      const res = await fetch('/api/admin/import/student-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceCrmName,
          fileName: file.name,
          students: rows,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Batch uploaded and staged! ${json.totalRows} rows analyzed.` });
        setFile(null);
        fetchBatches();
        setActiveTab('batches');
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to upload batch' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'File processing error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    setActiveTab('preview');
    try {
      const res = await fetch(`/api/admin/import/batches/${batch.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStagedStudents(data.batch?.students || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveBatch = async (batchId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/import/batches/${batchId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Batch approved by Super Admin!' });
        fetchBatches();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteBatch = async (batchId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/import/batches/${batchId}/execute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Import complete! ${data.importedCount} live student records created/updated with AE-YYYY IDs.` });
        fetchBatches();
      } else {
        setMessage({ type: 'error', text: data.error || 'Execution failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleRollbackBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to rollback this import batch?')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/import/batches/${batchId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Batch successfully rolled back!' });
        fetchBatches();
      } else {
        setMessage({ type: 'error', text: data.error || 'Rollback failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B5ED7] to-[#F97316] flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Old CRM Student Migration Center</h1>
              <p className="text-gray-400 text-sm">Super Admin Data Ingestion, Deduplication, Staging & Approval Engine</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => { setActiveTab('upload'); setMessage(null); }}
            className="bg-[#0B5ED7] hover:bg-[#0046a0] text-white flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>New Import</span>
          </Button>
          <Button
            onClick={() => { fetchBatches(); }}
            variant="outline"
            className="border-white/10 text-gray-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'batches' ? 'border-[#0B5ED7] text-white' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Import Batches ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'upload' ? 'border-[#0B5ED7] text-white' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Upload & Map
        </button>
        {selectedBatch && (
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'preview' ? 'border-[#0B5ED7] text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Batch Preview: {selectedBatch.fileName || selectedBatch.id}
          </button>
        )}
      </div>

      {/* TAB 1: Batches List */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Total Import Batches</p>
                <p className="text-2xl font-bold mt-1">{batches.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Total Rows Staged</p>
                <p className="text-2xl font-bold mt-1 text-blue-400">
                  {batches.reduce((acc, b) => acc + (b.totalRows || 0), 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Duplicate Candidates</p>
                <p className="text-2xl font-bold mt-1 text-amber-400">
                  {batches.reduce((acc, b) => acc + (b.duplicateCount || 0), 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Completed Imports</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">
                  {batches.filter(b => b.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0d1526] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Staging & Import History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                      <th className="p-3 font-medium">Batch ID</th>
                      <th className="p-3 font-medium">Source CRM</th>
                      <th className="p-3 font-medium">File Name</th>
                      <th className="p-3 font-medium">Rows</th>
                      <th className="p-3 font-medium">New</th>
                      <th className="p-3 font-medium">Duplicates</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Created</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">
                          No import batches found. Click &quot;New Import&quot; to upload student records from old CRM.
                        </td>
                      </tr>
                    ) : (
                      batches.map(b => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono text-xs text-blue-400">{b.id}</td>
                          <td className="p-3">{b.sourceCrmName}</td>
                          <td className="p-3 text-gray-300">{b.fileName || 'data.csv'}</td>
                          <td className="p-3 font-semibold">{b.totalRows}</td>
                          <td className="p-3 text-emerald-400">{b.newCount}</td>
                          <td className="p-3 text-amber-400">{b.duplicateCount}</td>
                          <td className="p-3">
                            <Badge className={
                              b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              b.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              b.status === 'ready_for_review' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }>
                              {b.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-400 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSelectBatch(b)}
                                className="text-gray-300 hover:text-white"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Inspect
                              </Button>
                              {b.status === 'ready_for_review' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveBatch(b.id)}
                                  disabled={processing}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {b.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleExecuteBatch(b.id)}
                                  disabled={processing}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Play className="w-3.5 h-3.5 mr-1" />
                                  Execute Live
                                </Button>
                              )}
                              {b.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRollbackBatch(b.id)}
                                  disabled={processing}
                                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  Rollback
                                </Button>
                              )}
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
      )}

      {/* TAB 2: Upload & Map */}
      {activeTab === 'upload' && (
        <Card className="bg-[#0d1526] border-white/10 text-white max-w-2xl mx-auto">
          <CardHeader className="p-6 border-b border-white/10">
            <CardTitle className="text-lg font-bold">Upload Old CRM Student Export</CardTitle>
            <p className="text-xs text-gray-400">Upload CSV/XLSX file. The system will stage, validate, and compute duplicate scores before committing to live database.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Source CRM Name</label>
                <Input
                  value={sourceCrmName}
                  onChange={e => setSourceCrmName(e.target.value)}
                  placeholder="e.g. Zoho, HubSpot, Legacy Excel"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Select CSV or Excel File</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#0B5ED7] transition-colors cursor-pointer bg-white/5">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileSpreadsheet className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    {file ? (
                      <div>
                        <p className="font-semibold text-white">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-300">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-500 mt-1">CSV or XLSX up to 20MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 space-y-1">
                <p className="font-semibold text-blue-200">Automated Pipeline Safeguards:</p>
                <p>1. Data is placed into staging table first — never touches live database immediately.</p>
                <p>2. Duplicate detector matches against phone, email, WhatsApp, and passport.</p>
                <p>3. Super Admin approval is required before live AE-YYYY student code assignment.</p>
              </div>

              <Button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-[#0B5ED7] hover:bg-[#0046a0] text-white py-3"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Staging & Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" /> Stage Batch for Review
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Batch Preview */}
      {activeTab === 'preview' && selectedBatch && (
        <div className="space-y-6">
          <Card className="bg-[#0d1526] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-400 text-blue-400">{selectedBatch.id}</Badge>
                  <h2 className="text-lg font-bold">{selectedBatch.fileName || 'Batch Inspection'}</h2>
                </div>
                <p className="text-xs text-gray-400 mt-1">Source: {selectedBatch.sourceCrmName} | Uploaded: {new Date(selectedBatch.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3">
                {selectedBatch.status === 'ready_for_review' && (
                  <Button
                    onClick={() => handleApproveBatch(selectedBatch.id)}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Approve Batch
                  </Button>
                )}
                {selectedBatch.status === 'approved' && (
                  <Button
                    onClick={() => handleExecuteBatch(selectedBatch.id)}
                    disabled={processing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-1.5" /> Execute Live Import
                  </Button>
                )}
                {selectedBatch.status === 'completed' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleRollbackBatch(selectedBatch.id)}
                    disabled={processing}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Rollback All Records
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                      <th className="p-3 font-medium">Student Name</th>
                      <th className="p-3 font-medium">Phone</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Passport</th>
                      <th className="p-3 font-medium">Country</th>
                      <th className="p-3 font-medium">Course / University</th>
                      <th className="p-3 font-medium">Duplicate Risk</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-500">
                          No records loaded for this batch.
                        </td>
                      </tr>
                    ) : (
                      stagedStudents.map(s => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 font-semibold">{s.studentName}</td>
                          <td className="p-3 font-mono text-xs">{s.phone}</td>
                          <td className="p-3 text-gray-300">{s.email}</td>
                          <td className="p-3 font-mono text-xs">{s.passportNumber || 'N/A'}</td>
                          <td className="p-3">{s.countryInterest}</td>
                          <td className="p-3 text-xs text-gray-300">{s.courseInterest} - {s.universityInterest}</td>
                          <td className="p-3">
                            <Badge className={
                              s.duplicateRiskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              s.duplicateRiskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }>
                              {s.duplicateRiskLevel.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-gray-400 border-white/10">
                              {s.status}
                            </Badge>
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
      )}
    </div>
  );
}
