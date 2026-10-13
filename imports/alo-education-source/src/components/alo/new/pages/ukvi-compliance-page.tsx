'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Shield, Clock, CheckCircle2, AlertTriangle, XCircle,
  FileText, Users, Calendar, Search, Eye, ChevronRight, RefreshCw,
  Globe, Plane, Building2, GraduationCap, AlertCircle, Bell,
  ExternalLink, ArrowRight, Zap, Bot, MapPin, Phone, Mail
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const UKVI_TEAL = '#0d9488';
const UKVI_RED = '#C8102E';
const NAVY = '#1a1a2e';

// ── Types ──────────────────────────────────────────────────────────────────
type VisaStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'bio_requested' | 'additional_docs';

interface VisaCase {
  id: string;
  studentName: string;
  nationality: string;
  university: string;
  course: string;
  visaType: string;
  status: VisaStatus;
  submittedDate: string;
  lastUpdate: string;
  decisionDate?: string;
  casNumber: string;
  ukviRef: string;
  daysPending: number;
  counselor: string;
  missingDocs: string[];
  complianceFlags: string[];
  nextAction: string;
}

interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedCases: number;
  timestamp: string;
  action: string;
}

// ── Demo Data ──────────────────────────────────────────────────────────────
const VISA_CASES: VisaCase[] = [
  {
    id: 'vc1', studentName: 'Rahim Ahmed', nationality: 'Bangladeshi',
    university: 'University of Manchester', course: 'MSc Computer Science',
    visaType: 'Student Visa (Tier 4)', status: 'processing',
    submittedDate: '2025-01-15', lastUpdate: '2 days ago',
    casNumber: 'CAS-2025-MAN-0142', ukviRef: 'UKVI-BD-78542',
    daysPending: 18, counselor: 'Sarah Khan',
    missingDocs: [], complianceFlags: [],
    nextAction: 'Awaiting biometric appointment',
  },
  {
    id: 'vc2', studentName: 'Nusrat Jahan', nationality: 'Bangladeshi',
    university: "King's College London", course: 'LLB Law',
    visaType: 'Student Visa (Tier 4)', status: 'bio_requested',
    submittedDate: '2025-01-10', lastUpdate: '1 day ago',
    casNumber: 'CAS-2025-KCL-0089', ukviRef: 'UKVI-BD-78210',
    daysPending: 23, counselor: 'Sarah Khan',
    missingDocs: [], complianceFlags: ['Biometric deadline approaching'],
    nextAction: 'Schedule VAC appointment by Feb 5',
  },
  {
    id: 'vc3', studentName: 'Tanvir Islam', nationality: 'Bangladeshi',
    university: 'University of Birmingham', course: 'BEng Mechanical',
    visaType: 'Student Visa (Tier 4)', status: 'pending',
    submittedDate: '2025-01-20', lastUpdate: '5 days ago',
    casNumber: 'CAS-2025-BHM-0234', ukviRef: '',
    daysPending: 5, counselor: 'Ali Rahman',
    missingDocs: ['TB Test Certificate', 'Financial evidence (28-day)'],
    complianceFlags: ['Missing mandatory documents', 'Financial proof insufficient'],
    nextAction: 'Collect missing documents',
  },
  {
    id: 'vc4', studentName: 'Sabrina Akter', nationality: 'Bangladeshi',
    university: 'UCL', course: 'MArch Architecture',
    visaType: 'Student Visa (Tier 4)', status: 'approved',
    submittedDate: '2024-12-01', lastUpdate: '1 week ago',
    decisionDate: '2025-01-10', casNumber: 'CAS-2024-UCL-0156', ukviRef: 'UKVI-BD-76980',
    daysPending: 0, counselor: 'Sarah Khan',
    missingDocs: [], complianceFlags: [],
    nextAction: 'Vignette collected - travel preparation',
  },
  {
    id: 'vc5', studentName: 'Mehedi Hasan', nationality: 'Bangladeshi',
    university: 'University of Edinburgh', course: 'MSc Data Science',
    visaType: 'Student Visa (Tier 4)', status: 'additional_docs',
    submittedDate: '2025-01-05', lastUpdate: '3 days ago',
    casNumber: 'CAS-2025-EDI-0078', ukviRef: 'UKVI-BD-77900',
    daysPending: 28, counselor: 'Ali Rahman',
    missingDocs: ['Updated bank statement', 'ATAS certificate'],
    complianceFlags: ['UKVI requested additional evidence', 'ATAS clearance required for course'],
    nextAction: 'Submit ATAS application + updated financials',
  },
];

