'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  FileText, CheckCircle, XCircle, Clock, Search, Filter, Upload, Download,
  Eye, Shield, AlertTriangle, FileCheck, Plus, Trash2, Edit2
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface CRMDocument {
  id: string
  name: string
  type: DocumentType
  ownerName: string
  ownerType: 'student' | 'partner' | 'employee'
  ownerId: string
  status: 'verified' | 'pending' | 'rejected' | 'expired'
  uploadDate: string
  expiryDate: string | null
  fileSize: string
  reviewedBy: string | null
  reviewNote: string | null
  priority: 'normal' | 'urgent' | 'high'
}

type DocumentType = 'Passport' | 'Academic Transcript' | 'IELTS Certificate' | 'Bank Statement' | 'Offer Letter' | 'Visa Document' | 'Employment Contract' | 'NID' | 'Other'

interface DocumentTypeConfig {
  id: string
  name: string
  requiredFor: ('student' | 'partner' | 'employee')[]
  isRequired: boolean
  autoExpire: boolean
  expiryPeriod: number | null
  expiryUnit: 'days' | 'months' | 'years'
}

// Mock Data
const mockDocuments: CRMDocument[] = [
  { id: 'DOC001', name: 'Ahmed_Passport_2024.pdf', type: 'Passport', ownerName: 'Ahmed Al-Rashid', ownerType: 'student', ownerId: 'STU001', status: 'verified', uploadDate: '2024-01-15', expiryDate: '2029-06-20', fileSize: '2.4 MB', reviewedBy: 'Sarah Johnson', reviewNote: 'Valid passport, all pages clear', priority: 'normal' },
  { id: 'DOC002', name: 'Fatima_Transcript_BSc.pdf', type: 'Academic Transcript', ownerName: 'Fatima Hassan', ownerType: 'student', ownerId: 'STU002', status: 'pending', uploadDate: '2024-02-20', expiryDate: null, fileSize: '1.8 MB', reviewedBy: null, reviewNote: null, priority: 'urgent' },
  { id: 'DOC003', name: 'Mohamed_IELTS_Score.pdf', type: 'IELTS Certificate', ownerName: 'Mohamed Youssef', ownerType: 'student', ownerId: 'STU003', status: 'verified', uploadDate: '2024-01-10', expiryDate: '2026-01-10', fileSize: '980 KB', reviewedBy: 'Sarah Johnson', reviewNote: 'Overall band 7.0', priority: 'normal' },
  { id: 'DOC004', name: 'Zara_BankStatement_Q4.pdf', type: 'Bank Statement', ownerName: 'Zara Khan', ownerType: 'student', ownerId: 'STU004', status: 'expired', uploadDate: '2023-08-15', expiryDate: '2024-02-15', fileSize: '3.1 MB', reviewedBy: 'David Chen', reviewNote: 'Statement older than 6 months', priority: 'high' },
  { id: 'DOC005', name: 'Ali_OfferLetter_UCL.pdf', type: 'Offer Letter', ownerName: 'Ali Mahmoud', ownerType: 'student', ownerId: 'STU005', status: 'verified', uploadDate: '2024-03-01', expiryDate: '2024-09-01', fileSize: '1.2 MB', reviewedBy: 'Sarah Johnson', reviewNote: 'Unconditional offer confirmed', priority: 'normal' },
  { id: 'DOC006', name: 'Omar_VisaApproval.pdf', type: 'Visa Document', ownerName: 'Omar Siddiqui', ownerType: 'student', ownerId: 'STU006', status: 'pending', uploadDate: '2024-03-10', expiryDate: null, fileSize: '750 KB', reviewedBy: null, reviewNote: null, priority: 'urgent' },
  { id: 'DOC007', name: 'GlobalEdu_NID_Director.pdf', type: 'NID', ownerName: 'Raj Patel', ownerType: 'partner', ownerId: 'PTR001', status: 'verified', uploadDate: '2024-01-22', expiryDate: null, fileSize: '1.1 MB', reviewedBy: 'David Chen', reviewNote: 'National ID verified', priority: 'normal' },
  { id: 'DOC008', name: 'StudyBridge_EmploymentContract.pdf', type: 'Employment Contract', ownerName: 'Layla Noor', ownerType: 'employee', ownerId: 'EMP001', status: 'pending', uploadDate: '2024-03-05', expiryDate: null, fileSize: '2.0 MB', reviewedBy: null, reviewNote: null, priority: 'normal' },
  { id: 'DOC009', name: 'Sara_Passport_Renewal.pdf', type: 'Passport', ownerName: 'Sara Ahmed', ownerType: 'student', ownerId: 'STU007', status: 'rejected', uploadDate: '2024-02-28', expiryDate: null, fileSize: '1.5 MB', reviewedBy: 'Sarah Johnson', reviewNote: 'Passport image is blurry, please re-upload a clear scan', priority: 'high' },
  { id: 'DOC010', name: 'EduFirst_BankStatement.pdf', type: 'Bank Statement', ownerName: 'Hassan Ali', ownerType: 'partner', ownerId: 'PTR002', status: 'pending', uploadDate: '2024-03-12', expiryDate: '2024-09-12', fileSize: '2.8 MB', reviewedBy: null, reviewNote: null, priority: 'urgent' },
  { id: 'DOC011', name: 'Nadia_IELTS_Retest.pdf', type: 'IELTS Certificate', ownerName: 'Nadia Bek', ownerType: 'student', ownerId: 'STU008', status: 'expired', uploadDate: '2022-06-15', expiryDate: '2024-06-15', fileSize: '890 KB', reviewedBy: 'David Chen', reviewNote: 'IELTS expired, student needs retake', priority: 'high' },
  { id: 'DOC012', name: 'Yusuf_Transcript_MSc.pdf', type: 'Academic Transcript', ownerName: 'Yusuf Karim', ownerType: 'student', ownerId: 'STU009', status: 'verified', uploadDate: '2024-02-14', expiryDate: null, fileSize: '2.2 MB', reviewedBy: 'Sarah Johnson', reviewNote: 'MSc transcript from Cairo University verified', priority: 'normal' },
  { id: 'DOC013', name: 'Maria_OfferLetter_KCL.pdf', type: 'Offer Letter', ownerName: 'Maria Santos', ownerType: 'student', ownerId: 'STU010', status: 'pending', uploadDate: '2024-03-15', expiryDate: '2024-08-15', fileSize: '1.3 MB', reviewedBy: null, reviewNote: null, priority: 'normal' },
  { id: 'DOC014', name: 'Tariq_EmploymentContract.pdf', type: 'Employment Contract', ownerName: 'Tariq Rahman', ownerType: 'employee', ownerId: 'EMP002', status: 'verified', uploadDate: '2024-01-05', expiryDate: '2025-01-05', fileSize: '1.7 MB', reviewedBy: 'David Chen', reviewNote: 'Contract terms verified', priority: 'normal' },
  { id: 'DOC015', name: 'Amira_Visa_CAS.pdf', type: 'Visa Document', ownerName: 'Amira Tarek', ownerType: 'student', ownerId: 'STU011', status: 'pending', uploadDate: '2024-03-18', expiryDate: null, fileSize: '620 KB', reviewedBy: null, reviewNote: null, priority: 'urgent' },
  { id: 'DOC016', name: 'Karim_NID_Cairo.pdf', type: 'NID', ownerName: 'Karim Moustafa', ownerType: 'student', ownerId: 'STU012', status: 'rejected', uploadDate: '2024-02-10', expiryDate: null, fileSize: '1.0 MB', reviewedBy: 'Sarah Johnson', reviewNote: 'NID is not the latest version, please provide updated document', priority: 'normal' },
  { id: 'DOC017', name: 'Leila_BankStatement_Mar2024.pdf', type: 'Bank Statement', ownerName: 'Leila Farouk', ownerType: 'student', ownerId: 'STU013', status: 'pending', uploadDate: '2024-03-20', expiryDate: '2024-09-20', fileSize: '3.4 MB', reviewedBy: null, reviewNote: null, priority: 'normal' },
  { id: 'DOC018', name: 'PremierEdu_Partnership_Cert.pdf', type: 'Other', ownerName: 'Premier Education', ownerType: 'partner', ownerId: 'PTR003', status: 'verified', uploadDate: '2024-01-30', expiryDate: '2025-01-30', fileSize: '1.4 MB', reviewedBy: 'David Chen', reviewNote: 'Partnership certificate verified', priority: 'normal' },
]

