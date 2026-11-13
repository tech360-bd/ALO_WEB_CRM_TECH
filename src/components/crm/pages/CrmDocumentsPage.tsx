'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Upload, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  pending_review: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  needs_update: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  approved: 'bg-crm-success-bg text-crm-success-text',
  accepted: 'bg-crm-success-bg text-crm-success-text',
  rejected: 'bg-crm-danger-bg text-crm-danger-text',
  uploaded: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  not_uploaded: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
};

export default function CrmDocumentsPage() {
  const token = usePortalStore(state => state.token);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const loadDocs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/crm/documents?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const counts = {
    all: documents.length,
    pending: documents.filter(d => d.status === 'pending' || d.status === 'pending_review' || d.status === 'needs_update').length,
    approved: documents.filter(d => d.status === 'approved' || d.status === 'accepted').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  };

  const filtered = documents.filter((d) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return d.status === 'pending' || d.status === 'pending_review' || d.status === 'needs_update';
    if (activeTab === 'approved') return d.status === 'approved' || d.status === 'accepted';
    if (activeTab === 'rejected') return d.status === 'rejected';
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Document Management</h1>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-alo-brand hover:bg-alo-brand-light text-white"><Upload className="mr-2 h-4 w-4" />Upload Document</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-alo-border">
          <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-1">{counts.pending}</Badge></TabsTrigger>
          <TabsTrigger value="approved">Approved <Badge variant="secondary" className="ml-1">{counts.approved}</Badge></TabsTrigger>
          <TabsTrigger value="rejected">Rejected <Badge variant="secondary" className="ml-1">{counts.rejected}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                  <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-alo-border text-left text-alo-text-muted">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Document</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Uploaded</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => (
                      <tr key={doc.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]">
                        <td className="py-3 font-medium text-alo-text">{doc.studentProfile?.fullName || doc.studentName || 'N/A'}</td>
                        <td className="py-3 text-alo-text-secondary">{doc.category}</td>
                        <td className="py-3 text-alo-text-secondary">{doc.documentType}</td>
                        <td className="py-3"><Badge className={statusColors[doc.status] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>{doc.status?.replace(/_/g, ' ')}</Badge></td>
                        <td className="py-3 text-alo-text-muted">{doc.createdAt?.substring(0, 10)}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-crm-success-text"><CheckCircle className="h-4 w-4" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-crm-danger-text"><XCircle className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-alo-text-muted">No documents found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
