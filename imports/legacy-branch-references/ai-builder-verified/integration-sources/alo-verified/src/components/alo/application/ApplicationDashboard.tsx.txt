'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ClipboardList, Eye, FileCheck, FileText, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, University, TrendingUp,
  Zap, Send, RefreshCw, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useAppStore } from '@/lib/store'

const CHART_COLORS = ['#F37021', '#0066CC', '#FFB347', '#4CAF50', '#8b5cf6', '#E91E63']

const pipelineStages = [
  { key: 'total', label: 'Total Apps', count: 48, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10' },
  { key: 'under_review', label: 'Under Review', count: 12, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'offers', label: 'Offers', count: 15, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'cas_pending', label: 'CAS Pending', count: 8, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10' },
  { key: 'visa_stage', label: 'Visa Stage', count: 6, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10' },
  { key: 'enrolled', label: 'Enrolled', count: 7, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
]

const pipelineFlow = [
  { stage: 'Submitted', count: 48 },
  { stage: 'Under Review', count: 12 },
  { stage: 'Offers', count: 15 },
  { stage: 'CAS', count: 8 },
  { stage: 'Visa', count: 6 },
  { stage: 'Enrolled', count: 7 },
]

const pendingDocs = [
  { student: 'Tanvir Ahmed', university: 'Birmingham', docs: 4, verified: 2, missing: 'Financial Statement' },
  { student: 'Fatima Begum', university: 'Manchester', docs: 5, verified: 3, missing: 'Passport Copy' },
  { student: 'Rahim Uddin', university: 'Leeds', docs: 3, verified: 0, missing: 'All Documents' },
  { student: 'Nusrat Jahan', university: 'Sheffield', docs: 6, verified: 4, missing: 'IELTS Score' },
]

const uniResponses = [
  { university: 'University of Birmingham', submitted: 8, offers: 5, pending: 2, rejected: 1, avgDays: 14 },
  { university: 'University of Manchester', submitted: 6, offers: 4, pending: 1, rejected: 1, avgDays: 18 },
  { university: 'University of Leeds', submitted: 5, offers: 2, pending: 2, rejected: 1, avgDays: 22 },
  { university: 'University of Sheffield', submitted: 4, offers: 3, pending: 1, rejected: 0, avgDays: 12 },
  { university: 'University of Bristol', submitted: 3, offers: 1, pending: 2, rejected: 0, avgDays: 25 },
]

const casStatus = [
  { university: 'Birmingham', requested: 3, received: 2, pending: 1 },
  { university: 'Manchester', requested: 2, received: 2, pending: 0 },
  { university: 'Sheffield', requested: 3, received: 1, pending: 2 },
  { university: 'Leeds', requested: 1, received: 0, pending: 1 },
]

export default function ApplicationDashboard() {
  const { setCurrentView } = useAppStore()

  const stats = [
    { title: 'Total Applications', value: 48, icon: <ClipboardList className="h-5 w-5" />, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10', trend: '+8', up: true },
    { title: 'Under Review', value: 12, icon: <Eye className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+3', up: true },
    { title: 'Offers Received', value: 15, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50', trend: '+5', up: true },
    { title: 'CAS Pending', value: 8, icon: <FileText className="h-5 w-5" />, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10', trend: '+2', up: false },
    { title: 'Visa Stage', value: 6, icon: <Clock className="h-5 w-5" />, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', trend: '+1', up: true },
    { title: 'Enrolled', value: 7, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', trend: '+3', up: true },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Application Team Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track applications through the pipeline to enrollment</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#0066CC]/30 text-[#0066CC] bg-[#0066CC]/5 px-3 py-1 text-xs font-medium">
          Application Team
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-xl font-bold text-[#1A2332]">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Pipeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#F37021]" /> Application Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4">
            {pipelineFlow.map((stage, i) => (
              <div key={stage.stage} className="flex items-center gap-1 shrink-0">
                <div className={`px-3 py-2 rounded-lg text-center min-w-[80px] border ${
                  i === pipelineFlow.length - 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-lg font-bold text-[#1A2332]">{stage.count}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{stage.stage}</p>
                </div>
                {i < pipelineFlow.length - 1 && <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineFlow} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                {pipelineFlow.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pending Document Verification & University Response Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Document Verification */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-[#0066CC]" /> Pending Document Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {pendingDocs.map((d, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{d.student}</p>
                      <p className="text-[10px] text-gray-500">{d.university} • Missing: {d.missing}</p>
                    </div>
                    <Badge className="bg-amber-50 text-amber-700 text-[9px] border-0">{d.verified}/{d.docs} verified</Badge>
                  </div>
                  <Progress value={(d.verified / d.docs) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* University Response Tracker */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <University className="h-4 w-4 text-[#4CAF50]" /> University Response Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-[10px] font-medium text-gray-500 uppercase">University</th>
                    <th className="text-center py-2 px-2 text-[10px] font-medium text-gray-500 uppercase">Offers</th>
                    <th className="text-center py-2 px-2 text-[10px] font-medium text-gray-500 uppercase">Pending</th>
                    <th className="text-center py-2 px-2 text-[10px] font-medium text-gray-500 uppercase">Avg Days</th>
                  </tr>
                </thead>
                <tbody>
                  {uniResponses.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-2 text-xs font-medium text-[#1A2332] max-w-[120px] truncate">{u.university.replace('University of ', '')}</td>
                      <td className="py-2.5 px-2 text-center"><Badge className="bg-green-50 text-green-700 text-[9px] border-0">{u.offers}</Badge></td>
                      <td className="py-2.5 px-2 text-center"><Badge className="bg-amber-50 text-amber-700 text-[9px] border-0">{u.pending}</Badge></td>
                      <td className="py-2.5 px-2 text-center text-xs text-gray-600">{u.avgDays}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CAS Status Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#FFB347]" /> CAS Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {casStatus.map((c, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg flex-1 min-w-[180px]">
                <p className="text-sm font-medium text-[#1A2332] mb-3">{c.university}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Requested</span>
                    <span className="text-xs font-semibold text-[#0066CC]">{c.requested}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Received</span>
                    <span className="text-xs font-semibold text-green-600">{c.received}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Pending</span>
                    <span className="text-xs font-semibold text-[#F37021]">{c.pending}</span>
                  </div>
                  <Progress value={(c.received / c.requested) * 100} className="h-1.5 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-applications')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021]"><Zap className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Process Application</p><p className="text-[11px] text-gray-500">Review next application</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-applications')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]"><FileCheck className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Request Document</p><p className="text-[11px] text-gray-500">Ask student for documents</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-applications')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#4CAF50]/10 rounded-xl flex items-center justify-center text-[#4CAF50]"><RefreshCw className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Update Status</p><p className="text-[11px] text-gray-500">Change application status</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