const initialDocTypeConfigs: DocumentTypeConfig[] = [
  { id: 'DTC001', name: 'Passport', requiredFor: ['student'], isRequired: true, autoExpire: true, expiryPeriod: 5, expiryUnit: 'years' },
  { id: 'DTC002', name: 'Academic Transcript', requiredFor: ['student'], isRequired: true, autoExpire: false, expiryPeriod: null, expiryUnit: 'years' },
  { id: 'DTC003', name: 'IELTS Certificate', requiredFor: ['student'], isRequired: true, autoExpire: true, expiryPeriod: 2, expiryUnit: 'years' },
  { id: 'DTC004', name: 'Bank Statement', requiredFor: ['student'], isRequired: true, autoExpire: true, expiryPeriod: 6, expiryUnit: 'months' },
  { id: 'DTC005', name: 'Offer Letter', requiredFor: ['student'], isRequired: true, autoExpire: true, expiryPeriod: 6, expiryUnit: 'months' },
  { id: 'DTC006', name: 'Visa Document', requiredFor: ['student'], isRequired: true, autoExpire: true, expiryPeriod: 1, expiryUnit: 'years' },
  { id: 'DTC007', name: 'Employment Contract', requiredFor: ['employee'], isRequired: true, autoExpire: true, expiryPeriod: 1, expiryUnit: 'years' },
  { id: 'DTC008', name: 'NID', requiredFor: ['student', 'partner', 'employee'], isRequired: true, autoExpire: false, expiryPeriod: null, expiryUnit: 'years' },
  { id: 'DTC009', name: 'Other', requiredFor: ['student', 'partner', 'employee'], isRequired: false, autoExpire: false, expiryPeriod: null, expiryUnit: 'years' },
]

