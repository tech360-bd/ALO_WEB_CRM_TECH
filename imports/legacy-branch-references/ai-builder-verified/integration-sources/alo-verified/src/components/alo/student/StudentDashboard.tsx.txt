'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  FileText, Clock, MessageSquare, Calendar, GraduationCap, Shield,
  CheckCircle2, ArrowRight, Upload, Phone, BookOpen, Plane,
  AlertTriangle, Bell, Star, ChevronRight, FolderOpen
} from 'lucide-react'

const mockStats = {
  activeApplications: 4,
  documentsPending: 3,
  unreadMessages: 7,
  upcomingAppointments: 2,
}

const pipelineStages = [
  { key: 'draft', label: 'Draft', count: 1, color: 'bg-gray-200' },
  { key: 'submitted', label: 'Submitted', count: 2, color: 'bg-[#0066CC]' },
  { key: 'under_review', label: 'Review', count: 1, color: 'bg-yellow-400' },
  { key: 'offer', label: 'Offer', count: 1, color: 'bg-green-400' },
  { key: 'cas', label: 'CAS', count: 0, color: 'bg-purple-400' },
  { key: 'visa', label: 'Visa', count: 0, color: 'bg-emerald-400' },
  { key: 'enrolled', label: 'Enrolled', count: 0, color: 'bg-[#F37021]' },
]

const mockDocuments = [
  { id: '1', name: 'Passport Copy', status: 'pending', dueDate: '2025-04-15' },
  { id: '2', name: 'IELTS Certificate', status: 'overdue', dueDate: '2025-03-20' },
  { id: '3', name: 'Bank Statement', status: 'pending', dueDate: '2025-04-22' },
]

const mockMessages = [
  { id: '1', from: 'Sarah Johnson', message: 'Your CAS letter has been updated. Please review.', time: '2h ago', unread: true },
  { id: '2', from: 'Visa Team', message: 'Additional documents required for your visa application.', time: '5h ago', unread: true },
  { id: '3', from: 'ALO Support', message: 'Your appointment has been confirmed for March 28.', time: '1d ago', unread: false },
]

const mockAppointments = [
  { id: '1', title: 'Visa Consultation', date: '2025-03-28', time: '10:00 AM', type: 'Video Call' },
  { id: '2', title: 'Document Review', date: '2025-04-02', time: '2:00 PM', type: 'In Person' },
]

const mockScholarships = [
  { id: '1', name: 'Chevening Scholarship', amount: '£18,000', university: 'UK Universities', deadline: '2025-11-05', match: 92 },
  { id: '2', name: 'Commonwealth Masters', amount: 'Full Tuition', university: 'UK Universities', deadline: '2025-12-15', match: 87 },
  { id: '3', name: 'GREAT Scholarship', amount: '£10,000', university: 'Selected UK Unis', deadline: '2025-05-30', match: 78 },
]

const visaSteps = ['Application Submitted', 'Offer Received', 'CAS Issued', 'Visa Applied', 'Visa Approved']
const currentVisaStep = 2

