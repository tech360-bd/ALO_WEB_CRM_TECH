'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  FileText, Eye, Clock, CheckCircle2, XCircle,
  Loader2, Inbox, AlertCircle,
} from 'lucide-react';

type DocType = 'Transcript' | 'Passport' | 'SOP' | 'CV/Resume' | 'IELTS Certificate' | 'Financial Docs' | 'Recommendation Letter' | 'Other';
type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'info_requested';

interface PendingDoc {
  id: string; studentName: string; studentId: string; docType: DocType;
  fileName: string; fileSize: string; uploadedDate: string;
}

interface CompletedReview {
  id: string; studentName: string; docType: DocType; fileName: string;
  reviewedDate: string; status: ReviewStatus; reviewedBy: string; notes: string;
}

const pendingDocs: PendingDoc[] = [
  { id: 'DOC-001', studentName: 'Rahim Uddin', studentId: 'ALO-STU-2024-0045', docType: 'Transcript', fileName: 'Rahim_Transcript_BSc.pdf', fileSize: '1.2 MB', uploadedDate: '2025-01-18' },
  { id: 'DOC-002', studentName: 'Fatima Akter', studentId: 'ALO-STU-2024-0038', docType: 'SOP', fileName: 'Fatima_SOP_Melbourne.pdf', fileSize: '245 KB', uploadedDate: '2025-01-18' },
  { id: 'DOC-003', studentName: 'Nusrat Jahan', studentId: 'ALO-STU-2024-0061', docType: 'IELTS Certificate', fileName: 'Nusrat_IELTS_7.5.pdf', fileSize: '520 KB', uploadedDate: '2025-01-17' },
  { id: 'DOC-004', studentName: 'Taslima Begum', studentId: 'ALO-STU-2024-0055', docType: 'Financial Docs', fileName: 'Taslima_Bank_Statement.pdf', fileSize: '3.4 MB', uploadedDate: '2025-01-17' },
  { id: 'DOC-005', studentName: 'Jamil Hossain', studentId: 'ALO-STU-2024-0041', docType: 'CV/Resume', fileName: 'Jamil_CV_2025.pdf', fileSize: '380 KB', uploadedDate: '2025-01-16' },
  { id: 'DOC-006', studentName: 'Mita Das', studentId: 'ALO-STU-2024-0070', docType: 'Passport', fileName: 'Mita_Passport_Scan.pdf', fileSize: '1.8 MB', uploadedDate: '2025-01-16' },
  { id: 'DOC-007', studentName: 'Sajib Rahman', studentId: 'ALO-STU-2024-0044', docType: 'Recommendation Letter', fileName: 'Sajib_RecoLetter_ProfAli.pdf', fileSize: '290 KB', uploadedDate: '2025-01-15' },
];

const completedReviews: CompletedReview[] = [
  { id: 'R-001', studentName: 'Tanvir Ahmed', docType: 'Transcript', fileName: 'Tanvir_Transcript_BEng.pdf', reviewedDate: '2025-01-17', status: 'approved', reviewedBy: 'Sarah Khan', notes: 'All documents verified and authentic.' },
  { id: 'R-002', studentName: 'Imran Hossain', docType: 'Financial Docs', fileName: 'Imran_Sponsorship_Letter.pdf', reviewedDate: '2025-01-16', status: 'approved', reviewedBy: 'Sarah Khan', notes: 'Sufficient funds demonstrated.' },
  { id: 'R-003', studentName: 'Sumaiya Akhter', docType: 'Passport', fileName: 'Sumaiya_Passport.pdf', reviewedDate: '2025-01-15', status: 'rejected', reviewedBy: 'Sarah Khan', notes: 'Passport scan is blurry. Please rescan with higher resolution.' },
  { id: 'R-004', studentName: 'Arif Islam', docType: 'SOP', fileName: 'Arif_SOP_TUM.pdf', reviewedDate: '2025-01-14', status: 'info_requested', reviewedBy: 'Sarah Khan', notes: 'Please add more details about research experience.' },
  { id: 'R-005', studentName: 'Rafi Ahmed', docType: 'IELTS Certificate', fileName: 'Rafi_IELTS_6.5.pdf', reviewedDate: '2025-01-13', status: 'approved', reviewedBy: 'Sarah Khan', notes: 'Score meets university requirement.' },
];