const COMPLIANCE_ALERTS: ComplianceAlert[] = [
  {
    id: 'ca1', type: 'critical', category: 'Document Deadline',
    message: 'Biometric appointment deadline approaching for 2 cases',
    affectedCases: 2, timestamp: '1 hour ago',
    action: 'Book VAC appointments immediately',
  },
  {
    id: 'ca2', type: 'warning', category: 'ATAS Required',
    message: 'ATAS certificate required for courses in sensitive subjects',
    affectedCases: 1, timestamp: '3 hours ago',
    action: 'Submit ATAS application via FCDO portal',
  },
  {
    id: 'ca3', type: 'warning', category: 'Financial Proof',
    message: 'Financial evidence does not meet 28-day requirement for 1 case',
    affectedCases: 1, timestamp: '5 hours ago',
    action: 'Request updated bank statement from student',
  },
  {
    id: 'ca4', type: 'info', category: 'UKVI Processing Update',
    message: 'Standard processing time extended to 4-6 weeks for Dhaka VAC',
    affectedCases: 3, timestamp: '1 day ago',
    action: 'Update student expectations on timeline',
  },
];

const STATUS_CONFIG: Record<VisaStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: '#6b7280', bg: '#f3f4f6', icon: <Clock className="h-4 w-4" /> },
  processing: { label: 'Processing', color: '#0066CC', bg: '#eff6ff', icon: <RefreshCw className="h-4 w-4" /> },
  bio_requested: { label: 'Biometrics Requested', color: '#f59e0b', bg: '#fffbeb', icon: <AlertCircle className="h-4 w-4" /> },
  additional_docs: { label: 'Additional Docs Required', color: '#d97706', bg: '#fffbeb', icon: <FileText className="h-4 w-4" /> },
  approved: { label: 'Approved', color: '#22c55e', bg: '#f0fdf4', icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', icon: <XCircle className="h-4 w-4" /> },
};

interface UkviCompliancePageProps {
  onBack?: () => void;
}

