'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  FileText, Upload, Download, Eye, Clock, CheckCircle2, XCircle,
  AlertTriangle, FolderOpen, Plus
} from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  status: 'verified' | 'pending' | 'rejected'
  fileName: string
  notes?: string
}

interface DocumentRequest {
  id: string
  documentType: string
  requestedDate: string
  deadline: string
  description: string
  requestedBy: string
}

// Documents and requests are now fetched from the API

const documentTypes = [
  'Employment', 'Identification', 'Education', 'Certification', 'Legal', 'Financial', 'Medical', 'Other'
]

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewDoc, setViewDoc] = useState<Document | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [uploadForRequest, setUploadForRequest] = useState<string | null>(null)

  // Upload form state
  const [formDocType, setFormDocType] = useState('')
  const [formDocName, setFormDocName] = useState('')
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true)
        const res = await fetch('/api/documents?limit=50')
        if (res.ok) {
          const json = await res.json()
          const docs = (json.documents || []).map((d: any) => ({
            id: d.id,
            name: d.documentName || d.name || 'Document',
            type: d.documentType || d.type || 'Other',
            uploadDate: d.uploadedAt || d.createdAt || '',
            status: d.status === 'uploaded' ? 'pending' as const : (d.status === 'verified' ? 'verified' as const : d.status === 'rejected' ? 'rejected' as const : 'pending' as const),
            fileName: d.filePath || d.fileName || 'document.pdf',
            notes: d.notes || undefined,
          }))
          setDocuments(docs)
          // Document requests could come from a separate source, keep empty for now
          setRequests([])
        }
      } catch {
        setDocuments([])
        setRequests([])
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  const stats = {
    total: documents.length,
    verified: documents.filter(d => d.status === 'verified').length,
    pending: documents.filter(d => d.status === 'pending').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-[#F37021]" />
  }

  const handleUpload = () => {
    if (!formDocType || !formDocName) {
      toast.error('Please fill in all required fields')
      return
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: formDocName,
      type: formDocType,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      fileName: formDocName.toLowerCase().replace(/\s+/g, '_') + '.pdf',
      notes: formNotes || undefined,
    }

    setDocuments(prev => [newDoc, ...prev])
    toast.success('Document uploaded successfully! It will be reviewed by HR.')

    // Reset form
    setFormDocType('')
    setFormDocName('')
    setFormNotes('')
    setUploadOpen(false)
    setUploadForRequest(null)
  }

  const handleUploadForRequest = (requestId: string, docType: string) => {
    setUploadForRequest(requestId)
    setFormDocType(docType)
    setFormDocName(docType)
    setUploadOpen(true)
  }

  const handleDownload = (doc: Document) => {
    toast.success(`Downloading ${doc.fileName}...`)
  }

  const handleView = (doc: Document) => {
    setViewDoc(doc)
    setViewOpen(true)
  }

  const isDeadlineSoon = (deadline: string) => {
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7 && daysLeft >= 0
  }

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">My Documents</h1>
        <Button
          className="bg-[#F37021] hover:bg-[#e5651d] text-white"
          onClick={() => {
            setUploadForRequest(null)
            setFormDocType('')
            setFormDocName('')
            setFormNotes('')
            setUploadOpen(true)
          }}
        >
          <Upload className="h-4 w-4 mr-2" /> Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-[#F37021]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{stats.verified}</p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A2332]">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Requests */}
      {requests.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-[#F37021]">
          <CardHeader>
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#F37021]" /> Document Requests from HR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1A2332]">{req.documentType}</p>
                      {isDeadlinePassed(req.deadline) && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Overdue</Badge>
                      )}
                      {isDeadlineSoon(req.deadline) && !isDeadlinePassed(req.deadline) && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Due Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Requested by: {req.requestedBy}</span>
                      <span>Requested: {new Date(req.requestedDate).toLocaleDateString()}</span>
                      <span className={isDeadlinePassed(req.deadline) ? 'text-red-500 font-medium' : ''}>
                        Deadline: {new Date(req.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#F37021] hover:bg-[#e5651d] text-white shrink-0"
                    onClick={() => handleUploadForRequest(req.id, req.documentType)}
                  >
                    <Upload className="h-4 w-4 mr-1" /> Upload
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Documents Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#F37021]" /> Document List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(doc.type)}
                        <div>
                          <p className="font-medium text-[#1A2332]">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.fileName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(doc)} title="View Details">
                          <Eye className="h-4 w-4 text-[#0066CC]" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Download">
                          <Download className="h-4 w-4 text-gray-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => {
        setUploadOpen(open)
        if (!open) {
          setFormDocType('')
          setFormDocName('')
          setFormNotes('')
          setUploadForRequest(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332] flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#F37021]" />
              {uploadForRequest ? 'Upload Requested Document' : 'Upload Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={formDocType} onValueChange={setFormDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                placeholder="e.g., Employment Contract 2025"
                value={formDocName}
                onChange={e => setFormDocName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#F37021] transition-colors cursor-pointer" onClick={() => toast.info('File picker would open here in production')}>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes about this document..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button className="bg-[#F37021] hover:bg-[#e5651d] text-white" onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Document Details</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F37021]/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#F37021]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A2332]">{viewDoc.name}</h3>
                  <p className="text-sm text-gray-400">{viewDoc.fileName}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <Badge variant="outline" className="mt-1">{viewDoc.type}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(viewDoc.status)}</div>
                </div>
                <div>
                  <p className="text-gray-500">Upload Date</p>
                  <p className="font-medium">{new Date(viewDoc.uploadDate).toLocaleDateString()}</p>
                </div>
              </div>
              {viewDoc.notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{viewDoc.notes}</p>
                </div>
              )}
              {viewDoc.status === 'rejected' && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-xs text-red-600 font-medium mb-1">Action Required</p>
                  <p className="text-sm text-red-700">This document was rejected. Please upload a corrected version.</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownload(viewDoc)}
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                {viewDoc.status === 'rejected' && (
                  <Button
                    className="flex-1 bg-[#F37021] hover:bg-[#e5651d] text-white"
                    onClick={() => {
                      setViewOpen(false)
                      setFormDocType(viewDoc.type)
                      setFormDocName(viewDoc.name)
                      setUploadOpen(true)
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" /> Re-upload
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
