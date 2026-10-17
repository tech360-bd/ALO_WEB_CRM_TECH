'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Flame, Sun, Snowflake, Search, Phone, Mail, MessageSquare,
  ChevronRight, UserPlus, Calendar, Eye, ArrowRightLeft
} from 'lucide-react'

interface Lead {
  id: string
  leadId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  whatsappNumber?: string
  status: string
  temperature: string
  preferredCountry?: string
  preferredCourse?: string
  source: string
  nextFollowUp?: string
  notes?: string
  assignedTo?: string
  counselorName?: string
  createdAt: string
}

const temperatureConfig: Record<string, { color: string; label: string; icon: React.ReactNode; bg: string }> = {
  hot: { color: 'text-red-600', label: 'Hot', icon: <Flame className="h-4 w-4" />, bg: 'bg-red-50' },
  warm: { color: 'text-amber-600', label: 'Warm', icon: <Sun className="h-4 w-4" />, bg: 'bg-amber-50' },
  cold: { color: 'text-blue-600', label: 'Cold', icon: <Snowflake className="h-4 w-4" />, bg: 'bg-blue-50' },
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-purple-50 text-purple-700',
  qualified: 'bg-green-50 text-green-700',
  unqualified: 'bg-gray-100 text-gray-600',
  converted: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-700',
}