// Status config
const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  verified: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Verified' },
  pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
  rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
  expired: { color: 'bg-gray-50 text-gray-600 border-gray-200', icon: <AlertTriangle className="h-3 w-3" />, label: 'Expired' },
}

const ownerTypeConfig: Record<string, { color: string; label: string }> = {
  student: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Student' },
  partner: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Partner' },
  employee: { color: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Employee' },
}

const allDocTypes: DocumentType[] = ['Passport', 'Academic Transcript', 'IELTS Certificate', 'Bank Statement', 'Offer Letter', 'Visa Document', 'Employment Contract', 'NID', 'Other']

export default function CRMDocuments() {
  const [documents, setDocuments] = useState<CRMDocument[]>([])
  const [docTypeConfigs, setDocTypeConfigs] = useState<DocumentTypeConfig[]>(initialDocTypeConfigs)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/documents')
        if (res.ok) {
          const data = await res.json()
          setDocuments(data.documents || [])
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailDoc, setDetailDoc] = useState<CRMDocument | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [verifyNoteDialogOpen, setVerifyNoteDialogOpen] = useState(false)
  const [rejectNoteDialogOpen, setRejectNoteDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [actionTargetIds, setActionTargetIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('library')

  // Document Type Settings Dialog
  const [docTypeDialogOpen, setDocTypeDialogOpen] = useState(false)
  const [editingDocType, setEditingDocType] = useState<DocumentTypeConfig | null>(null)
  const [newDocType, setNewDocType] = useState({ name: '', requiredFor: [] as string[], isRequired: false, autoExpire: false, expiryPeriod: 12, expiryUnit: 'months' as 'days' | 'months' | 'years' })

  // Stats
  const stats = useMemo(() => ({
    total: documents.length,
    verified: documents.filter(d => d.status === 'verified').length,
    pending: documents.filter(d => d.status === 'pending').length,
    expired: documents.filter(d => d.status === 'expired').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  }), [documents])

  // Filtered documents for library
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchTerm === '' ||
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || doc.type === typeFilter
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      const matchesOwnerType = ownerTypeFilter === 'all' || doc.ownerType === ownerTypeFilter
      return matchesSearch && matchesType && matchesStatus && matchesOwnerType
    })
  }, [documents, searchTerm, typeFilter, statusFilter, ownerTypeFilter])

  // Pending documents
  const pendingDocuments = useMemo(() => {
    const now = new Date()
    return documents
      .filter(d => d.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }, [documents])

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)))
    }
  }

  // Bulk verify
  const handleBulkVerify = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select documents to verify')
      return
    }
    setActionTargetIds(Array.from(selectedIds))
    setNoteText('')
    setVerifyNoteDialogOpen(true)
  }

  const handleBulkReject = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select documents to reject')
      return
    }
    setActionTargetIds(Array.from(selectedIds))
    setNoteText('')
    setRejectNoteDialogOpen(true)
  }

  const confirmVerify = () => {
    setDocuments(prev => prev.map(d =>
      actionTargetIds.includes(d.id) ? { ...d, status: 'verified' as const, reviewedBy: 'Admin', reviewNote: noteText || 'Bulk verified' } : d
    ))
    toast.success(`${actionTargetIds.length} document(s) verified successfully`)
    setSelectedIds(new Set())
    setVerifyNoteDialogOpen(false)
    setNoteText('')
  }

  const confirmReject = () => {
    setDocuments(prev => prev.map(d =>
      actionTargetIds.includes(d.id) ? { ...d, status: 'rejected' as const, reviewedBy: 'Admin', reviewNote: noteText || 'Bulk rejected' } : d
    ))
    toast.success(`${actionTargetIds.length} document(s) rejected`)
    setSelectedIds(new Set())
    setRejectNoteDialogOpen(false)
    setNoteText('')
  }

  // Single document actions
  const handleApproveDoc = (docId: string) => {
    setActionTargetIds([docId])
    setNoteText('')
    setVerifyNoteDialogOpen(true)
  }

  const handleRejectDoc = (docId: string) => {
    setActionTargetIds([docId])
    setNoteText('')
    setRejectNoteDialogOpen(true)
  }

  const openDetail = (doc: CRMDocument) => {
    setDetailDoc(doc)
    setDetailOpen(true)
  }

  // Document type settings
  const openAddDocType = () => {
    setEditingDocType(null)
    setNewDocType({ name: '', requiredFor: [], isRequired: false, autoExpire: false, expiryPeriod: 12, expiryUnit: 'months' })
    setDocTypeDialogOpen(true)
  }

  const openEditDocType = (dt: DocumentTypeConfig) => {
    setEditingDocType(dt)
    setNewDocType({
      name: dt.name,
      requiredFor: dt.requiredFor,
      isRequired: dt.isRequired,
      autoExpire: dt.autoExpire,
      expiryPeriod: dt.expiryPeriod || 12,
      expiryUnit: dt.expiryUnit,
    })
    setDocTypeDialogOpen(true)
  }

  const saveDocType = () => {
    if (!newDocType.name.trim()) {
      toast.error('Document type name is required')
      return
    }
    if (editingDocType) {
      setDocTypeConfigs(prev => prev.map(dt =>
        dt.id === editingDocType.id
          ? { ...dt, name: newDocType.name, requiredFor: newDocType.requiredFor as DocumentTypeConfig['requiredFor'], isRequired: newDocType.isRequired, autoExpire: newDocType.autoExpire, expiryPeriod: newDocType.autoExpire ? newDocType.expiryPeriod : null, expiryUnit: newDocType.expiryUnit }
          : dt
      ))
      toast.success('Document type updated')
    } else {
      const newConfig: DocumentTypeConfig = {
        id: `DTC${Date.now()}`,
        name: newDocType.name,
        requiredFor: newDocType.requiredFor as DocumentTypeConfig['requiredFor'],
        isRequired: newDocType.isRequired,
        autoExpire: newDocType.autoExpire,
        expiryPeriod: newDocType.autoExpire ? newDocType.expiryPeriod : null,
        expiryUnit: newDocType.expiryUnit,
      }
      setDocTypeConfigs(prev => [...prev, newConfig])
      toast.success('Document type added')
    }
    setDocTypeDialogOpen(false)
  }

  const deleteDocType = (id: string) => {
    setDocTypeConfigs(prev => prev.filter(dt => dt.id !== id))
    toast.success('Document type removed')
  }

  const toggleRequiredFor = (role: string) => {
    setNewDocType(prev => ({
      ...prev,
      requiredFor: prev.requiredFor.includes(role)
        ? prev.requiredFor.filter(r => r !== role)
        : [...prev.requiredFor, role]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#F37021]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-[#1A2332]">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#F37021]/10">
                <FileText className="h-5 w-5 text-[#F37021]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Verified</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.verified}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Review</p>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <AlertTriangle className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1A2332]/5">
          <TabsTrigger value="library" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Document Library
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Pending Verification
            {stats.pending > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white">
            <FileCheck className="h-4 w-4 mr-2" />
            Document Types
          </TabsTrigger>
        </TabsList>

        {/* Document Library Tab */}
        <TabsContent value="library" className="mt-4 space-y-4">
          {/* Search & Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by document name or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {allDocTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Owner Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-[#F37021]/5 rounded-lg border border-[#F37021]/20">
                  <span className="text-sm font-medium text-[#1A2332]">{selectedIds.size} selected</span>
                  <Separator orientation="vertical" className="h-5" />
                  <Button size="sm" onClick={handleBulkVerify} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Verify
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1A2332]/5 hover:bg-[#1A2332]/5">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Document Name</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Owner</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Upload Date</TableHead>
                      <TableHead className="font-semibold">Expiry Date</TableHead>
                      <TableHead className="font-semibold w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No documents found matching your criteria</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map(doc => (
                        <TableRow key={doc.id} className={selectedIds.has(doc.id) ? 'bg-[#F37021]/5' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(doc.id)}
                              onCheckedChange={() => toggleSelect(doc.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#F37021] flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-[#1A2332] truncate max-w-[200px]">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.fileSize}</p>
                              </div>
                              {doc.priority === 'urgent' && (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal">{doc.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{doc.ownerName}</p>
                              <Badge variant="outline" className={`text-[10px] mt-0.5 ${ownerTypeConfig[doc.ownerType].color}`}>
                                {ownerTypeConfig[doc.ownerType].label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${statusConfig[doc.status].color}`}>
                              <span className="mr-1">{statusConfig[doc.status].icon}</span>
                              {statusConfig[doc.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{doc.uploadDate}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doc.expiryDate || <span className="text-gray-400">N/A</span>}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => openDetail(doc)}>
                              <Eye className="h-4 w-4 text-[#0066CC]" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredDocuments.length > 0 && (
                <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                  Showing {filteredDocuments.length} of {documents.length} documents
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Verification Tab */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p className="text-lg font-medium text-[#1A2332]">All Clear!</p>
                <p className="text-sm text-muted-foreground">No documents pending verification</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingDocuments.map(doc => (
                <Card key={doc.id} className={`relative overflow-hidden ${doc.priority === 'urgent' ? 'border-red-200 border-2' : doc.priority === 'high' ? 'border-amber-200' : ''}`}>
                  {doc.priority === 'urgent' && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                  )}
                  {doc.priority === 'high' && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${doc.priority === 'urgent' ? 'bg-red-50' : doc.priority === 'high' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                          <FileText className={`h-5 w-5 ${doc.priority === 'urgent' ? 'text-red-600' : doc.priority === 'high' ? 'text-amber-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-semibold text-[#1A2332] truncate">{doc.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.type}</p>
                        </div>
                      </div>
                      {doc.priority === 'urgent' && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] flex-shrink-0">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Owner</span>
                        <span className="font-medium text-[#1A2332]">{doc.ownerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <Badge variant="outline" className={`text-[10px] ${ownerTypeConfig[doc.ownerType].color}`}>
                          {ownerTypeConfig[doc.ownerType].label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Uploaded</span>
                        <span className="text-[#1A2332]">{doc.uploadDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Size</span>
                        <span className="text-[#1A2332]">{doc.fileSize}</span>
                      </div>
                      {doc.expiryDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expires</span>
                          <span className="text-[#1A2332]">{doc.expiryDate}</span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApproveDoc(doc.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRejectDoc(doc.id)}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(doc)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Document Types Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#1A2332]">Document Type Configurations</h3>
              <p className="text-sm text-muted-foreground">Manage document requirements and expiry settings</p>
            </div>
            <Button onClick={openAddDocType} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Document Type
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1A2332]/5 hover:bg-[#1A2332]/5">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Required For</TableHead>
                      <TableHead className="font-semibold">Is Required</TableHead>
                      <TableHead className="font-semibold">Auto-Expire</TableHead>
                      <TableHead className="font-semibold">Expiry Period</TableHead>
                      <TableHead className="font-semibold w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docTypeConfigs.map(dt => (
                      <TableRow key={dt.id}>
                        <TableCell className="font-medium text-[#1A2332]">{dt.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dt.requiredFor.map(role => (
                              <Badge key={role} variant="outline" className={`text-[10px] ${ownerTypeConfig[role].color}`}>
                                {ownerTypeConfig[role].label}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={dt.isRequired ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                            {dt.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={dt.autoExpire ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                            {dt.autoExpire ? 'Auto-Expire' : 'No Expiry'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dt.autoExpire && dt.expiryPeriod ? `${dt.expiryPeriod} ${dt.expiryUnit}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDocType(dt)}>
                              <Edit2 className="h-3.5 w-3.5 text-[#0066CC]" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteDocType(dt.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A2332]">
              <FileText className="h-5 w-5 text-[#F37021]" />
              Document Details
            </DialogTitle>
          </DialogHeader>
          {detailDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Document Name</Label>
                  <p className="text-sm font-medium text-[#1A2332] mt-0.5 break-all">{detailDoc.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="text-sm font-medium text-[#1A2332] mt-0.5">{detailDoc.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Owner</Label>
                  <p className="text-sm font-medium text-[#1A2332] mt-0.5">{detailDoc.ownerName}</p>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${ownerTypeConfig[detailDoc.ownerType].color}`}>
                    {ownerTypeConfig[detailDoc.ownerType].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-0.5">
                    <Badge variant="outline" className={`${statusConfig[detailDoc.status].color}`}>
                      <span className="mr-1">{statusConfig[detailDoc.status].icon}</span>
                      {statusConfig[detailDoc.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Upload Date</Label>
                  <p className="text-sm text-[#1A2332] mt-0.5">{detailDoc.uploadDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                  <p className="text-sm text-[#1A2332] mt-0.5">{detailDoc.expiryDate || 'No expiry'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">File Size</Label>
                  <p className="text-sm text-[#1A2332] mt-0.5">{detailDoc.fileSize}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                  <p className="text-sm text-[#1A2332] mt-0.5">{detailDoc.reviewedBy || 'Not reviewed'}</p>
                </div>
              </div>
              {detailDoc.reviewNote && (
                <div>
                  <Label className="text-xs text-muted-foreground">Review Note</Label>
                  <p className="text-sm text-[#1A2332] mt-0.5 p-2 bg-gray-50 rounded-md">{detailDoc.reviewNote}</p>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                {detailDoc.status === 'pending' && (
                  <>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { handleApproveDoc(detailDoc.id); setDetailOpen(false) }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => { handleRejectDoc(detailDoc.id); setDetailOpen(false) }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => toast.info('Download feature: ' + detailDoc.name)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Note Dialog */}
      <Dialog open={verifyNoteDialogOpen} onOpenChange={setVerifyNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              Verify Document(s)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are verifying {actionTargetIds.length} document(s). Add an optional note:
            </p>
            <div>
              <Label>Verification Note</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about the verification..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmVerify} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Note Dialog */}
      <Dialog open={rejectNoteDialogOpen} onOpenChange={setRejectNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Reject Document(s)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are rejecting {actionTargetIds.length} document(s). Please provide a reason:
            </p>
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Explain why the document is being rejected..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectNoteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Document Type Dialog */}
      <Dialog open={docTypeDialogOpen} onOpenChange={setDocTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">
              {editingDocType ? 'Edit Document Type' : 'Add Document Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type Name</Label>
              <Input
                value={newDocType.name}
                onChange={(e) => setNewDocType(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Medical Certificate"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Required For</Label>
              <div className="flex gap-3 mt-2">
                {['student', 'partner', 'employee'].map(role => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={newDocType.requiredFor.includes(role)}
                      onCheckedChange={() => toggleRequiredFor(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm font-normal capitalize cursor-pointer">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Is Required</Label>
                <p className="text-xs text-muted-foreground">Documents of this type must be uploaded</p>
              </div>
              <Switch
                checked={newDocType.isRequired}
                onCheckedChange={(checked) => setNewDocType(prev => ({ ...prev, isRequired: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Expire</Label>
                <p className="text-xs text-muted-foreground">Documents of this type have an expiry date</p>
              </div>
              <Switch
                checked={newDocType.autoExpire}
                onCheckedChange={(checked) => setNewDocType(prev => ({ ...prev, autoExpire: checked }))}
              />
            </div>

            {newDocType.autoExpire && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Expiry Period</Label>
                  <Input
                    type="number"
                    value={newDocType.expiryPeriod}
                    onChange={(e) => setNewDocType(prev => ({ ...prev, expiryPeriod: parseInt(e.target.value) || 0 }))}
                    min={1}
                    className="mt-1"
                  />
                </div>
                <Select value={newDocType.expiryUnit} onValueChange={(v) => setNewDocType(prev => ({ ...prev, expiryUnit: v as 'days' | 'months' | 'years' }))}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDocType} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
              {editingDocType ? 'Save Changes' : 'Add Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