const docTypeIcons: Record<DocType, string> = {
  Transcript: '\U0001F4C4', Passport: '\U0001F534', 'SOP': '\U0001F4DD', 'CV/Resume': '\U0001F4CB',
  'IELTS Certificate': '\U0001F393', 'Financial Docs': '\U0001F4B0', 'Recommendation Letter': '\U0001F4E7', Other: '\U0001F4CE',
};

export default function EmployeeDocumentsPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingDoc[]>(pendingDocs);
  const [completed, setCompleted] = useState<CompletedReview[]>(completedReviews);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doc: PendingDoc | null }>({ open: false, doc: null });
  const [infoDialog, setInfoDialog] = useState<{ open: boolean; doc: PendingDoc | null }>({ open: false, doc: null });
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const handleApprove = async (doc: PendingDoc) => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    setPending((p) => p.filter((d) => d.id !== doc.id));
    setCompleted((c) => [{ id: 'R-' + String(Date.now()), studentName: doc.studentName, docType: doc.docType, fileName: doc.fileName, reviewedDate: new Date().toISOString().split('T')[0], status: 'approved', reviewedBy: 'Sarah Khan', notes: 'Approved' }, ...c]);
    toast.success('Document approved for ' + doc.studentName);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectDialog.doc || !reason.trim()) { toast.error('Please provide a reason'); return; }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    const doc = rejectDialog.doc;
    setPending((p) => p.filter((d) => d.id !== doc.id));
    setCompleted((c) => [{ id: 'R-' + String(Date.now()), studentName: doc.studentName, docType: doc.docType, fileName: doc.fileName, reviewedDate: new Date().toISOString().split('T')[0], status: 'rejected', reviewedBy: 'Sarah Khan', notes: reason }, ...c]);
    toast.success('Document rejected for ' + doc.studentName);
    setRejectDialog({ open: false, doc: null }); setReason('');
    setProcessing(false);
  };

  const handleRequestInfo = async () => {
    if (!infoDialog.doc || !reason.trim()) { toast.error('Please describe what additional info is needed'); return; }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    const doc = infoDialog.doc;
    setPending((p) => p.filter((d) => d.id !== doc.id));
    setCompleted((c) => [{ id: 'R-' + String(Date.now()), studentName: doc.studentName, docType: doc.docType, fileName: doc.fileName, reviewedDate: new Date().toISOString().split('T')[0], status: 'info_requested', reviewedBy: 'Sarah Khan', notes: reason }, ...c]);
    toast.success('Additional info requested from ' + doc.studentName);
    setInfoDialog({ open: false, doc: null }); setReason('');
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-24 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Document Review</h1>
          <p className="text-sm text-alo-text-muted mt-1">Review and process student documents</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="warning" className="text-xs">{pending.length} Pending</Badge>
          <Badge variant="success" className="text-xs">{completed.length} Reviewed</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Awaiting Review', count: pending.length, icon: Inbox, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Approved Today', count: 3, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Rejected Today', count: 1, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Info Requested', count: 1, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map((item, i) => (
          <Card key={i} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.bg)}>
                <item.icon className={cn('w-5 h-5', item.color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-alo-text">{item.count}</p>
                <p className="text-xs text-alo-text-muted">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-white rounded-xl border border-alo-border w-fit">
        <button onClick={() => setTab('pending')} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', tab === 'pending' ? 'bg-alo-brand text-white' : 'text-alo-text-secondary hover:bg-alo-page')}>Review Queue ({pending.length})</button>
        <button onClick={() => setTab('completed')} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', tab === 'completed' ? 'bg-alo-brand text-white' : 'text-alo-text-secondary hover:bg-alo-page')}>Completed ({completed.length})</button>
      </div>

      {tab === 'pending' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pending.map((doc) => (
            <Card key={doc.id} className="bg-white rounded-xl border border-alo-border hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-alo-page flex items-center justify-center text-2xl shrink-0">{docTypeIcons[doc.docType]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-alo-text truncate">{doc.studentName}</span>
                      <Badge variant="warning" className="text-[10px] shrink-0">Pending</Badge>
                    </div>
                    <p className="text-xs text-alo-text-muted">{doc.docType}</p>
                    <p className="text-xs text-alo-text-secondary mt-1 flex items-center gap-1"><FileText className="w-3 h-3" />{doc.fileName} <span className="text-alo-text-muted">({doc.fileSize})</span></p>
                    <p className="text-[11px] text-alo-text-muted mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />Uploaded {new Date(doc.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-alo-border">
                  <Button variant="ghost" size="sm" className="text-alo-text-secondary" onClick={() => toast.info('Previewing ' + doc.fileName)}><Eye className="w-3.5 h-3.5" /> Preview</Button>
                  <div className="flex-1" />
                  <Button variant="success" size="sm" onClick={() => handleApprove(doc)} disabled={processing}><CheckCircle2 className="w-3.5 h-3.5" /> Approve</Button>
                  <Button variant="danger" size="sm" onClick={() => { setRejectDialog({ open: true, doc }); setReason(''); }}><XCircle className="w-3.5 h-3.5" /> Reject</Button>
                  <Button variant="outline" size="sm" onClick={() => { setInfoDialog({ open: true, doc }); setReason(''); }}><AlertCircle className="w-3.5 h-3.5" /> More Info</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pending.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-alo-text-muted/40 mx-auto mb-3" />
              <p className="text-sm text-alo-text-secondary font-medium">All caught up!</p>
              <p className="text-xs text-alo-text-muted mt-1">No documents pending review</p>
            </div>
          )}
        </div>
      )}

      {tab === 'completed' && (
        <Card className="bg-white rounded-xl border border-alo-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-alo-page/50">
                  <TableHead>Student</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-alo-text text-sm">{r.studentName}</TableCell>
                    <TableCell><span className="text-xs text-alo-text-secondary">{r.docType}</span></TableCell>
                    <TableCell><span className="text-xs text-alo-text-muted flex items-center gap-1"><FileText className="w-3 h-3" />{r.fileName}</span></TableCell>
                    <TableCell><span className="text-xs text-alo-text-secondary">{new Date(r.reviewedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'} className="text-[11px] capitalize">{r.status === 'info_requested' ? 'Info Requested' : r.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><span className="text-xs text-alo-text-muted line-clamp-1 max-w-[200px]">{r.notes}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ open: o, doc: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-alo-text">Reject Document</DialogTitle>
            <DialogDescription className="text-alo-text-muted">Provide a reason for rejecting {rejectDialog.doc?.studentName}'s {rejectDialog.doc?.docType}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm text-alo-text-secondary">Rejection Reason *</Label>
            <Textarea placeholder="Explain why this document is being rejected..." value={reason} onChange={(e) => setReason(e.target.value)} className="bg-alo-page border-alo-border min-h-[100px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, doc: null })}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={processing || !reason.trim()}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoDialog.open} onOpenChange={(o) => setInfoDialog({ open: o, doc: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-alo-text">Request Additional Information</DialogTitle>
            <DialogDescription className="text-alo-text-muted">Describe what additional information is needed from {infoDialog.doc?.studentName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm text-alo-text-secondary">Details *</Label>
            <Textarea placeholder="Describe what additional info is needed..." value={reason} onChange={(e) => setReason(e.target.value)} className="bg-alo-page border-alo-border min-h-[100px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDialog({ open: false, doc: null })}>Cancel</Button>
            <Button variant="brand" onClick={handleRequestInfo} disabled={processing || !reason.trim()}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />} Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
