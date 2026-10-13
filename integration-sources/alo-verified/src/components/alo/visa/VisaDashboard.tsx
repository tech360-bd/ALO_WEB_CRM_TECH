'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  FileCheck, ClipboardList, Stamp, Fingerprint, CheckCircle2, XCircle,
  CalendarClock, Mic, ArrowRight, Clock, AlertTriangle, Users,
  TrendingUp, Eye, Zap,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const pipelineStages = [
  { key: 'application', label: 'Application', count: 24 },
  { key: 'cas', label: 'CAS', count: 18 },
  { key: 'visa_app', label: 'Visa App', count: 12 },
  { key: 'biometrics', label: 'Biometrics', count: 8 },
  { key: 'decision', label: 'Decision', count: 5 },
  { key: 'approved', label: 'Approved', count: 32 },
  { key: 'rejected', label: 'Rejected', count: 3 },
]

const pendingFiles = [
  { id: 'VF-001', student: 'Tanvir Ahmed', university: 'University of Birmingham', country: 'UK', status: 'document_review', priority: 'high' },
  { id: 'VF-002', student: 'Fatima Begum', university: 'University of Manchester', country: 'UK', status: 'cas_pending', priority: 'medium' },
  { id: 'VF-003', student: 'Rahim Uddin', university: 'University of Leeds', country: 'UK', status: 'biometrics_scheduled', priority: 'low' },
  { id: 'VF-004', student: 'Nusrat Jahan', university: 'University of Sheffield', country: 'UK', status: 'visa_submitted', priority: 'high' },
  { id: 'VF-005', student: 'Imran Hossain', university: 'University of Bristol', country: 'UK', status: 'document_review', priority: 'medium' },
]

const interviews = [
  { id: 1, student: 'Tanvir Ahmed', date: '2025-03-08', time: '10:00 AM', type: 'UKVI Mock', officer: 'Sarah K.' },
  { id: 2, student: 'Fatima Begum', date: '2025-03-08', time: '11:30 AM', type: 'UKVI Final', officer: 'James M.' },
  { id: 3, student: 'Imran Hossain', date: '2025-03-09', time: '09:00 AM', type: 'UKVI Mock', officer: 'Sarah K.' },
  { id: 4, student: 'Nusrat Jahan', date: '2025-03-10', time: '02:00 PM', type: 'UKVI Final', officer: 'David R.' },
]

const recentDecisions = [
  { student: 'Arif Khan', decision: 'Approved', country: 'UK', date: '2025-03-06', university: 'University of Birmingham' },
  { student: 'Sadia Islam', decision: 'Approved', country: 'UK', date: '2025-03-06', university: 'University of Manchester' },
  { student: 'Kamal Hossain', decision: 'Rejected', country: 'UK', date: '2025-03-05', university: 'University of Leeds' },
  { student: 'Rita Das', decision: 'Approved', country: 'UK', date: '2025-03-05', university: 'University of Sheffield' },
]

const docQueue = [
  { student: 'Tanvir Ahmed', docs: 3, verified: 1, type: 'Financial' },
  { student: 'Fatima Begum', docs: 5, verified: 3, type: 'Academic' },
  { student: 'Imran Hossain', docs: 4, verified: 0, type: 'Identity' },
]

const statusColors: Record<string, string> = {
  document_review: 'bg-amber-50 text-amber-700',
  cas_pending: 'bg-blue-50 text-blue-700',
  biometrics_scheduled: 'bg-purple-50 text-purple-700',
  visa_submitted: 'bg-cyan-50 text-cyan-700',
}
const priorityColors: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
}

export default function VisaDashboard() {
  const { setCurrentView } = useAppStore()
  const [activeTab, setActiveTab] = useState<'pending' | 'interviews' | 'docs'>('pending')

  const stats = [
    { title: 'Total Visa Files', value: 102, icon: <FileCheck className="h-5 w-5" />, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10' },
    { title: 'Pending Review', value: 24, icon: <ClipboardList className="h-5 w-5" />, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10' },
    { title: 'Approved Today', value: 8, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Rejected Today', value: 1, icon: <XCircle className="h-5 w-5" />, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'CAS Issued', value: 18, icon: <Stamp className="h-5 w-5" />, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10' },
    { title: 'UKVI Interviews', value: 4, icon: <Mic className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Visa Officer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor visa applications, CAS and UKVI interviews</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#F37021]/30 text-[#F37021] bg-[#F37021]/5 px-3 py-1 text-xs font-medium">
          Visa Officer
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-2xl font-bold text-[#1A2332]">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visa Pipeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332]">Visa Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {pipelineStages.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-1 shrink-0">
                <div className={`px-3 py-2 rounded-lg text-center min-w-[80px] ${
                  stage.key === 'approved' ? 'bg-green-50 border border-green-200' :
                  stage.key === 'rejected' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <p className="text-lg font-bold text-[#1A2332]">{stage.count}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{stage.label}</p>
                </div>
                {i < pipelineStages.length - 1 && <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Pending / Interviews / Docs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['pending', 'interviews', 'docs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-[#F37021] text-[#F37021]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'pending' ? 'Pending Visa Files' : tab === 'interviews' ? 'UKVI Interviews' : 'Doc Verification'}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">University</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFiles.map(f => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-[#0066CC]">{f.id}</td>
                      <td className="py-3 px-4 text-sm font-medium text-[#1A2332]">{f.student}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{f.university}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{f.country}</td>
                      <td className="py-3 px-4"><Badge className={`${statusColors[f.status]} text-[10px] border-0`}>{f.status.replace(/_/g, ' ')}</Badge></td>
                      <td className="py-3 px-4"><Badge className={`${priorityColors[f.priority]} text-[10px] border-0`}>{f.priority}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'interviews' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="space-y-3">
              {interviews.map(iv => (
                <div key={iv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F37021]/10 rounded-full flex items-center justify-center text-[#F37021]">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{iv.student}</p>
                      <p className="text-xs text-gray-500">{iv.type} • Officer: {iv.officer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#F37021]">{iv.date}</p>
                    <p className="text-xs text-gray-500">{iv.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'docs' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="space-y-3">
              {docQueue.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center text-[#0066CC]">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{d.student}</p>
                      <p className="text-xs text-gray-500">{d.type} Documents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress value={(d.verified / d.docs) * 100} className="h-2" />
                    </div>
                    <span className="text-xs text-gray-500">{d.verified}/{d.docs}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Decisions Feed */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F37021]" /> Recent Decisions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {recentDecisions.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${d.decision === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {d.decision === 'Approved' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">{d.student}</p>
                    <p className="text-xs text-gray-500">{d.university} • {d.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${d.decision === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} text-[10px] border-0`}>
                    {d.decision}
                  </Badge>
                  <p className="text-[10px] text-gray-400 mt-1">{d.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-visa')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021]"><Zap className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Process Next</p><p className="text-[11px] text-gray-500">Review next visa file</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-visa')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]"><CalendarClock className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Schedule Interview</p><p className="text-[11px] text-gray-500">Book UKVI interview slot</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-visa')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#FFB347]/10 rounded-xl flex items-center justify-center text-[#FFB347]"><Stamp className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Issue CAS</p><p className="text-[11px] text-gray-500">Process CAS for students</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
