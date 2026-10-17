'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  FileText, Upload, Download, Eye, Search, Plus, Calendar,
  CheckCircle2, Clock, AlertTriangle, RefreshCw, Filter, ChevronRight
} from 'lucide-react'

interface Agreement {
  id: string
  agreementId: string
  type: string
  status: string
  startDate: string
  endDate: string
  commissionRate: string
  commissionType: string
  paymentTerms: string
  description: string
  signedDocument?: string
  createdAt: string
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  active: { color: 'bg-green-50 text-green-700', label: 'Active', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  expired: { color: 'bg-red-50 text-red-700', label: 'Expired', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  pending_renewal: { color: 'bg-amber-50 text-amber-700', label: 'Pending Renewal', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  pending_signature: { color: 'bg-blue-50 text-blue-700', label: 'Pending Signature', icon: <Clock className="h-3.5 w-3.5" /> },
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft', icon: <FileText className="h-3.5 w-3.5" /> },
}

// Agreements are now fetched from the API

export default function PartnerAgreements() {
  const { currentUser } = useAppStore()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingAgreement, setUploadingAgreement] = useState<Agreement | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchAgreements() {
      try {
        setLoading(true)
        const partnerId = currentUser?.referenceId || ''
        const res = await fetch(`/api/partners?limit=50`)
        if (res.ok) {
          const json = await res.json()
          const mapped = (json.partners || []).map((p: any) => ({
            id: p.id,
            agreementId: p.partnerId || p.id,
            type: p.agreementType || p.partnerType || 'TYPE1 - Partner Referral',
            status: p.agreementStatus || p.status || 'active',
            startDate: p.agreementStart || p.createdAt || '',
            endDate: p.agreementEnd || '',
            commissionRate: p.commissionRate ? `${p.commissionRate}%` : '10%',
            commissionType: p.commissionType || 'First Year Tuition',
            paymentTerms: p.paymentTerms || 'Net 30 days',
            description: p.description || `Partnership agreement with ${p.companyName || 'Partner'}`,
            signedDocument: p.signedDocument || undefined,
            createdAt: p.createdAt || '',
          }))
          setAgreements(mapped)
        }
      } catch {
        setAgreements([])
      } finally {
        setLoading(false)
      }
    }
    fetchAgreements()
  }, [currentUser?.referenceId])

