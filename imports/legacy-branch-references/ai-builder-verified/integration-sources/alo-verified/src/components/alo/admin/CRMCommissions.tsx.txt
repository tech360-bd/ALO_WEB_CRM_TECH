'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import {
  Wallet, DollarSign, CheckCircle2, AlertTriangle, Search, Filter,
  Download, Eye, ArrowRight, Clock, Calendar, FileText, MessageSquare,
  TrendingUp, PieChart, BarChart3, Settings, Users, ChevronRight,
  CircleDot, CircleCheck, CircleX, CirclePause, Send, CreditCard,
  Shield, Zap, ArrowUpRight, ArrowDownRight, Plus, CheckSquare, X
} from 'lucide-react'
import { toast } from 'sonner'

// --- Types ---
type CommissionStatus = 'pending_calculation' | 'calculated' | 'partner_notified' | 'partner_claimed' | 'under_review' | 'approved' | 'partially_paid' | 'fully_paid' | 'disputed' | 'cancelled'
type TriggerStage = 'application_submitted' | 'conditional_offer' | 'unconditional_offer' | 'cas_issued' | 'visa_approved' | 'visa_refused' | 'enrolment_confirmed'
type PartnerType = 'TYPE1' | 'TYPE2'

interface Commission {
  id: string; commissionId: string; amount: number; currency: string
  triggerStage: TriggerStage; status: CommissionStatus; partnerType: PartnerType
  partnerName: string; studentName: string; universityName: string
  createdAt: string; updatedAt: string; rate: number
  statusHistory: { status: CommissionStatus; date: string; note: string }[]
  completedTriggers: TriggerStage[]
  payments: { id: string; amount: number; date: string; method: string; ref: string }[]
  notes: { id: string; text: string; author: string; date: string }[]
}

// --- Helpers ---
const STATUS_COLORS: Record<CommissionStatus, string> = {
  pending_calculation: 'bg-amber-100 text-amber-700', calculated: 'bg-blue-100 text-blue-700',
  partner_notified: 'bg-cyan-100 text-cyan-700', partner_claimed: 'bg-purple-100 text-purple-700',
  under_review: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700',
  partially_paid: 'bg-orange-100 text-orange-700', fully_paid: 'bg-emerald-100 text-emerald-700',
  disputed: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-700'
}
const STATUS_DOT: Record<CommissionStatus, string> = {
  pending_calculation: 'bg-amber-500', calculated: 'bg-blue-500',
  partner_notified: 'bg-cyan-500', partner_claimed: 'bg-purple-500',
  under_review: 'bg-yellow-500', approved: 'bg-green-500',
  partially_paid: 'bg-orange-500', fully_paid: 'bg-emerald-500',
  disputed: 'bg-red-500', cancelled: 'bg-gray-500'
}
const TRIGGER_LABELS: Record<TriggerStage, string> = {
  application_submitted: 'Application', conditional_offer: 'Conditional',
  unconditional_offer: 'Unconditional', cas_issued: 'CAS', visa_approved: 'Visa ✓',
  visa_refused: 'Visa ✗', enrolment_confirmed: 'Enrolled'
}
const STATUS_LABELS: Record<CommissionStatus, string> = {
  pending_calculation: 'Pending Calc', calculated: 'Calculated',
  partner_notified: 'Notified', partner_claimed: 'Claimed',
  under_review: 'Under Review', approved: 'Approved',
  partially_paid: 'Partial Paid', fully_paid: 'Fully Paid',
  disputed: 'Disputed', cancelled: 'Cancelled'
}
const STATUS_ACTION: Record<CommissionStatus, { label: string; icon: React.ElementType; color: string } | null> = {
  pending_calculation: { label: 'Calculate', icon: Zap, color: 'bg-amber-600' },
  calculated: { label: 'Notify Partner', icon: Send, color: 'bg-cyan-600' },
  partner_claimed: { label: 'Review & Approve', icon: Shield, color: 'bg-purple-600' },
  approved: { label: 'Process Payment', icon: CreditCard, color: 'bg-green-600' },
  disputed: { label: 'Resolve Dispute', icon: AlertTriangle, color: 'bg-red-600' },
  partner_notified: null, under_review: null, partially_paid: null, fully_paid: null, cancelled: null
}

// --- Mock Data ---
const MOCK_PARTNERS = [
  { id: 'P001', name: 'EduBridge Bangladesh', type: 'TYPE1' as PartnerType, rate: 15, totalEarned: 245000, pending: 45000, paid: 200000 },
  { id: 'P002', name: 'Global Study Links', type: 'TYPE2' as PartnerType, rate: 12, totalEarned: 180000, pending: 30000, paid: 150000 },
  { id: 'P003', name: 'Campus Connect UK', type: 'TYPE1' as PartnerType, rate: 10, totalEarned: 320000, pending: 55000, paid: 265000 },
  { id: 'P004', name: 'VisaFirst Consultancy', type: 'TYPE2' as PartnerType, rate: 18, totalEarned: 95000, pending: 20000, paid: 75000 },
  { id: 'P005', name: 'DreamEd International', type: 'TYPE1' as PartnerType, rate: 14, totalEarned: 156000, pending: 38000, paid: 118000 },
]