export function UkviCompliancePage({ onBack }: UkviCompliancePageProps) {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCases = statusFilter === 'all'
    ? VISA_CASES
    : VISA_CASES.filter(c => c.status === statusFilter);

  const pendingCount = VISA_CASES.filter(c => c.status !== 'approved' && c.status !== 'rejected').length;
  const approvedCount = VISA_CASES.filter(c => c.status === 'approved').length;
  const complianceIssues = VISA_CASES.reduce((a, c) => a + c.complianceFlags.length, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="text-white px-4 py-3" style={{ background: `linear-gradient(135deg, ${UKVI_TEAL}, ${NAVY})` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                UKVI Compliance Dashboard
              </h1>
              <p className="text-xs text-white/50">Visa tracking & compliance automation from ukvi-ai-markting_n8n</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-white/20 text-white border-0" style={{ borderRadius: '4px' }}>
              <Bot className="h-3 w-3 mr-1" />
              Auto-Tracked
            </Badge>
          </div>
        </div>
      </header>

      <Tabs defaultValue="cases" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              {[
                { value: 'cases', label: '📋 Visa Cases' },
                { value: 'compliance', label: '⚠️ Compliance Alerts' },
                { value: 'checklist', label: '✅ Pre-Submission Checklist' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0d9488] data-[state=active]:text-[#1a1a2e] data-[state=active]:font-semibold text-[#6b7280] h-10 rounded-none px-4 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Visa Cases Tab */}
        <TabsContent value="cases" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-[#0066CC]" />
                    <span className="text-xs text-[#6b7280]">Pending</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0066CC]">{pendingCount}</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                    <span className="text-xs text-[#6b7280]">Approved</span>
                  </div>
                  <div className="text-2xl font-bold text-[#22c55e]">{approvedCount}</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-[#d97706]" />
                    <span className="text-xs text-[#6b7280]">Compliance Issues</span>
                  </div>
                  <div className="text-2xl font-bold text-[#d97706]">{complianceIssues}</div>
                </CardContent>
              </Card>
              <Card className="border-[#e5e7eb]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4 text-[#0d9488]" />
                    <span className="text-xs text-[#6b7280]">Auto-Tracked</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0d9488]">{VISA_CASES.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {['all', 'pending', 'processing', 'bio_requested', 'additional_docs', 'approved'].map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className={statusFilter === s ? 'bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs' : 'text-xs'}
                  style={{ borderRadius: '6px' }}
                >
                  {s === 'all' ? 'All' : STATUS_CONFIG[s as VisaStatus]?.label || s}
                </Button>
              ))}
            </div>

            {/* Case cards */}
            <div className="space-y-3">
              {filteredCases.map(vc => {
                const statusCfg = STATUS_CONFIG[vc.status];
                return (
                  <Card
                    key={vc.id}
                    className={`border cursor-pointer hover:shadow-md transition-all ${selectedCase === vc.id ? 'border-[#0d9488] ring-1 ring-[#0d9488]/30' : 'border-[#e5e7eb]'}`}
                    onClick={() => setSelectedCase(selectedCase === vc.id ? null : vc.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-[#1a1a2e]">{vc.studentName}</h3>
                            <Badge className="text-xs border-0" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderRadius: '4px' }}>
                              {statusCfg.icon} {statusCfg.label}
                            </Badge>
                            {vc.complianceFlags.length > 0 && (
                              <Badge className="text-xs bg-[#fef2f2] text-[#dc2626] border-0" style={{ borderRadius: '4px' }}>
                                <AlertTriangle className="h-3 w-3 mr-1" /> {vc.complianceFlags.length} issues
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {vc.university}</span>
                            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {vc.course}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#9ca3af] mt-1">
                            <span>CAS: {vc.casNumber}</span>
                            {vc.ukviRef && <span>UKVI: {vc.ukviRef}</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {vc.daysPending > 0 && (
                            <>
                              <div className="text-lg font-bold text-[#1a1a2e]">{vc.daysPending}</div>
                              <div className="text-xs text-[#6b7280]">days pending</div>
                            </>
                          )}
                          {vc.status === 'approved' && (
                            <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
                          )}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {selectedCase === vc.id && (
                        <div className="mt-4 pt-4 border-t border-[#e5e7eb] space-y-4">
                          {/* Next action */}
                          <div className="bg-[#f0fdfa] rounded-lg p-3 border border-[#0d9488]/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="h-4 w-4 text-[#0d9488]" />
                              <span className="text-sm font-semibold text-[#0d9488]">Next Action</span>
                            </div>
                            <p className="text-sm text-[#1a1a2e]">{vc.nextAction}</p>
                          </div>

                          {/* Missing docs */}
                          {vc.missingDocs.length > 0 && (
                            <div className="bg-[#fef2f2] rounded-lg p-3 border border-[#dc2626]/20">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-[#dc2626]" />
                                <span className="text-sm font-semibold text-[#dc2626]">Missing Documents</span>
                              </div>
                              <ul className="space-y-1">
                                {vc.missingDocs.map((doc, i) => (
                                  <li key={i} className="text-sm text-[#4b5563] flex items-center gap-2">
                                    <XCircle className="h-3.5 w-3.5 text-[#dc2626]" />
                                    {doc}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Compliance flags */}
                          {vc.complianceFlags.length > 0 && (
                            <div className="bg-[#fffbeb] rounded-lg p-3 border border-[#f59e0b]/20">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-[#d97706]" />
                                <span className="text-sm font-semibold text-[#d97706]">Compliance Flags</span>
                              </div>
                              <ul className="space-y-1">
                                {vc.complianceFlags.map((flag, i) => (
                                  <li key={i} className="text-sm text-[#4b5563] flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-[#d97706]" />
                                    {flag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Case details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-[#f9fafb] rounded-lg p-3">
                              <div className="text-xs text-[#6b7280] mb-1">Counselor</div>
                              <div className="text-sm font-medium text-[#1a1a2e]">{vc.counselor}</div>
                            </div>
                            <div className="bg-[#f9fafb] rounded-lg p-3">
                              <div className="text-xs text-[#6b7280] mb-1">Submitted</div>
                              <div className="text-sm font-medium text-[#1a1a2e]">{vc.submittedDate}</div>
                            </div>
                            <div className="bg-[#f9fafb] rounded-lg p-3">
                              <div className="text-xs text-[#6b7280] mb-1">Last Update</div>
                              <div className="text-sm font-medium text-[#1a1a2e]">{vc.lastUpdate}</div>
                            </div>
                            <div className="bg-[#f9fafb] rounded-lg p-3">
                              <div className="text-xs text-[#6b7280] mb-1">Visa Type</div>
                              <div className="text-sm font-medium text-[#1a1a2e]">{vc.visaType}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Compliance Alerts Tab */}
        <TabsContent value="compliance" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Alert summary */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                { type: 'critical', count: COMPLIANCE_ALERTS.filter(a => a.type === 'critical').length, color: '#dc2626' },
                { type: 'warning', count: COMPLIANCE_ALERTS.filter(a => a.type === 'warning').length, color: '#d97706' },
                { type: 'info', count: COMPLIANCE_ALERTS.filter(a => a.type === 'info').length, color: '#0066CC' },
              ].map(item => (
                <Card key={item.type} className="border-[#e5e7eb]">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</div>
                    <div className="text-xs text-[#6b7280] capitalize">{item.type} Alerts</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Alert cards */}
            {COMPLIANCE_ALERTS.map(alert => {
              const alertColors = { critical: '#dc2626', warning: '#d97706', info: '#0066CC' };
              const alertBgs = { critical: '#fef2f2', warning: '#fffbeb', info: '#eff6ff' };
              const alertIcons = { critical: <AlertTriangle className="h-5 w-5" />, warning: <AlertCircle className="h-5 w-5" />, info: <Bell className="h-5 w-5" /> };

              return (
                <Card key={alert.id} className="border border-[#e5e7eb] hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alertBgs[alert.type], color: alertColors[alert.type] }}>
                        {alertIcons[alert.type]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="text-xs border-0" style={{ backgroundColor: alertBgs[alert.type], color: alertColors[alert.type], borderRadius: '4px' }}>
                            {alert.category}
                          </Badge>
                          <span className="text-xs text-[#9ca3af]">{alert.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium text-[#1a1a2e] mb-2">{alert.message}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#6b7280]">{alert.affectedCases} cases affected</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="text-xs font-medium" style={{ color: alertColors[alert.type] }}>
                            → {alert.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Pre-Submission Checklist Tab */}
        <TabsContent value="checklist" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-[#0d9488]" />
                  UK Student Visa Pre-Submission Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    category: 'Identity Documents',
                    items: [
                      { name: 'Valid passport (with blank page)', required: true, notes: 'Must be valid for duration of stay' },
                      { name: 'Passport-sized photographs (2)', required: true, notes: 'UK visa photo specifications' },
                    ],
                  },
                  {
                    category: 'University Documents',
                    items: [
                      { name: 'CAS (Confirmation of Acceptance)', required: true, notes: 'Must be within 6 months of application' },
                      { name: 'Unconditional offer letter', required: true, notes: 'Or conditional with met conditions' },
                      { name: 'ATAS certificate (if required)', required: false, notes: 'Required for certain sensitive subjects' },
                    ],
                  },
                  {
                    category: 'Financial Evidence',
                    items: [
                      { name: 'Bank statements (28-day period)', required: true, notes: 'Must show tuition + living costs for 1 year' },
                      { name: 'Sponsor letter (if applicable)', required: false, notes: 'Official sponsor with full funding details' },
                      { name: 'Scholarship letter (if applicable)', required: false, notes: 'Must cover stated amount' },
                    ],
                  },
                  {
                    category: 'Academic Documents',
                    items: [
                      { name: 'Academic transcripts', required: true, notes: 'All qualifications listed in CAS' },
                      { name: 'English test results (IELTS/PTE)', required: true, notes: 'Must meet course requirements' },
                      { name: 'Degree certificates', required: true, notes: 'Certified translations if not in English' },
                    ],
                  },
                  {
                    category: 'Health & Other',
                    items: [
                      { name: 'TB test certificate', required: true, notes: 'Required for Bangladesh nationals' },
                      { name: 'IELTS for UKVI (if SELT required)', required: false, notes: 'Some universities require SELT version' },
                      { name: 'Police certificate (if requested)', required: false, notes: 'UKVI may request for certain cases' },
                    ],
                  },
                ].map((section, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#0d9488]" />
                      {section.category}
                    </h3>
                    <div className="space-y-2 ml-6">
                      {section.items.map((item, j) => (
                        <div key={j} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f9fafb]">
                          <div className={`w-5 h-5 rounded border-2 shrink-0 mt-0.5 ${item.required ? 'border-[#0d9488] bg-[#0d9488]' : 'border-[#d1d5db]'}`}>
                            {item.required && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#1a1a2e]">
                              {item.name}
                              {item.required && <span className="text-[#dc2626] ml-1">*</span>}
                            </div>
                            <div className="text-xs text-[#6b7280]">{item.notes}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {i < 4 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-xs text-[#9ca3af]">* Required items  •  AI-powered document verification available via workflow automation</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