export default function EmployeeLeads() {
  const { currentUser } = useAppStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tempFilter, setTempFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [currentUser])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const assignedTo = currentUser?.referenceId || currentUser?.id || ''
      const res = await fetch(`/api/leads?assignedTo=${assignedTo}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        const leadData = (json.leads || []).map((l: Record<string, unknown>) => ({
          id: l.id,
          leadId: l.leadId || '',
          firstName: l.firstName || '',
          lastName: l.lastName || '',
          email: l.email || '',
          phone: l.phone || '',
          whatsappNumber: l.whatsappNumber || '',
          status: l.status || 'new',
          temperature: l.temperature || 'warm',
          preferredCountry: l.preferredCountry || '',
          preferredCourse: l.preferredCourse || '',
          source: l.source || '',
          nextFollowUp: l.nextFollowUp || '',
          notes: l.notes || '',
          counselorName: (l.counselor as Record<string, string>) ? `${(l.counselor as Record<string, string>).firstName || ''} ${(l.counselor as Record<string, string>).lastName || ''}`.trim() : '',
          createdAt: l.createdAt || new Date().toISOString(),
        }))
        setLeads(leadData)
      } else {
        setLeads([])
      }
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.leadId.toLowerCase().includes(search.toLowerCase())
    const matchTemp = tempFilter === 'all' || l.temperature === tempFilter
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchTemp && matchStatus
  })

  const tempCounts = {
    hot: leads.filter(l => l.temperature === 'hot').length,
    warm: leads.filter(l => l.temperature === 'warm').length,
    cold: leads.filter(l => l.temperature === 'cold').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">My Leads</h1>
        <p className="text-sm text-gray-500 mt-1">Leads assigned to you for follow-up and conversion</p>
      </div>

      {/* Temperature Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hot Leads', value: tempCounts.hot, icon: <Flame className="h-5 w-5" />, bg: 'bg-red-50', textColor: 'text-red-600' },
          { label: 'Warm Leads', value: tempCounts.warm, icon: <Sun className="h-5 w-5" />, bg: 'bg-amber-50', textColor: 'text-amber-600' },
          { label: 'Cold Leads', value: tempCounts.cold, icon: <Snowflake className="h-5 w-5" />, bg: 'bg-blue-50', textColor: 'text-blue-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tempFilter} onValueChange={setTempFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Temperature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Temps</SelectItem>
            <SelectItem value="hot">🔥 Hot</SelectItem>
            <SelectItem value="warm">☀️ Warm</SelectItem>
            <SelectItem value="cold">❄️ Cold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead Cards */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Flame className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No leads found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => {
            const tc = temperatureConfig[lead.temperature] || temperatureConfig.warm
            const isFollowUpToday = lead.nextFollowUp && new Date(lead.nextFollowUp).toDateString() === new Date().toDateString()
            const isFollowUpPast = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()
            return (
              <Card key={lead.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                isFollowUpPast && lead.status !== 'converted' && lead.status !== 'lost' ? 'ring-1 ring-red-200' : ''
              }`} onClick={() => { setSelectedLead(lead); setShowDetailDialog(true) }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tc.bg} ${tc.color}`}>
                      {tc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#1A2332] truncate">{lead.firstName} {lead.lastName}</p>
                        <Badge className={`text-[10px] ${tc.bg} ${tc.color} flex items-center gap-1`}>
                          {tc.icon} {tc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{lead.email || lead.phone || 'No contact info'}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                    {lead.preferredCountry && (
                      <div>
                        <p className="text-[10px] text-gray-400">Country</p>
                        <p className="text-xs font-medium">{lead.preferredCountry}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-gray-400">Source</p>
                      <p className="text-xs font-medium capitalize">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Status</p>
                      <Badge className={`text-[10px] ${statusColors[lead.status] || 'bg-gray-100'}`}>
                        {lead.status}
                      </Badge>
                    </div>
                    {lead.nextFollowUp && lead.status !== 'converted' && lead.status !== 'lost' && (
                      <div>
                        <p className="text-[10px] text-gray-400">Follow-up</p>
                        <p className={`text-xs font-medium ${isFollowUpPast ? 'text-red-600' : isFollowUpToday ? 'text-amber-600' : ''}`}>
                          {new Date(lead.nextFollowUp).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {lead.phone && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toast.info(`Calling ${lead.phone}...`) }}>
                        <Phone className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                    )}
                    {lead.whatsappNumber && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toast.info(`Opening WhatsApp for ${lead.whatsappNumber}...`) }}>
                        <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
                      </Button>
                    )}
                    {lead.email && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toast.info(`Composing email to ${lead.email}...`) }}>
                        <Mail className="h-3.5 w-3.5 text-[#0066CC]" />
                      </Button>
                    )}
                    {lead.status !== 'converted' && lead.status !== 'lost' && (
                      <Button size="sm" className="h-7 text-[10px] ml-auto bg-[#F37021] hover:bg-[#F37021]/90 text-white px-2"
                        onClick={(e) => { e.stopPropagation(); toast.success('Lead converted to student!') }}>
                        <ArrowRightLeft className="h-3 w-3 mr-1" /> Convert
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${temperatureConfig[selectedLead.temperature]?.bg || 'bg-gray-50'} ${temperatureConfig[selectedLead.temperature]?.color || 'text-gray-600'}`}>
                  {temperatureConfig[selectedLead.temperature]?.icon || <Sun className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1A2332]">{selectedLead.firstName} {selectedLead.lastName}</h3>
                  <p className="text-sm text-gray-500">{selectedLead.leadId}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={`text-xs ${temperatureConfig[selectedLead.temperature]?.bg || ''} ${temperatureConfig[selectedLead.temperature]?.color || ''}`}>
                      {temperatureConfig[selectedLead.temperature]?.label || selectedLead.temperature}
                    </Badge>
                    <Badge className={`text-xs ${statusColors[selectedLead.status] || 'bg-gray-100'}`}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium truncate">{selectedLead.email || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{selectedLead.phone || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Preferred Country</p>
                  <p className="text-sm font-medium">{selectedLead.preferredCountry || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Preferred Course</p>
                  <p className="text-sm font-medium">{selectedLead.preferredCourse || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="text-sm font-medium capitalize">{selectedLead.source}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Next Follow-up</p>
                  <p className="text-sm font-medium">{selectedLead.nextFollowUp ? new Date(selectedLead.nextFollowUp).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              {selectedLead.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700">{selectedLead.notes}</p>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                {selectedLead.phone && (
                  <Button variant="outline" className="flex-1" onClick={() => toast.info(`Calling ${selectedLead.phone}...`)}>
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                )}
                {selectedLead.whatsappNumber && (
                  <Button variant="outline" className="flex-1" onClick={() => toast.info(`Opening WhatsApp...`)}>
                    <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                )}
                {selectedLead.email && (
                  <Button variant="outline" className="flex-1" onClick={() => toast.info(`Composing email...`)}>
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Button>
                )}
              </div>
              {selectedLead.status !== 'converted' && selectedLead.status !== 'lost' && (
                <Button className="w-full bg-[#F37021] hover:bg-[#F37021]/90 text-white"
                  onClick={() => { toast.success('Lead converted to student!'); setShowDetailDialog(false) }}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" /> Convert to Student
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
