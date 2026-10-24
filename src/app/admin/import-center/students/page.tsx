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
  rowNumber: number;
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

type MergeDecision = 'KEEP_EXISTING' | 'USE_IMPORTED' | 'SKIP';
type MergeField = 'studentName' | 'email' | 'phone' | 'countryInterest';
type ExistingStudentSummary = { id: string; studentId: string; name: string; email: string; phone: string; currentCountry: string };

const MERGE_FIELDS: Array<{ key: MergeField; label: string; existingValue: (student: ExistingStudentSummary) => string }> = [
  { key: 'studentName', label: 'Student name', existingValue: (student) => student.name },
  { key: 'email', label: 'Email', existingValue: (student) => student.email },
  { key: 'phone', label: 'Phone', existingValue: (student) => student.phone },
  { key: 'countryInterest', label: 'Current country', existingValue: (student) => student.currentCountry },
];

export default function StudentMigrationCenter() {
  const token = usePortalStore(state => state.token);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [stagedStudents, setStagedStudents] = useState<StagedStudent[]>([]);
  const [existingByStagedId, setExistingByStagedId] = useState<Record<string, ExistingStudentSummary | null>>({});
  const [mergeTarget, setMergeTarget] = useState<StagedStudent | null>(null);
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, Partial<Record<MergeField, MergeDecision>>>>({});
  const [batchPage, setBatchPage] = useState(1);
  const [batchTotal, setBatchTotal] = useState(0);
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
      const formData = new FormData();
      formData.append('sourceCrmName', sourceCrmName.trim());
      formData.append('file', file);
      const res = await fetch('/api/admin/import/student-batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: `Batch uploaded and staged for review. ${json.totalRows} rows analyzed.` });
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

  const handleSelectBatch = async (batch: Batch, page = 1) => {
    setSelectedBatch(batch);
    setBatchPage(page);
    setMergeTarget(null);
    setActiveTab('preview');
    try {
      const res = await fetch(`/api/admin/import/batches/${batch.id}?page=${page}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Batch preview could not be loaded.' });
        return;
      }
      setStagedStudents(data.batch?.students || []);
      setExistingByStagedId(data.existingByStagedId || {});
      setBatchTotal(data.pagination?.totalStudents || 0);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Batch preview or duplicate details could not be loaded.' });
    }
  };

  const startMergeReview = (staged: StagedStudent) => {
    setMergeTarget(staged);
    setMergeDecisions((current) => ({
      ...current,
      [staged.id]: current[staged.id] || Object.fromEntries(MERGE_FIELDS.map(({ key }) => [key, 'KEEP_EXISTING'])) as Record<MergeField, MergeDecision>,
    }));
  };

  const handleSaveMergeDecision = async () => {
    if (!mergeTarget || !mergeTarget.matchedStudentId) return;
    if (!selectedBatch || selectedBatch.status !== 'ready_for_review') {
      setMessage({ type: 'error', text: 'Merge decisions can only be saved before batch approval.' });
      return;
    }
    const decisions = mergeDecisions[mergeTarget.id];
    if (!decisions || MERGE_FIELDS.some(({ key }) => !decisions[key])) {
      setMessage({ type: 'error', text: 'Choose a merge decision for every supported field.' });
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/import/merge', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagedId: mergeTarget.id, matchedStudentId: mergeTarget.matchedStudentId, decisions }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Merge decisions could not be saved.' });
        return;
      }
      setMessage({ type: 'success', text: 'Field decisions saved. Existing student data changes only after Super Admin approval and batch execution.' });
      setMergeTarget(null);
      if (selectedBatch) await handleSelectBatch(selectedBatch, batchPage);
      fetchBatches();
    } catch {
      setMessage({ type: 'error', text: 'Merge decisions could not be saved.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveBatch = async (batchId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/import/batches/${batchId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Batch approved by Super Admin.' });
        fetchBatches();
        if (selectedBatch?.id === batchId) setSelectedBatch({ ...selectedBatch, status: 'approved' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Batch approval failed.' });
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
      if (res.ok && data.success) {
        setMessage({ type: data.errorCount || data.skippedCount ? 'error' : 'success', text: `Import processed: ${data.importedCount} new, ${data.mergedCount} explicitly merged, ${data.skippedCount} skipped, ${data.errorCount} errors. Legacy document references require secure re-upload; no portal links were sent.` });
        if (selectedBatch?.id === batchId) setSelectedBatch({ ...selectedBatch, status: data.status });
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
    if (!confirm('Request Super Admin rollback review? No imported records will be deleted.')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/import/batches/${batchId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Rollback review requested. Existing student/history records were preserved.' });
        fetchBatches();
      } else {
        setMessage({ type: 'error', text: data.error || 'Rollback review request failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-text)] min-h-screen text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-cta)] flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Old CRM Student Migration Center</h1>
              <p className="text-[var(--alo-text-muted)] text-sm">Super Admin Data Ingestion, Deduplication, Staging & Approval Engine</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => { setActiveTab('upload'); setMessage(null); }}
            className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>New Import</span>
          </Button>
          <Button
            onClick={() => { fetchBatches(); }}
            variant="outline"
            className="border-white/10 text-[var(--alo-placeholder)] hover:text-white"
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
            activeTab === 'batches' ? 'border-[var(--alo-brand)] text-white' : 'border-transparent text-[var(--alo-text-muted)] hover:text-white'
          }`}
        >
          Import Batches ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'upload' ? 'border-[var(--alo-brand)] text-white' : 'border-transparent text-[var(--alo-text-muted)] hover:text-white'
          }`}
        >
          Upload & Map
        </button>
        {selectedBatch && (
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'preview' ? 'border-[var(--alo-brand)] text-white' : 'border-transparent text-[var(--alo-text-muted)] hover:text-white'
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
            <Card className="bg-[var(--alo-text)] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--alo-text-muted)]">Total Import Batches</p>
                <p className="text-2xl font-bold mt-1">{batches.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--alo-text)] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--alo-text-muted)]">Total Rows Staged</p>
                <p className="text-2xl font-bold mt-1 text-blue-400">
                  {batches.reduce((acc, b) => acc + (b.totalRows || 0), 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--alo-text)] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--alo-text-muted)]">Duplicate Candidates</p>
                <p className="text-2xl font-bold mt-1 text-amber-400">
                  {batches.reduce((acc, b) => acc + (b.duplicateCount || 0), 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--alo-text)] border-white/10 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--alo-text-muted)]">Completed Imports</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">
                  {batches.filter(b => b.status === 'completed' || b.status === 'completed_with_errors').length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[var(--alo-text)] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Staging & Import History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[var(--alo-text-muted)] bg-white/5">
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
                        <td colSpan={9} className="p-8 text-center text-[var(--alo-text-muted)]">
                          No import batches found. Click &quot;New Import&quot; to upload student records from old CRM.
                        </td>
                      </tr>
                    ) : (
                      batches.map(b => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono text-xs text-blue-400">{b.id}</td>
                          <td className="p-3">{b.sourceCrmName}</td>
                          <td className="p-3 text-[var(--alo-placeholder)]">{b.fileName || 'data.csv'}</td>
                          <td className="p-3 font-semibold">{b.totalRows}</td>
                          <td className="p-3 text-emerald-400">{b.newCount}</td>
                          <td className="p-3 text-amber-400">{b.duplicateCount}</td>
                          <td className="p-3">
                            <Badge className={
                              b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              b.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border-[var(--alo-brand)]/30' :
                              b.status === 'ready_for_review' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-gray-500/20 text-[var(--alo-text-muted)] border-gray-500/30'
                            }>
                              {b.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-[var(--alo-text-muted)] text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSelectBatch(b)}
                                className="text-[var(--alo-placeholder)] hover:text-white"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Inspect
                              </Button>
                              {b.status === 'ready_for_review' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveBatch(b.id)}
                                  disabled={processing}
                                  className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white"
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
                              {(b.status === 'completed' || b.status === 'completed_with_errors') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRollbackBatch(b.id)}
                                  disabled={processing}
                                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  Request review
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
        <Card className="bg-[var(--alo-text)] border-white/10 text-white max-w-2xl mx-auto">
          <CardHeader className="p-6 border-b border-white/10">
            <CardTitle className="text-lg font-bold">Upload Old CRM Student Export</CardTitle>
            <p className="text-xs text-[var(--alo-text-muted)]">Upload CSV/XLSX file. The system will stage, validate, and compute duplicate scores before committing to live database.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-[var(--alo-placeholder)] mb-2">Source CRM Name</label>
                <Input
                  value={sourceCrmName}
                  onChange={e => setSourceCrmName(e.target.value)}
                  placeholder="e.g. Zoho, HubSpot, Legacy Excel"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--alo-placeholder)] mb-2">Select CSV or Excel File</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[var(--alo-brand)] transition-colors cursor-pointer bg-white/5">
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
                        <p className="text-xs text-[var(--alo-text-muted)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-[var(--alo-placeholder)]">Click to upload or drag & drop</p>
                        <p className="text-xs text-[var(--alo-text-muted)] mt-1">CSV or XLSX up to 20MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-[var(--alo-brand)]/20 rounded-xl p-4 text-xs text-blue-300 space-y-1">
                <p className="font-semibold text-[var(--alo-brand-pale)]">Automated Pipeline Safeguards:</p>
                <p>1. Data is placed into staging table first — never touches live database immediately.</p>
                <p>2. Duplicate detector matches against phone, email, WhatsApp, and passport.</p>
                <p>3. Super Admin approval is required before live AE-YYYY student code assignment.</p>
              </div>

              <Button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white py-3"
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
          <Card className="bg-[var(--alo-text)] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-400 text-blue-400">{selectedBatch.id}</Badge>
                  <h2 className="text-lg font-bold">{selectedBatch.fileName || 'Batch Inspection'}</h2>
                </div>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1">Source: {selectedBatch.sourceCrmName} | Uploaded: {new Date(selectedBatch.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3">
                {selectedBatch.status === 'ready_for_review' && (
                  <Button
                    onClick={() => handleApproveBatch(selectedBatch.id)}
                    disabled={processing}
                    className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white"
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
                {(selectedBatch.status === 'completed' || selectedBatch.status === 'completed_with_errors') && (
                  <Button
                    variant="outline"
                    onClick={() => handleRollbackBatch(selectedBatch.id)}
                    disabled={processing}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Request rollback review
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[var(--alo-text-muted)] bg-white/5">
                      <th className="p-3 font-medium">Student Name</th>
                      <th className="p-3 font-medium">Phone</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Passport</th>
                      <th className="p-3 font-medium">Country</th>
                      <th className="p-3 font-medium">Course / University</th>
                      <th className="p-3 font-medium">Duplicate Risk</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Duplicate review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-[var(--alo-text-muted)]">
                          No records loaded for this batch.
                        </td>
                      </tr>
                    ) : (
                      stagedStudents.map(s => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 font-semibold">{s.studentName}</td>
                          <td className="p-3 font-mono text-xs">{s.phone}</td>
                          <td className="p-3 text-[var(--alo-placeholder)]">{s.email}</td>
                          <td className="p-3 font-mono text-xs">{s.passportNumber || 'N/A'}</td>
                          <td className="p-3">{s.countryInterest}</td>
                          <td className="p-3 text-xs text-[var(--alo-placeholder)]">{s.courseInterest} - {s.universityInterest}</td>
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
                            <Badge variant="outline" className="text-[var(--alo-text-muted)] border-white/10">
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {s.status === 'merged' ? (
                              <span className="text-xs text-emerald-400">Decision saved</span>
                            ) : s.status === 'possible_duplicate' && s.matchedStudentId && selectedBatch.status === 'ready_for_review' ? (
                              <Button size="sm" variant="outline" onClick={() => startMergeReview(s)} disabled={processing}>
                                <GitMerge className="mr-1 h-3.5 w-3.5" /> Review match
                              </Button>
                            ) : s.matchedStudentId ? (
                              <span className="text-xs text-[var(--alo-text-muted)]">Matched record identified</span>
                            ) : (
                              <span className="text-xs text-[var(--alo-text-muted)]">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-[var(--alo-text-muted)]">
                <span>Rows {batchTotal ? (batchPage - 1) * 100 + 1 : 0}–{Math.min(batchPage * 100, batchTotal)} of {batchTotal}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={batchPage <= 1 || processing} onClick={() => handleSelectBatch(selectedBatch, batchPage - 1)}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={batchPage * 100 >= batchTotal || processing} onClick={() => handleSelectBatch(selectedBatch, batchPage + 1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {mergeTarget && (
            <Card className="bg-[var(--alo-text)] border-amber-500/30 text-white">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitMerge className="h-4 w-4 text-amber-400" /> Duplicate decision — row {mergeTarget.rowNumber}
                </CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">
                  Choose what happens to each supported field. No student data changes now; decisions are applied only after the batch is approved and executed.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {existingByStagedId[mergeTarget.id] ? (
                  <>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                      Existing ALO record: <span className="font-mono text-blue-300">{existingByStagedId[mergeTarget.id]?.studentId}</span>
                      <span className="ml-2">{existingByStagedId[mergeTarget.id]?.name}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-left text-xs text-[var(--alo-text-muted)]">
                            <th className="p-2">Field</th><th className="p-2">Existing ALO value</th><th className="p-2">Imported value</th><th className="p-2">Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MERGE_FIELDS.map(({ key, label, existingValue }) => (
                            <tr key={key} className="border-b border-white/5">
                              <td className="p-2 font-medium">{label}</td>
                              <td className="max-w-64 break-words p-2 text-[var(--alo-placeholder)]">{existingValue(existingByStagedId[mergeTarget.id]!) || '—'}</td>
                              <td className="max-w-64 break-words p-2">{(mergeTarget as unknown as Record<string, string>)[key] || '—'}</td>
                              <td className="p-2">
                                <select
                                  aria-label={`Decision for ${label}`}
                                  value={mergeDecisions[mergeTarget.id]?.[key] || 'KEEP_EXISTING'}
                                  onChange={(event) => setMergeDecisions((current) => ({
                                    ...current,
                                    [mergeTarget.id]: { ...current[mergeTarget.id], [key]: event.target.value as MergeDecision },
                                  }))}
                                  className="rounded-md border border-white/15 bg-[var(--alo-text)] px-2 py-1.5 text-sm text-white"
                                >
                                  <option value="KEEP_EXISTING">Keep existing</option>
                                  <option value="USE_IMPORTED">Use imported</option>
                                  <option value="SKIP">Skip field</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" onClick={() => setMergeTarget(null)} disabled={processing}>Cancel</Button>
                      <Button onClick={handleSaveMergeDecision} disabled={processing} className="bg-amber-600 text-white hover:bg-amber-700">
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Save field decisions
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-sm text-amber-200">
                    <span>The suggested existing record is no longer available. Refresh the batch and review the duplicate before approving.</span>
                    <Button variant="outline" onClick={() => setMergeTarget(null)}>Close</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
