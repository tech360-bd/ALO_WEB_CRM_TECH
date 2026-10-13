'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Upload, Search, Filter, FileCheck2, FileX2, Clock,
  FileWarning, Download, Paperclip, FilePlus2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DocumentRecord {
  id: string
  documentName: string
  documentType: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  status: string
  note: string | null
  uploadedAt: string
  reviewedAt: string | null
}

const DOC_TYPES = [
  { value: 'all', label: 'All documents' },
  { value: 'passport', label: 'Passport' },
  { value: 'academic', label: 'Academic transcripts' },
  { value: 'english_test', label: 'English test' },
  { value: 'sop', label: 'Statement of Purpose' },
  { value: 'lor', label: 'Recommendation letters' },
  { value: 'cv', label: 'CV / Resume' },
  { value: 'financial', label: 'Financial proof' },
  { value: 'photo', label: 'Photograph' },
  { value: 'other', label: 'Other' },
]

const statusMeta: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  uploaded: { color: 'bg-amber-50 text-amber-600', icon: Clock },
  under_review: { color: 'bg-blue-50 text-[#0057B8]', icon: Clock },
  approved: { color: 'bg-green-50 text-green-700', icon: FileCheck2 },
  rejected: { color: 'bg-red-50 text-red-600', icon: FileX2 },
  expired: { color: 'bg-slate-100 text-slate-600', icon: FileWarning },
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function typeLabel(type: string): string {
  return DOC_TYPES.find((t) => t.value === type)?.label || type
}

export default function DocumentsPage() {
  const session = getSession()
  const { data, loading } = usePortalData<{ documents: DocumentRecord[] }>({
    endpoint: '/api/documents',
    params: { studentId: session?.user.referenceId || '', limit: 100 },
  })

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: '', type: 'passport', file: null as File | null })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const docs = data?.documents || []

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (typeFilter !== 'all' && d.documentType !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!d.documentName.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [docs, search, typeFilter])

  const stats = useMemo(() => {
    const total = docs.length
    const approved = docs.filter((d) => d.status === 'approved').length
    const pending = docs.filter((d) => ['uploaded', 'under_review'].includes(d.status)).length
    const rejected = docs.filter((d) => d.status === 'rejected').length
    return { total, approved, pending, rejected }
  }, [docs])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setNewDoc((p) => ({ ...p, file: f, name: p.name || f.name }))
  }

  const handleUpload = async () => {
    if (!newDoc.name || !session?.user.referenceId) {
      toast.error('Please provide a document name')
      return
    }
    setUploading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          studentId: session.user.referenceId,
          name: newDoc.name,
          type: newDoc.type,
          fileUrl: newDoc.file ? `/uploads/${newDoc.file.name}` : null,
          fileSize: newDoc.file?.size || null,
          mimeType: newDoc.file?.type || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Upload failed')
      }
      toast.success('Document uploaded successfully')
      setUploadOpen(false)
      setNewDoc({ name: '', type: 'passport', file: null })
      // Reload page to show new doc
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description="Manage your academic, identity, and application documents."
        action={
          <Button onClick={() => setUploadOpen(true)} className="bg-[#0057B8] hover:bg-[#00449a] text-white">
            <Upload className="h-4 w-4 mr-2" /> Upload Document
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={FileText} accent="blue" hint="All documents" />
        <StatCard label="Approved" value={stats.approved} icon={FileCheck2} accent="green" hint="Verified" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="amber" hint="Awaiting review" />
        <StatCard label="Rejected" value={stats.rejected} icon={FileX2} accent="orange" hint="Needs re-upload" />
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by document name…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 border-0 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-slate-100 animate-pulse mb-3" />
              <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse mb-2" />
              <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900">
            {docs.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {docs.length === 0
              ? 'Upload your first document to get started.'
              : 'Try a different search or filter.'}
          </p>
          {docs.length === 0 && (
            <Button onClick={() => setUploadOpen(true)} className="bg-[#E8501A] hover:bg-[#c8420f] text-white">
              <Upload className="h-4 w-4 mr-2" /> Upload First Document
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const meta = statusMeta[doc.status] || statusMeta.uploaded
            const StatusIcon = meta.icon
            return (
              <Card key={doc.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    'h-12 w-12 rounded-lg flex items-center justify-center shrink-0',
                    doc.status === 'approved' ? 'bg-green-50' :
                    doc.status === 'rejected' ? 'bg-red-50' : 'bg-[#EFF6FF]'
                  )}>
                    <FileText className={cn(
                      'h-6 w-6',
                      doc.status === 'approved' ? 'text-green-600' :
                      doc.status === 'rejected' ? 'text-red-500' : 'text-[#0057B8]'
                    )} />
                  </div>
                  <Badge className={cn('border-0 capitalize', meta.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {doc.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="font-semibold text-slate-900 truncate" title={doc.documentName}>
                  {doc.documentName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{typeLabel(doc.documentType)}</p>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Size</span>
                    <span className="font-medium text-slate-700">{formatSize(doc.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded</span>
                    <span className="font-medium text-slate-700">{formatDate(doc.uploadedAt)}</span>
                  </div>
                  {doc.reviewedAt && (
                    <div className="flex items-center justify-between">
                      <span>Reviewed</span>
                      <span className="font-medium text-slate-700">{formatDate(doc.reviewedAt)}</span>
                    </div>
                  )}
                </div>
                {doc.note && (
                  <p className="mt-3 text-xs text-slate-500 italic line-clamp-2 p-2 rounded bg-slate-50">
                    “{doc.note}”
                  </p>
                )}
                <div className="mt-auto pt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info('Download started (demo)')}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> View
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to your profile. Supported formats: PDF, JPG, PNG, DOCX.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Document Name</Label>
              <Input
                value={newDoc.name}
                onChange={(e) => setNewDoc((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Passport Bio Page"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <Select
                value={newDoc.type}
                onValueChange={(v) => setNewDoc((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.filter((t) => t.value !== 'all').map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File</Label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#0057B8] hover:bg-[#EFF6FF]/50 transition-colors text-center"
              >
                {newDoc.file ? (
                  <div>
                    <Paperclip className="h-6 w-6 text-[#0057B8] mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">{newDoc.file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatSize(newDoc.file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <FilePlus2 className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Click to select a file</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG, DOCX up to 10MB</p>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !newDoc.name}
              className="bg-[#0057B8] hover:bg-[#00449a] text-white"
            >
              {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