const makeHistory = (statuses: CommissionStatus[], start: string): Commission['statusHistory'] =>
  statuses.map((s, i) => ({ status: s, date: new Date(Date.now() - (statuses.length - i) * 86400000 * 3).toISOString(), note: `Moved to ${s.replace(/_/g, ' ')}` }))

const MOCK_COMMISSIONS: Commission[] = [
  { id: '1', commissionId: 'COM-2024-001', amount: 45000, currency: 'BDT', triggerStage: 'enrolment_confirmed', status: 'fully_paid', partnerType: 'TYPE1', partnerName: 'EduBridge Bangladesh', studentName: 'Tanvir Ahmed', universityName: 'University of Birmingham', createdAt: '2024-01-15', updatedAt: '2024-03-20', rate: 15, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved','partially_paid','fully_paid'], '2024-01-15'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved','enrolment_confirmed'], payments: [{ id: 'PAY-001', amount: 20000, date: '2024-03-01', method: 'Bank Transfer', ref: 'TXN-78901' },{ id: 'PAY-002', amount: 25000, date: '2024-03-20', method: 'Bank Transfer', ref: 'TXN-78902' }], notes: [{ id: 'n1', text: 'Full payment completed', author: 'Admin', date: '2024-03-20' }] },
  { id: '2', commissionId: 'COM-2024-002', amount: 32000, currency: 'BDT', triggerStage: 'visa_approved', status: 'approved', partnerType: 'TYPE2', partnerName: 'Global Study Links', studentName: 'Fatima Khan', universityName: 'Manchester Met University', createdAt: '2024-01-22', updatedAt: '2024-03-15', rate: 12, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved'], '2024-01-22'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved'], payments: [], notes: [] },
  { id: '3', commissionId: 'COM-2024-003', amount: 28000, currency: 'BDT', triggerStage: 'cas_issued', status: 'under_review', partnerType: 'TYPE1', partnerName: 'Campus Connect UK', studentName: 'Rahul Sharma', universityName: 'University of Leeds', createdAt: '2024-02-01', updatedAt: '2024-03-10', rate: 10, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review'], '2024-02-01'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued'], payments: [], notes: [{ id: 'n2', text: 'Awaiting manager approval', author: 'Finance', date: '2024-03-10' }] },
  { id: '4', commissionId: 'COM-2024-004', amount: 55000, currency: 'BDT', triggerStage: 'enrolment_confirmed', status: 'partially_paid', partnerType: 'TYPE1', partnerName: 'EduBridge Bangladesh', studentName: 'Priya Patel', universityName: 'University of Sheffield', createdAt: '2024-02-10', updatedAt: '2024-03-22', rate: 15, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved','partially_paid'], '2024-02-10'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved','enrolment_confirmed'], payments: [{ id: 'PAY-003', amount: 25000, date: '2024-03-15', method: 'Bank Transfer', ref: 'TXN-34567' }], notes: [] },
  { id: '5', commissionId: 'COM-2024-005', amount: 18000, currency: 'BDT', triggerStage: 'conditional_offer', status: 'disputed', partnerType: 'TYPE2', partnerName: 'VisaFirst Consultancy', studentName: 'Ahmed Hassan', universityName: 'Coventry University', createdAt: '2024-02-15', updatedAt: '2024-03-18', rate: 18, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','disputed'], '2024-02-15'), completedTriggers: ['application_submitted','conditional_offer'], payments: [], notes: [{ id: 'n3', text: 'Partner disputes commission rate', author: 'Partner', date: '2024-03-18' }] },
  { id: '6', commissionId: 'COM-2024-006', amount: 38000, currency: 'BDT', triggerStage: 'visa_approved', status: 'partner_claimed', partnerType: 'TYPE1', partnerName: 'DreamEd International', studentName: 'Nusrat Jahan', universityName: 'University of Nottingham', createdAt: '2024-02-20', updatedAt: '2024-03-12', rate: 14, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed'], '2024-02-20'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved'], payments: [], notes: [] },
  { id: '7', commissionId: 'COM-2024-007', amount: 22000, currency: 'BDT', triggerStage: 'application_submitted', status: 'pending_calculation', partnerType: 'TYPE2', partnerName: 'Global Study Links', studentName: 'Sakib Al Hasan', universityName: 'Brunel University', createdAt: '2024-03-01', updatedAt: '2024-03-01', rate: 12, statusHistory: makeHistory(['pending_calculation'], '2024-03-01'), completedTriggers: ['application_submitted'], payments: [], notes: [] },
  { id: '8', commissionId: 'COM-2024-008', amount: 41000, currency: 'BDT', triggerStage: 'unconditional_offer', status: 'calculated', partnerType: 'TYPE1', partnerName: 'Campus Connect UK', studentName: 'Mithila Rahman', universityName: 'Aston University', createdAt: '2024-03-05', updatedAt: '2024-03-08', rate: 10, statusHistory: makeHistory(['pending_calculation','calculated'], '2024-03-05'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer'], payments: [], notes: [] },
  { id: '9', commissionId: 'COM-2024-009', amount: 60000, currency: 'BDT', triggerStage: 'enrolment_confirmed', status: 'fully_paid', partnerType: 'TYPE1', partnerName: 'EduBridge Bangladesh', studentName: 'Karim Benzema', universityName: 'University of Bristol', createdAt: '2024-01-05', updatedAt: '2024-02-28', rate: 15, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved','partially_paid','fully_paid'], '2024-01-05'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved','enrolment_confirmed'], payments: [{ id: 'PAY-004', amount: 30000, date: '2024-02-10', method: 'Bank Transfer', ref: 'TXN-11223' },{ id: 'PAY-005', amount: 30000, date: '2024-02-28', method: 'Bank Transfer', ref: 'TXN-11224' }], notes: [] },
  { id: '10', commissionId: 'COM-2024-010', amount: 35000, currency: 'BDT', triggerStage: 'cas_issued', status: 'cancelled', partnerType: 'TYPE2', partnerName: 'VisaFirst Consultancy', studentName: 'Lina Molla', universityName: 'University of Hertfordshire', createdAt: '2024-02-08', updatedAt: '2024-03-01', rate: 18, statusHistory: makeHistory(['pending_calculation','calculated','cancelled'], '2024-02-08'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued'], payments: [], notes: [{ id: 'n4', text: 'Student withdrew application', author: 'Admin', date: '2024-03-01' }] },
  { id: '11', commissionId: 'COM-2024-011', amount: 25000, currency: 'BDT', triggerStage: 'partner_notified', status: 'partner_notified', partnerType: 'TYPE1', partnerName: 'DreamEd International', studentName: 'Riya Sen', universityName: 'Goldsmiths University', createdAt: '2024-03-10', updatedAt: '2024-03-14', rate: 14, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified'], '2024-03-10'), completedTriggers: ['application_submitted','conditional_offer'], payments: [], notes: [] },
  { id: '12', commissionId: 'COM-2024-012', amount: 48000, currency: 'BDT', triggerStage: 'visa_approved', status: 'approved', partnerType: 'TYPE1', partnerName: 'EduBridge Bangladesh', studentName: 'Arif Hossain', universityName: 'University of Southampton', createdAt: '2024-02-12', updatedAt: '2024-03-20', rate: 15, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved'], '2024-02-12'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved'], payments: [], notes: [] },
  { id: '13', commissionId: 'COM-2024-013', amount: 20000, currency: 'BDT', triggerStage: 'visa_refused', status: 'disputed', partnerType: 'TYPE2', partnerName: 'Global Study Links', studentName: 'Tania Akter', universityName: 'University of Essex', createdAt: '2024-02-18', updatedAt: '2024-03-16', rate: 12, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','disputed'], '2024-02-18'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_refused'], payments: [], notes: [{ id: 'n5', text: 'Visa refused - partial reversal requested', author: 'Partner', date: '2024-03-16' }] },
  { id: '14', commissionId: 'COM-2024-014', amount: 52000, currency: 'BDT', triggerStage: 'enrolment_confirmed', status: 'partner_claimed', partnerType: 'TYPE1', partnerName: 'Campus Connect UK', studentName: 'Imran Khan', universityName: 'University of Liverpool', createdAt: '2024-02-25', updatedAt: '2024-03-18', rate: 10, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed'], '2024-02-25'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved','enrolment_confirmed'], payments: [], notes: [] },
  { id: '15', commissionId: 'COM-2024-015', amount: 15000, currency: 'BDT', triggerStage: 'application_submitted', status: 'pending_calculation', partnerType: 'TYPE2', partnerName: 'VisaFirst Consultancy', studentName: 'Nadia Islam', universityName: 'University of Greenwich', createdAt: '2024-03-12', updatedAt: '2024-03-12', rate: 18, statusHistory: makeHistory(['pending_calculation'], '2024-03-12'), completedTriggers: ['application_submitted'], payments: [], notes: [] },
  { id: '16', commissionId: 'COM-2024-016', amount: 33000, currency: 'BDT', triggerStage: 'unconditional_offer', status: 'calculated', partnerType: 'TYPE1', partnerName: 'DreamEd International', studentName: 'Omar Faruk', universityName: 'University of Hull', createdAt: '2024-03-08', updatedAt: '2024-03-11', rate: 14, statusHistory: makeHistory(['pending_calculation','calculated'], '2024-03-08'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer'], payments: [], notes: [] },
  { id: '17', commissionId: 'COM-2024-017', amount: 44000, currency: 'BDT', triggerStage: 'visa_approved', status: 'under_review', partnerType: 'TYPE1', partnerName: 'EduBridge Bangladesh', studentName: 'Sadia Afrin', universityName: 'University of Leicester', createdAt: '2024-02-14', updatedAt: '2024-03-19', rate: 15, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review'], '2024-02-14'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved'], payments: [], notes: [] },
  { id: '18', commissionId: 'COM-2024-018', amount: 36000, currency: 'BDT', triggerStage: 'cas_issued', status: 'approved', partnerType: 'TYPE2', partnerName: 'Global Study Links', studentName: 'Zain Malik', universityName: 'London Met University', createdAt: '2024-02-20', updatedAt: '2024-03-21', rate: 12, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved'], '2024-02-20'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued'], payments: [], notes: [] },
  { id: '19', commissionId: 'COM-2024-019', amount: 27000, currency: 'BDT', triggerStage: 'conditional_offer', status: 'partner_notified', partnerType: 'TYPE1', partnerName: 'Campus Connect UK', studentName: 'Hassan Ali', universityName: 'Birmingham City Uni', createdAt: '2024-03-02', updatedAt: '2024-03-15', rate: 10, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified'], '2024-03-02'), completedTriggers: ['application_submitted','conditional_offer'], payments: [], notes: [] },
  { id: '20', commissionId: 'COM-2024-020', amount: 50000, currency: 'BDT', triggerStage: 'enrolment_confirmed', status: 'fully_paid', partnerType: 'TYPE1', partnerName: 'EduBridge Bangladesh', studentName: 'Farhana Yesmin', universityName: 'University of Bath', createdAt: '2024-01-10', updatedAt: '2024-02-15', rate: 15, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved','fully_paid'], '2024-01-10'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved','enrolment_confirmed'], payments: [{ id: 'PAY-006', amount: 50000, date: '2024-02-15', method: 'Bank Transfer', ref: 'TXN-55667' }], notes: [] },
  { id: '21', commissionId: 'COM-2024-021', amount: 39000, currency: 'BDT', triggerStage: 'visa_approved', status: 'partially_paid', partnerType: 'TYPE2', partnerName: 'VisaFirst Consultancy', studentName: 'Kamal Uddin', universityName: 'University of Salford', createdAt: '2024-02-05', updatedAt: '2024-03-22', rate: 18, statusHistory: makeHistory(['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved','partially_paid'], '2024-02-05'), completedTriggers: ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved'], payments: [{ id: 'PAY-007', amount: 15000, date: '2024-03-10', method: 'Bank Transfer', ref: 'TXN-99881' }], notes: [] },
  { id: '22', commissionId: 'COM-2024-022', amount: 16000, currency: 'BDT', triggerStage: 'application_submitted', status: 'pending_calculation', partnerType: 'TYPE1', partnerName: 'DreamEd International', studentName: 'Mina Das', universityName: 'University of West London', createdAt: '2024-03-15', updatedAt: '2024-03-15', rate: 14, statusHistory: makeHistory(['pending_calculation'], '2024-03-15'), completedTriggers: ['application_submitted'], payments: [], notes: [] },
]

const MONTHLY_DATA = [
  { month: 'Sep', amount: 85000 }, { month: 'Oct', amount: 120000 }, { month: 'Nov', amount: 95000 },
  { month: 'Dec', amount: 140000 }, { month: 'Jan', amount: 175000 }, { month: 'Feb', amount: 210000 }, { month: 'Mar', amount: 155000 }
]
const TRIGGER_STAGES: TriggerStage[] = ['application_submitted','conditional_offer','unconditional_offer','cas_issued','visa_approved','visa_refused','enrolment_confirmed']
const ALL_STATUSES: CommissionStatus[] = ['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved','partially_paid','fully_paid','disputed','cancelled']

// --- Main Component ---
export default function CRMCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [commissionSummary, setCommissionSummary] = useState({ totalAmount: 0, pendingAmount: 0, paidAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [noteText, setNoteText] = useState('')
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [settings, setSettings] = useState({
    type1Rate: 15, type2Rate: 12, autoCalc: true, minPayout: 5000, paymentTerms: 30,
    triggers: { application_submitted: false, conditional_offer: false, unconditional_offer: false, cas_issued: true, visa_approved: true, visa_refused: true, enrolment_confirmed: true }
  })

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/commissions')
        if (res.ok) {
          const data = await res.json()
          setCommissions(data.commissions || [])
          setCommissionSummary(data.summary || { totalAmount: 0, pendingAmount: 0, paidAmount: 0 })
        }
      } catch (err) {
        console.error('Failed to fetch commissions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCommissions()
  }, [])

  const selected = commissions.find(c => c.id === selectedId) || null

  // Stats
  const totalAmt = commissionSummary.totalAmount || commissions.reduce((s, c) => s + c.amount, 0)
  const pendingAmt = commissionSummary.pendingAmount || commissions.filter(c => ['pending_calculation','calculated','partner_notified','partner_claimed','under_review','approved'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
  const paidAmt = commissionSummary.paidAmount || commissions.filter(c => ['partially_paid','fully_paid'].includes(c.status)).reduce((s, c) => s + c.payments.reduce((a, p) => a + p.amount, 0), 0)
  const disputedAmt = commissions.filter(c => c.status === 'disputed').reduce((s, c) => s + c.amount, 0)

  // Filters
  const filtered = commissions.filter(c => {
    if (searchTerm && !c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && !c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (typeFilter !== 'all' && c.partnerType !== typeFilter) return false
    if (triggerFilter !== 'all' && c.triggerStage !== triggerFilter) return false
    if (partnerFilter !== 'all' && c.partnerName !== partnerFilter) return false
    return true
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    setSelectedIds(next)
  }

  const handleAction = (c: Commission) => {
    const action = STATUS_ACTION[c.status]
    if (!action) return
    const nextStatuses: Record<CommissionStatus, CommissionStatus> = {
      pending_calculation: 'calculated', calculated: 'partner_notified', partner_claimed: 'under_review',
      approved: 'partially_paid', disputed: 'approved', partner_notified: 'partner_notified',
      under_review: 'under_review', partially_paid: 'partially_paid', fully_paid: 'fully_paid', cancelled: 'cancelled'
    }
    toast.success(`${action.label} completed for ${c.commissionId}`, { description: `Status changed to ${STATUS_LABELS[nextStatuses[c.status]].replace(/_/g, ' ')}` })
  }

  const handleBulkApprove = () => { toast.success(`${selectedIds.size} commissions approved`); setSelectedIds(new Set()) }
  const handleBulkPaid = () => { toast.success(`${selectedIds.size} commissions marked as paid`); setSelectedIds(new Set()) }
  const handleExportCSV = () => { toast.success('CSV exported successfully') }

  const addNote = () => { if (noteText.trim()) { toast.success('Note added'); setNoteText(''); setShowNoteDialog(false) } }
  const processPayment = () => { if (paymentAmount) { toast.success(`Payment of ৳${Number(paymentAmount).toLocaleString()} processed`); setPaymentAmount(''); setShowPaymentDialog(false) } }

  // Status distribution for pie
  const statusCounts = ALL_STATUSES.map(s => ({ status: s, count: commissions.filter(c => c.status === s).length })).filter(x => x.count > 0)

  // Activity feed
  const activityFeed = commissions.slice(0, 8).map(c => ({
    id: c.id, text: `${c.commissionId} — ${c.partnerName}: ${STATUS_LABELS[c.status]}`, time: c.updatedAt, status: c.status
  }))

  const maxMonthly = Math.max(...MONTHLY_DATA.map(m => m.amount))

  // --- Tab: Dashboard ---
  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Commissions', value: `৳${totalAmt.toLocaleString()}`, icon: Wallet, color: '#0066CC', bg: 'bg-blue-50' },
          { label: 'Pending Amount', value: `৳${pendingAmt.toLocaleString()}`, icon: Clock, color: '#F37021', bg: 'bg-amber-50' },
          { label: 'Paid Amount', value: `৳${paidAmt.toLocaleString()}`, icon: CheckCircle2, color: '#16a34a', bg: 'bg-green-50' },
          { label: 'Disputed Amount', value: `৳${disputedAmt.toLocaleString()}`, icon: AlertTriangle, color: '#dc2626', bg: 'bg-red-50' },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-lg font-bold text-[#1A2332]">{s.value}</p></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#F37021]" />Monthly Commission Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {MONTHLY_DATA.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-[#0066CC]/80 hover:bg-[#F37021] transition-colors" style={{ height: `${(m.amount / maxMonthly) * 100}%` }} />
                  <span className="text-[10px] text-gray-500">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><PieChart className="h-4 w-4 text-[#F37021]" />Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statusCounts.map(s => {
                const pct = commissions.length > 0 ? Math.round((s.count / commissions.length) * 100) : 0
                return (
                  <div key={s.status} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s.status]}`} />
                    <span className="text-xs text-gray-600 w-24 truncate">{STATUS_LABELS[s.status]}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${STATUS_DOT[s.status]}`} style={{ width: `${pct}%` }} /></div>
                    <span className="text-xs font-medium text-gray-700 w-6 text-right">{s.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332]">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {activityFeed.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedId(a.id); setActiveTab('detail') }}>
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[a.status]}`} />
                  <span className="text-sm text-gray-700 flex-1">{a.text}</span>
                  <span className="text-xs text-gray-400">{new Date(a.time).toLocaleDateString()}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  // --- Tab: All Commissions ---
  const AllCommissionsTab = () => (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search student/partner..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="TYPE1">TYPE1 (P→A)</SelectItem><SelectItem value="TYPE2">TYPE2 (A→P)</SelectItem></SelectContent></Select>
          <Select value={triggerFilter} onValueChange={setTriggerFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Trigger" /></SelectTrigger><SelectContent><SelectItem value="all">All Triggers</SelectItem>{TRIGGER_STAGES.map(t => <SelectItem key={t} value={t}>{TRIGGER_LABELS[t]}</SelectItem>)}</SelectContent></Select>
          <Select value={partnerFilter} onValueChange={setPartnerFilter}><SelectTrigger className="w-44"><SelectValue placeholder="Partner" /></SelectTrigger><SelectContent><SelectItem value="all">All Partners</SelectItem>{MOCK_PARTNERS.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardContent></Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[#0066CC]/5 rounded-lg border border-[#0066CC]/20">
          <span className="text-sm text-[#0066CC] font-medium">{selectedIds.size} selected</span>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleBulkApprove}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
          <Button size="sm" className="bg-[#F37021] hover:bg-[#e5681d] text-white" onClick={handleBulkPaid}><DollarSign className="h-3 w-3 mr-1" />Mark Paid</Button>
          <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="h-3 w-3 mr-1" />Export CSV</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}><X className="h-3 w-3" /></Button>
        </div>
      )}

      <Card className="border-0 shadow-sm"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-10"><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={v => { setSelectedIds(v ? new Set(filtered.map(c => c.id)) : new Set()) }} /></TableHead>
              <TableHead>ID</TableHead><TableHead>Partner</TableHead><TableHead className="hidden md:table-cell">Student</TableHead>
              <TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Trigger</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Created</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50/50" onClick={() => { setSelectedId(c.id); setActiveTab('detail') }}>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                  <TableCell className="font-mono text-xs font-medium text-[#0066CC]">{c.commissionId}</TableCell>
                  <TableCell className="text-sm max-w-[120px] truncate">{c.partnerName}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{c.studentName}</TableCell>
                  <TableCell><Badge className={c.partnerType === 'TYPE1' ? 'bg-[#0066CC]/10 text-[#0066CC]' : 'bg-[#F37021]/10 text-[#F37021]'} variant="secondary">{c.partnerType === 'TYPE1' ? 'P→A' : 'A→P'}</Badge></TableCell>
                  <TableCell className="font-semibold text-sm">৳{c.amount.toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-[10px]">{TRIGGER_LABELS[c.triggerStage]}</Badge></TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[c.status]} text-[10px]`}>{STATUS_LABELS[c.status]}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-gray-500">{c.createdAt}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedId(c.id); setActiveTab('detail') }}><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-3 border-t text-xs text-gray-500">{filtered.length} commissions found</div>
      </CardContent></Card>
    </div>
  )

  // --- Tab: Detail ---
  const DetailTab = () => {
    if (!selected) return (
      <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center">
        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-400">Select a commission to view details</p>
        <Button variant="outline" className="mt-4" onClick={() => setActiveTab('all')}>View All Commissions</Button>
      </CardContent></Card>
    )

    const action = STATUS_ACTION[selected.status]
    const totalPaid = selected.payments.reduce((s, p) => s + p.amount, 0)
    const triggerIdx = TRIGGER_STAGES.indexOf(selected.triggerStage)

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('all')}><ArrowRight className="h-4 w-4 rotate-180 mr-1" />Back</Button>
          <Separator orientation="vertical" className="h-6" />
          <h3 className="font-semibold text-[#1A2332]">{selected.commissionId}</h3>
          <Badge className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
          <Badge className={selected.partnerType === 'TYPE1' ? 'bg-[#0066CC]/10 text-[#0066CC]' : 'bg-[#F37021]/10 text-[#F37021]'} variant="secondary">{selected.partnerType === 'TYPE1' ? 'TYPE1 (P→A)' : 'TYPE2 (A→P)'}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Header Card */}
            <Card className="border-0 shadow-sm"><CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-xs text-gray-500">Amount</p><p className="text-xl font-bold text-[#1A2332]">৳{selected.amount.toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-500">Partner</p><p className="text-sm font-medium">{selected.partnerName}</p></div>
                <div><p className="text-xs text-gray-500">Student</p><p className="text-sm font-medium">{selected.studentName}</p></div>
                <div><p className="text-xs text-gray-500">University</p><p className="text-sm font-medium">{selected.universityName}</p></div>
              </div>
              {selected.status === 'partially_paid' && (
                <div className="mt-3"><div className="flex justify-between text-xs mb-1"><span>Paid ৳{totalPaid.toLocaleString()}</span><span>Remaining ৳{(selected.amount - totalPaid).toLocaleString()}</span></div>
                <Progress value={(totalPaid / selected.amount) * 100} className="h-2" /></div>
              )}
            </CardContent></Card>

            {/* Trigger Stage Progress */}
            <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><Zap className="h-4 w-4 text-[#F37021]" />Trigger Stage Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {TRIGGER_STAGES.map((t, i) => {
                  const done = selected.completedTriggers.includes(t)
                  const current = t === selected.triggerStage
                  return (
                    <div key={t} className="flex items-center gap-1 flex-shrink-0">
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium ${done ? 'bg-green-100 text-green-700' : current ? 'bg-[#F37021]/10 text-[#F37021] ring-1 ring-[#F37021]/30' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <CircleCheck className="h-3 w-3" /> : current ? <CircleDot className="h-3 w-3" /> : <CirclePause className="h-3 w-3" />}
                        {TRIGGER_LABELS[t]}
                      </div>
                      {i < TRIGGER_STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </CardContent></Card>

            {/* Lifecycle Timeline */}
            <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><Clock className="h-4 w-4 text-[#0066CC]" />Lifecycle Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {selected.statusHistory.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${STATUS_DOT[h.status]} ring-2 ring-white`} />
                      {i < selected.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-[#1A2332]">{STATUS_LABELS[h.status]}</p>
                      <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()} — {h.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {action && (
              <Button className={`w-full ${action.color} hover:opacity-90 text-white`} onClick={() => handleAction(selected)}>
                <action.icon className="h-4 w-4 mr-2" />{action.label}
              </Button>
            )}

            {/* Payment History */}
            <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332]">Payment History</CardTitle></CardHeader>
            <CardContent>
              {selected.payments.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">No payments yet</p> : (
                <div className="space-y-2">
                  {selected.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                      <div><p className="font-medium">৳{p.amount.toLocaleString()}</p><p className="text-gray-400">{p.method}</p></div>
                      <div className="text-right"><p className="text-gray-500">{p.date}</p><p className="text-gray-400 font-mono">{p.ref}</p></div>
                    </div>
                  ))}
                </div>
              )}
              {['approved','partially_paid'].includes(selected.status) && (
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowPaymentDialog(true)}><CreditCard className="h-3 w-3 mr-1" />Process Payment</Button>
              )}
            </CardContent></Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332]">Notes</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="max-h-32">
                {selected.notes.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">No notes</p> : (
                  <div className="space-y-2">
                    {selected.notes.map(n => (
                      <div key={n.id} className="p-2 bg-gray-50 rounded text-xs"><p className="font-medium">{n.author}</p><p className="text-gray-600">{n.text}</p><p className="text-gray-400 mt-1">{n.date}</p></div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowNoteDialog(true)}><MessageSquare className="h-3 w-3 mr-1" />Add Note</Button>
            </CardContent></Card>
          </div>
        </div>
      </div>
    )
  }

  // --- Tab: Partner View ---
  const PartnerViewTab = () => {
    const [selPartner, setSelPartner] = useState(MOCK_PARTNERS.length > 0 ? MOCK_PARTNERS[0].name : '')
    const partner = MOCK_PARTNERS.find(p => p.name === selPartner) || MOCK_PARTNERS[0]
    const partnerComms = commissions.filter(c => c.partnerName === selPartner)
    const pPaid = partnerComms.filter(c => ['partially_paid','fully_paid'].includes(c.status)).reduce((s, c) => s + c.payments.reduce((a, p) => a + p.amount, 0), 0)
    const pPending = partnerComms.filter(c => !['fully_paid','cancelled'].includes(c.status)).reduce((s, c) => s + c.amount, 0)

    return (
      <div className="space-y-4">
        <Select value={selPartner} onValueChange={setSelPartner}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>{MOCK_PARTNERS.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
        </Select>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Total Earned</p><p className="text-lg font-bold text-[#1A2332]">৳{partner.totalEarned.toLocaleString()}</p></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold text-amber-600">৳{pPending.toLocaleString()}</p></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Paid</p><p className="text-lg font-bold text-green-600">৳{pPaid.toLocaleString()}</p></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-500">Commission Rate</p><p className="text-lg font-bold text-[#0066CC]">{partner.rate}%</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332]">Commission List</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Trigger</TableHead></TableRow></TableHeader>
                <TableBody>
                  {partnerComms.map(c => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => { setSelectedId(c.id); setActiveTab('detail') }}>
                      <TableCell className="font-mono text-xs text-[#0066CC]">{c.commissionId}</TableCell>
                      <TableCell className="text-sm">{c.studentName}</TableCell>
                      <TableCell className="font-semibold text-sm">৳{c.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge className={`${STATUS_COLORS[c.status]} text-[10px]`}>{STATUS_LABELS[c.status]}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{TRIGGER_LABELS[c.triggerStage]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </div>

          <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332]">Agreement Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-xs text-gray-500">Partner Type</p><Badge className={partner.type === 'TYPE1' ? 'bg-[#0066CC]/10 text-[#0066CC]' : 'bg-[#F37021]/10 text-[#F37021]'}>{partner.type === 'TYPE1' ? 'TYPE1 (Partner→ALO)' : 'TYPE2 (ALO→Partner)'}</Badge></div>
              <div><p className="text-xs text-gray-500">Commission Rate</p><p className="font-semibold">{partner.rate}%</p></div>
              <div><p className="text-xs text-gray-500">Total Commissions</p><p className="font-semibold">{partnerComms.length}</p></div>
              <div><p className="text-xs text-gray-500">Active Commissions</p><p className="font-semibold">{partnerComms.filter(c => !['fully_paid','cancelled'].includes(c.status)).length}</p></div>
              <Separator />
              <div><p className="text-xs text-gray-500">Payment Terms</p><p className="text-sm">Net 30 days</p></div>
              <div><p className="text-xs text-gray-500">Min. Payout Threshold</p><p className="text-sm">৳5,000</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- Tab: Settings ---
  const SettingsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><Users className="h-4 w-4 text-[#0066CC]" />Default Commission Rates</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#0066CC]/5 rounded-lg">
                <div><p className="text-sm font-medium">TYPE1 (Partner→ALO)</p><p className="text-xs text-gray-500">Partner refers student, earns from ALO</p></div>
                <div className="flex items-center gap-2"><Input type="number" value={settings.type1Rate} onChange={e => setSettings({...settings, type1Rate: Number(e.target.value)})} className="w-16 text-center" /><span className="text-sm font-medium">%</span></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F37021]/5 rounded-lg">
                <div><p className="text-sm font-medium">TYPE2 (ALO→Partner)</p><p className="text-xs text-gray-500">ALO refers student, earns from Partner</p></div>
                <div className="flex items-center gap-2"><Input type="number" value={settings.type2Rate} onChange={e => setSettings({...settings, type2Rate: Number(e.target.value)})} className="w-16 text-center" /><span className="text-sm font-medium">%</span></div>
              </div>
            </div>
            <Button className="w-full bg-[#0066CC] hover:bg-[#0055aa] text-white" onClick={() => toast.success('Rates updated')}>Save Rates</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><Settings className="h-4 w-4 text-[#F37021]" />Auto-Calculation & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Auto-Calculate Commissions</p><p className="text-xs text-gray-500">Calculate when trigger stage reached</p></div>
              <Checkbox checked={settings.autoCalc} onCheckedChange={v => setSettings({...settings, autoCalc: !!v})} />
            </div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Minimum Payout</p><p className="text-xs text-gray-500">Minimum amount for payout</p></div>
              <div className="flex items-center gap-1"><span className="text-sm">৳</span><Input type="number" value={settings.minPayout} onChange={e => setSettings({...settings, minPayout: Number(e.target.value)})} className="w-24 text-center" /></div>
            </div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Payment Terms</p><p className="text-xs text-gray-500">Days after approval to pay</p></div>
              <div className="flex items-center gap-1"><Input type="number" value={settings.paymentTerms} onChange={e => setSettings({...settings, paymentTerms: Number(e.target.value)})} className="w-20 text-center" /><span className="text-sm">days</span></div>
            </div>
            <Button className="w-full bg-[#F37021] hover:bg-[#e5681d] text-white" onClick={() => toast.success('Settings saved')}>Save Settings</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1A2332] flex items-center gap-2"><Zap className="h-4 w-4 text-[#F37021]" />Trigger Stage Configuration</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-3">Select which application stages trigger commission calculation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {TRIGGER_STAGES.map(t => (
              <div key={t} className={`flex items-center justify-between p-3 rounded-lg border ${settings.triggers[t] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div><p className="text-sm font-medium">{TRIGGER_LABELS[t]}</p><p className="text-[10px] text-gray-500">{t.replace(/_/g, ' ')}</p></div>
                <Checkbox checked={settings.triggers[t]} onCheckedChange={v => setSettings({...settings, triggers: {...settings.triggers, [t]: !!v}})} />
              </div>
            ))}
          </div>
          <Button className="mt-4 bg-[#1A2332] hover:bg-[#1A2332]/90 text-white" onClick={() => toast.success('Trigger config saved')}>Save Configuration</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A2332] flex items-center gap-2"><Wallet className="h-6 w-6 text-[#F37021]" />Commission Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button size="sm" className="bg-[#0066CC] hover:bg-[#0055aa] text-white"><Plus className="h-4 w-4 mr-1" />New Commission</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><TrendingUp className="h-3.5 w-3.5 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Filter className="h-3.5 w-3.5 mr-1" />All Commissions</TabsTrigger>
          <TabsTrigger value="detail" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Eye className="h-3.5 w-3.5 mr-1" />Detail</TabsTrigger>
          <TabsTrigger value="partner" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="h-3.5 w-3.5 mr-1" />Partner View</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Settings className="h-3.5 w-3.5 mr-1" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="all"><AllCommissionsTab /></TabsContent>
        <TabsContent value="detail"><DetailTab /></TabsContent>
        <TabsContent value="partner"><PartnerViewTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea placeholder="Enter note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
              <Button className="bg-[#0066CC] hover:bg-[#0055aa] text-white" onClick={addNote}>Add Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Process Payment</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg text-sm"><p className="text-gray-500">Commission: {selected.commissionId}</p><p className="font-semibold">Total: ৳{selected.amount.toLocaleString()}</p><p className="text-xs text-gray-500">Already Paid: ৳{selected.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p></div>
              <div><Label>Payment Amount (৳)</Label><Input type="number" placeholder="Enter amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={processPayment}><CreditCard className="h-4 w-4 mr-1" />Process</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