  const filtered = agreements.filter(a => {
    const matchSearch = !search ||
      a.agreementId.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = {
    active: agreements.filter(a => a.status === 'active').length,
    pending_renewal: agreements.filter(a => a.status === 'pending_renewal').length,
    pending_signature: agreements.filter(a => a.status === 'pending_signature').length,
    expired: agreements.filter(a => a.status === 'expired').length,
  }

  const handleUpload = async () => {
    if (!uploadingAgreement) return
    setUploading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success(`Signed document uploaded for ${uploadingAgreement.agreementId}`)
    setShowUploadDialog(false)
    setUploadingAgreement(null)
    setUploading(false)
  }

  const handleDownload = (agreement: Agreement) => {
    toast.success(`Downloading ${agreement.agreementId}.pdf...`)
  }

  const handleView = (agreement: Agreement) => {
    setSelectedAgreement(agreement)
    setShowDetailDialog(true)
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Agreements</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your partnership agreements with ALO</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: statusCounts.active, icon: <CheckCircle2 className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Pending Renewal', value: statusCounts.pending_renewal, icon: <RefreshCw className="h-5 w-5" />, bg: 'bg-amber-50', textColor: 'text-amber-600' },
          { label: 'Pending Signature', value: statusCounts.pending_signature, icon: <Clock className="h-5 w-5" />, bg: 'bg-blue-50', textColor: 'text-blue-600' },
          { label: 'Expired', value: statusCounts.expired, icon: <AlertTriangle className="h-5 w-5" />, bg: 'bg-red-50', textColor: 'text-red-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Agreements</TabsTrigger>
          <TabsTrigger value="details">Agreement Details</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search agreements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agreement List */}
          {filtered.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No agreements found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Agreement ID</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Start Date</TableHead>
                      <TableHead className="text-xs">End Date</TableHead>
                      <TableHead className="text-xs">Commission</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((agr) => {
                      const sc = statusConfig[agr.status] || { color: 'bg-gray-100 text-gray-600', label: agr.status, icon: null }
                      const daysLeft = getDaysUntilExpiry(agr.endDate)
                      return (
                        <TableRow key={agr.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleView(agr)}>
                          <TableCell className="text-xs font-mono text-[#0066CC]">{agr.agreementId}</TableCell>
                          <TableCell className="text-sm text-[#1A2332] max-w-[200px] truncate">{agr.type}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs flex items-center gap-1 w-fit ${sc.color}`}>
                              {sc.icon} {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{new Date(agr.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">
                            <span className={daysLeft <= 30 && daysLeft > 0 ? 'text-amber-600 font-medium' : daysLeft <= 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              {new Date(agr.endDate).toLocaleDateString()}
                            </span>
                            {daysLeft <= 30 && daysLeft > 0 && (
                              <span className="block text-[10px] text-amber-600">{daysLeft} days left</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-[#F37021]">{agr.commissionRate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDownload(agr) }}>
                                <Download className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                              {agr.status === 'pending_signature' && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setUploadingAgreement(agr); setShowUploadDialog(true) }}>
                                  <Upload className="h-3.5 w-3.5 text-[#F37021]" />
                                </Button>
                              )}
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {filtered.map((agr) => (
            <Card key={agr.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                      {agr.agreementId}
                      <Badge className={`text-xs ${statusConfig[agr.status]?.color || 'bg-gray-100'}`}>
                        {statusConfig[agr.status]?.label || agr.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{agr.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(agr)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-gray-600 mb-4">{agr.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Start Date</p>
                    <p className="text-sm font-semibold text-[#1A2332]">{new Date(agr.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">End Date</p>
                    <p className="text-sm font-semibold text-[#1A2332]">{new Date(agr.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-[#F37021]/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Commission Rate</p>
                    <p className="text-sm font-semibold text-[#F37021]">{agr.commissionRate}</p>
                  </div>
                  <div className="bg-[#0066CC]/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Commission Type</p>
                    <p className="text-sm font-semibold text-[#0066CC]">{agr.commissionType}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Payment Terms: <span className="text-[#1A2332] font-medium">{agr.paymentTerms}</span></p>
                  {agr.status === 'pending_signature' && (
                    <Button size="sm" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white h-8 text-xs"
                      onClick={() => { setUploadingAgreement(agr); setShowUploadDialog(true) }}>
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload Signed Copy
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Upload Signed Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Signed Agreement</DialogTitle>
          </DialogHeader>
          {uploadingAgreement && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="text-sm"><span className="text-gray-500">Agreement:</span> <span className="font-medium">{uploadingAgreement.agreementId}</span></p>
                <p className="text-sm"><span className="text-gray-500">Type:</span> {uploadingAgreement.type}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Select Signed Document (PDF)</Label>
                <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#F37021]/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF files only, max 10MB</p>
                  <Input type="file" accept=".pdf" className="hidden" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Notes (Optional)</Label>
                <Textarea className="mt-1" placeholder="Any additional notes about this signed agreement..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploading} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                  <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agreement Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Agreement Details</DialogTitle>
          </DialogHeader>
          {selectedAgreement && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-[#1A2332]">{selectedAgreement.agreementId}</p>
                  <p className="text-sm text-gray-500">{selectedAgreement.type}</p>
                </div>
                <Badge className={statusConfig[selectedAgreement.status]?.color || 'bg-gray-100'}>
                  {statusConfig[selectedAgreement.status]?.label || selectedAgreement.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{selectedAgreement.description}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="text-sm font-semibold">{new Date(selectedAgreement.startDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="text-sm font-semibold">{new Date(selectedAgreement.endDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-[#F37021]/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Commission Rate</p>
                  <p className="text-sm font-semibold text-[#F37021]">{selectedAgreement.commissionRate}</p>
                </div>
                <div className="bg-[#0066CC]/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Commission Type</p>
                  <p className="text-sm font-semibold text-[#0066CC]">{selectedAgreement.commissionType}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="text-sm font-medium text-[#1A2332]">{selectedAgreement.paymentTerms}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleDownload(selectedAgreement)}>
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
                {selectedAgreement.status === 'pending_signature' && (
                  <Button className="flex-1 bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                    onClick={() => { setShowDetailDialog(false); setUploadingAgreement(selectedAgreement); setShowUploadDialog(true) }}>
                    <Upload className="h-4 w-4 mr-2" /> Upload Signed
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
