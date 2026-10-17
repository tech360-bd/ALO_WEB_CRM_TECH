'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  FileText, Upload, FileCheck, AlertTriangle, Clock,
  CheckCircle2, XCircle, File, ImageIcon, FileSpreadsheet, Trash2, Plus
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  status: string
  fileUrl: string | null
  uploadedAt: string
  reviewedAt: string | null
  reviewNote: string | null
}

const docCategories = [
  { key: 'all', label: 'All Documents' },
  { key: 'academic', label: 'Academic' },
  { key: 'identity', label: 'Identity' },
  { key: 'english', label: 'English Test' },
  { key: 'financial', label: 'Financial' },
  { key: 'medical', label: 'Medical' },
  { key: 'other', label: 'Other' },
]

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'bg-yellow-50 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Pending Review' },
  approved: { color: 'bg-green-50 text-green-700', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
  rejected: { color: 'bg-red-50 text-red-700', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
  uploaded: { color: 'bg-blue-50 text-blue-700', icon: <Upload className="h-3 w-3" />, label: 'Uploaded' },
  verified: { color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Verified' },
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon className="h-5 w-5 text-blue-500" />
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />
  return <File className="h-5 w-5 text-gray-500" />
}

export default function StudentDocuments() {
  const { currentUser } = useAppStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId || ''
        const res = await fetch(`/api/documents?studentId=${refId}&limit=50`)
        if (!res.ok) throw new Error('Failed to load documents')
        const json = await res.json()
        setDocuments(json.documents || json || [])
      } catch {
        // If API doesn't exist yet, show empty state
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [currentUser?.referenceId])

  const filtered = category === 'all'
    ? documents
    : documents.filter((doc) => doc.type?.toLowerCase() === category)

  const pendingCount = documents.filter(d => d.status === 'pending' || d.status === 'rejected').length
  const approvedCount = documents.filter(d => d.status === 'approved' || d.status === 'verified').length

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const file = fileInputRef.current?.files?.[0]
      if (!file) {
        toast.error('Please select a file')
        return
      }

      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('name', formData.get('name') as string || file.name)
      uploadData.append('type', formData.get('type') as string || 'other')
      uploadData.append('studentId', currentUser?.referenceId || '')

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: uploadData,
      })
      if (!res.ok) throw new Error('Upload failed')
      toast.success('Document uploaded successfully')
      setShowUploadDialog(false)
      const json = await res.json()
      setDocuments(prev => [json, ...prev])
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">My Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage your documents</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-alo-orange hover:bg-alo-orange/90 text-white">
              <Upload className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Document Name</Label>
                <Input name="name" className="mt-1" placeholder="e.g. Passport Copy" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Document Type</Label>
                <Select name="type" defaultValue="other">
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic Certificate</SelectItem>
                    <SelectItem value="identity">Identity Document</SelectItem>
                    <SelectItem value="english">English Test Certificate</SelectItem>
                    <SelectItem value="financial">Financial Document</SelectItem>
                    <SelectItem value="medical">Medical Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">File</Label>
                <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-alo-orange/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">Click to select a file</p>
                  <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={uploading} className="bg-alo-orange hover:bg-alo-orange/90 text-white">
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{documents.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{approvedCount}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-alo-orange/10 rounded-lg flex items-center justify-center text-alo-orange">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-navy">
                {documents.filter(d => d.status === 'rejected').length}
              </p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="bg-gray-100 p-1 flex-wrap h-auto">
          {docCategories.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key}
              className="data-[state=active]:bg-white data-[state=active]:text-alo-orange text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category} className="mt-4">
          {filtered.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <FileCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No documents found</p>
                <p className="text-xs text-gray-400 mt-1">Upload your first document to get started</p>
                <Button className="mt-4 bg-alo-orange hover:bg-alo-orange/90 text-white"
                  onClick={() => setShowUploadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((doc) => {
                const sc = statusConfig[doc.status] || statusConfig.pending
                return (
                  <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                        {getFileIcon(doc.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-alo-navy truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                          </span>
                          {doc.type && (
                            <Badge variant="outline" className="text-[10px] py-0">{doc.type}</Badge>
                          )}
                        </div>
                        {doc.reviewNote && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {doc.reviewNote}
                          </p>
                        )}
                      </div>
                      <Badge className={`text-xs shrink-0 ${sc.color}`}>
                        <span className="mr-1">{sc.icon}</span> {sc.label}
                      </Badge>
                      <Button variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