export default function StudentDashboard() {
  const { currentUser, setCurrentView } = useAppStore()
  const studentName = currentUser?.name || 'Student'
  const totalPipeline = pipelineStages.reduce((s, p) => s + p.count, 0)
  const appProgress = Math.round(((totalPipeline - pipelineStages[0].count) / Math.max(totalPipeline, 1)) * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Welcome back, {studentName}! 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your applications are <span className="font-semibold text-[#F37021]">{appProgress}%</span> through the pipeline
          </p>
          <Progress value={appProgress} className="h-1.5 w-48 mt-2" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView('student-applications')} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
            <FileText className="h-4 w-4 mr-2" /> Apply to University
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('student-messages')}>
            <MessageSquare className="h-4 w-4 mr-2" /> Messages
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Applications', value: mockStats.activeApplications, icon: <FileText className="h-5 w-5" />, bg: 'bg-[#0066CC]/10', textColor: 'text-[#0066CC]' },
          { label: 'Documents Pending', value: mockStats.documentsPending, icon: <FolderOpen className="h-5 w-5" />, bg: 'bg-[#F37021]/10', textColor: 'text-[#F37021]' },
          { label: 'Messages', value: mockStats.unreadMessages, icon: <MessageSquare className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Upcoming Appointments', value: mockStats.upcomingAppointments, icon: <Calendar className="h-5 w-5" />, bg: 'bg-purple-50', textColor: 'text-purple-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (stat.label === 'Active Applications') setCurrentView('student-applications')
              if (stat.label === 'Documents Pending') setCurrentView('student-documents')
              if (stat.label === 'Messages') setCurrentView('student-messages')
            }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Progress Pipeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#F37021]" /> Application Pipeline
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[#F37021]" onClick={() => setCurrentView('student-applications')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-end gap-1">
            {pipelineStages.map((stage, idx) => (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-[#1A2332]">{stage.count}</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(stage.count * 32, 8)}px` }}>
                  <div className={`w-full h-full rounded-t-md ${stage.color}`} />
                </div>
                <span className="text-[10px] text-gray-500 text-center leading-tight">{stage.label}</span>
                {idx < pipelineStages.length - 1 && (
                  <div className="hidden sm:block absolute" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visa Status Overview */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Plane className="h-4 w-4 text-[#F37021]" /> Visa Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{currentVisaStep} of {visaSteps.length} steps</span>
                </div>
                <Progress value={(currentVisaStep / visaSteps.length) * 100} className="h-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                {visaSteps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      idx < currentVisaStep ? 'bg-green-100 text-green-700' :
                      idx === currentVisaStep ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {idx < currentVisaStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <span className={`text-xs ${idx <= currentVisaStep ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Document Requirements */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#0066CC]" /> Document Requirements
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#F37021]" onClick={() => setCurrentView('student-documents')}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {mockDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      doc.status === 'overdue' ? 'bg-red-50' : 'bg-[#F37021]/10'
                    }`}>
                      {doc.status === 'overdue' ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-[#F37021]" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{doc.name}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(doc.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${doc.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {doc.status === 'overdue' ? 'Overdue' : 'Pending'}
                  </Badge>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full text-[#F37021] border-[#F37021]/30 hover:bg-[#F37021]/5"
                onClick={() => setCurrentView('student-documents')}>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Documents
              </Button>
            </CardContent>
          </Card>

          {/* Scholarship Recommendations */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#F37021]" /> Scholarship Recommendations
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#F37021]" onClick={() => setCurrentView('student-scholarships')}>
                  Browse All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {mockScholarships.map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1A2332] truncate">{sch.name}</p>
                        <Badge className="bg-[#F37021]/10 text-[#F37021] text-[10px] shrink-0">{sch.match}% match</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{sch.university} · {sch.amount} · Deadline: {new Date(sch.deadline).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Messages Panel */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#F37021]" /> Messages
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#F37021]" onClick={() => setCurrentView('student-messages')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {mockMessages.map((msg) => (
                <div key={msg.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setCurrentView('student-messages')}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#1A2332]">{msg.from}</p>
                    <div className="flex items-center gap-1.5">
                      {msg.unread && <div className="w-2 h-2 bg-[#F37021] rounded-full" />}
                      <span className="text-[10px] text-gray-400">{msg.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0066CC]" /> Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {mockAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#F37021]/10 rounded-lg flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#F37021]">
                      {new Date(apt.date).toLocaleDateString('en', { day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-[#F37021]">
                      {new Date(apt.date).toLocaleDateString('en', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A2332]">{apt.title}</p>
                    <p className="text-xs text-gray-500">{apt.time} · {apt.type}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{apt.type}</Badge>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full text-[#0066CC] border-[#0066CC]/30 hover:bg-[#0066CC]/5"
                onClick={() => setCurrentView('student-appointments')}>
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Book Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A2332]">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Apply to University', view: 'student-applications' as const, icon: <GraduationCap className="h-4 w-4" />, color: 'text-[#0066CC]' },
                  { label: 'Upload Documents', view: 'student-documents' as const, icon: <Upload className="h-4 w-4" />, color: 'text-[#F37021]' },
                  { label: 'Book Appointment', view: 'student-appointments' as const, icon: <Calendar className="h-4 w-4" />, color: 'text-purple-600' },
                  { label: 'Contact Support', view: 'student-support' as const, icon: <Phone className="h-4 w-4" />, color: 'text-green-600' },
                ].map((action) => (
                  <Button key={action.label} variant="outline"
                    className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 hover:bg-gray-50"
                    onClick={() => setCurrentView(action.view)}>
                    <span className={action.color}>{action.icon}</span>
                    <span className="text-xs text-gray-600">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visa Quick Access */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1A2332] to-[#1A2332]/90 text-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-8 w-8 text-[#F37021]" />
                <div>
                  <p className="font-semibold">Visa Tracker</p>
                  <p className="text-xs text-gray-300">Step {currentVisaStep} of {visaSteps.length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-3">Your CAS is being processed. Expected completion in 5-7 business days.</p>
              <Button size="sm" className="bg-[#F37021] hover:bg-[#F37021]/90 text-white w-full"
                onClick={() => setCurrentView('student-visa')}>
                <Plane className="h-3.5 w-3.5 mr-1.5" /> View Visa Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
