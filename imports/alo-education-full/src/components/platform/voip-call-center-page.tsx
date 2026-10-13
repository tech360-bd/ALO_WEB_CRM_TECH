'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, PhoneCall, PhoneOff, PhoneMissed,
  Mic, Play, Pause, Square, Clock, Users, Search,
  BarChart3, TrendingUp, Calendar, CheckCircle2,
  XCircle, AlertCircle, Plus, Filter, Volume2,
  ChevronDown, RefreshCw, MessageSquare, Timer,
  PhoneForwarded, Voicemail, UserCheck, UserX, Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
} from 'recharts';

/* ─── Brand Colors ─── */
const ALO_BLUE = '#0052B8';
const ALO_ORANGE = '#E8501A';

/* ─── Types ─── */
interface VoipCallCenterPageProps {
  onBack: () => void;
}

interface CallRecord {
  id: string;
  callerName: string;
  callerPhone: string;
  calleeName: string;
  direction: 'INBOUND' | 'OUTBOUND';
  outcome: 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
  duration: number; // seconds
  recordingUrl?: string;
  notes?: string;
  scheduledAt?: string;
  createdAt: string;
  agentName: string;
}

interface ScheduledCall {
  id: string;
  contactName: string;
  phone: string;
  scheduledAt: string;
  purpose: string;
  agentName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

/* ─── Mock Data ─── */
const CALL_RECORDS: CallRecord[] = [
  { id: '1', callerName: 'Rahim Uddin', callerPhone: '+880171234567', calleeName: 'Counselor Fatima', direction: 'OUTBOUND', outcome: 'ANSWERED', duration: 342, recordingUrl: '/recordings/call-1.mp3', notes: 'Discussed UK university options. Student interested in UCL and King\'s College.', createdAt: '2025-01-28T10:30:00Z', agentName: 'Fatima Begum' },
  { id: '2', callerName: 'Sara Ahmed', callerPhone: '+880189876543', calleeName: 'Counselor Amir', direction: 'INBOUND', outcome: 'ANSWERED', duration: 198, recordingUrl: '/recordings/call-2.mp3', notes: 'Visa document query resolved.', createdAt: '2025-01-28T11:00:00Z', agentName: 'Amir Siddiqui' },
  { id: '3', callerName: 'Karim Hossain', callerPhone: '+880151234567', calleeName: 'Counselor Fatima', direction: 'OUTBOUND', outcome: 'VOICEMAIL', duration: 45, recordingUrl: '/recordings/call-3.mp3', createdAt: '2025-01-28T11:30:00Z', agentName: 'Fatima Begum' },
  { id: '4', callerName: 'Nusrat Jahan', callerPhone: '+880167890123', calleeName: 'Counselor Rina', direction: 'OUTBOUND', outcome: 'NO_ANSWER', duration: 0, createdAt: '2025-01-28T12:00:00Z', agentName: 'Rina Akter' },
  { id: '5', callerName: 'Imran Khan', callerPhone: '+880134567890', calleeName: 'Counselor Amir', direction: 'OUTBOUND', outcome: 'BUSY', duration: 0, createdAt: '2025-01-28T12:15:00Z', agentName: 'Amir Siddiqui' },
  { id: '6', callerName: 'Tasnim Rahman', callerPhone: '+880175678901', calleeName: 'Counselor Fatima', direction: 'INBOUND', outcome: 'ANSWERED', duration: 520, recordingUrl: '/recordings/call-6.mp3', notes: 'Scholarship application walkthrough completed.', createdAt: '2025-01-28T14:00:00Z', agentName: 'Fatima Begum' },
  { id: '7', callerName: 'Mina Akter', callerPhone: '+880199999001', calleeName: 'Counselor Rina', direction: 'OUTBOUND', outcome: 'ANSWERED', duration: 156, recordingUrl: '/recordings/call-7.mp3', notes: 'Follow-up on document submission.', createdAt: '2025-01-28T15:00:00Z', agentName: 'Rina Akter' },
  { id: '8', callerName: 'Rafi Islam', callerPhone: '+880188888002', calleeName: 'Counselor Amir', direction: 'OUTBOUND', outcome: 'FAILED', duration: 0, createdAt: '2025-01-28T15:30:00Z', agentName: 'Amir Siddiqui' },
];

const SCHEDULED_CALLS: ScheduledCall[] = [
  { id: '1', contactName: 'Rahim Uddin', phone: '+880171234567', scheduledAt: '2025-01-29T10:00:00Z', purpose: 'Application status follow-up', agentName: 'Fatima Begum', status: 'PENDING' },
  { id: '2', contactName: 'Sara Ahmed', phone: '+880189876543', scheduledAt: '2025-01-29T11:00:00Z', purpose: 'Visa interview prep', agentName: 'Amir Siddiqui', status: 'PENDING' },
  { id: '3', contactName: 'Nusrat Jahan', phone: '+880167890123', scheduledAt: '2025-01-29T14:00:00Z', purpose: 'Document collection', agentName: 'Rina Akter', status: 'PENDING' },
  { id: '4', contactName: 'Karim Hossain', phone: '+880151234567', scheduledAt: '2025-01-28T11:30:00Z', purpose: 'Scholarship discussion', agentName: 'Fatima Begum', status: 'COMPLETED' },
];

const CALL_VOLUME_DATA = [
  { day: 'Mon', inbound: 12, outbound: 18 },
  { day: 'Tue', inbound: 15, outbound: 22 },
  { day: 'Wed', inbound: 10, outbound: 25 },
  { day: 'Thu', inbound: 18, outbound: 20 },
  { day: 'Fri', inbound: 14, outbound: 16 },
  { day: 'Sat', inbound: 8, outbound: 6 },
];

const OUTCOME_DATA = [
  { name: 'Answered', value: 62, color: '#10B981' },
  { name: 'Voicemail', value: 15, color: ALO_ORANGE },
  { name: 'No Answer', value: 13, color: '#F59E0B' },
  { name: 'Busy', value: 6, color: '#EF4444' },
  { name: 'Failed', value: 4, color: '#6B7280' },
];

const DURATION_DATA = [
  { hour: '9am', avg: 120 },
  { hour: '10am', avg: 185 },
  { hour: '11am', avg: 210 },
  { hour: '12pm', avg: 165 },
  { hour: '1pm', avg: 95 },
  { hour: '2pm', avg: 230 },
  { hour: '3pm', avg: 195 },
  { hour: '4pm', avg: 150 },
  { hour: '5pm', avg: 110 },
];

/* ─── Outcome Config ─── */
const OUTCOME_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  ANSWERED: { color: 'bg-emerald-50 text-emerald-700', icon: PhoneCall, label: 'Answered' },
  VOICEMAIL: { color: 'bg-amber-50 text-amber-700', icon: Voicemail, label: 'Voicemail' },
  NO_ANSWER: { color: 'bg-slate-100 text-slate-600', icon: PhoneMissed, label: 'No Answer' },
  BUSY: { color: 'bg-red-50 text-red-600', icon: PhoneOff, label: 'Busy' },
  FAILED: { color: 'bg-red-50 text-red-700', icon: AlertCircle, label: 'Failed' },
};

const SCHEDULED_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-amber-50 text-amber-700', label: 'Pending' },
  IN_PROGRESS: { color: 'bg-blue-50 text-blue-700', label: 'In Progress' },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
  CANCELLED: { color: 'bg-slate-100 text-slate-600', label: 'Cancelled' },
};

/* ─── Helpers ─── */
function formatDuration(seconds: number): string {
  if (seconds === 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Component ─── */
export function VoipCallCenterPage({ onBack }: VoipCallCenterPageProps) {
  const [activeTab, setActiveTab] = useState('call-log');
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [playingCall, setPlayingCall] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showIvrDialog, setShowIvrDialog] = useState(false);

  const filteredCalls = CALL_RECORDS.filter(c => {
    const matchSearch = c.callerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.callerPhone.includes(searchTerm) || (c.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchOutcome = outcomeFilter === 'ALL' || c.outcome === outcomeFilter;
    const matchDirection = directionFilter === 'ALL' || c.direction === directionFilter;
    return matchSearch && matchOutcome && matchDirection;
  });

  const totalCalls = CALL_RECORDS.length;
  const answeredCalls = CALL_RECORDS.filter(c => c.outcome === 'ANSWERED').length;
  const avgDuration = Math.round(CALL_RECORDS.filter(c => c.duration > 0).reduce((a, c) => a + c.duration, 0) / CALL_RECORDS.filter(c => c.duration > 0).length);
  const connectionRate = ((answeredCalls / totalCalls) * 100).toFixed(1);

  const togglePlayback = (callId: string) => {
    setPlayingCall(prev => prev === callId ? null : callId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">VoIP Call Center</h1>
              <p className="text-xs text-slate-500">Call management, recordings & analytics</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowIvrDialog(true)}>
              <MessageSquare className="w-4 h-4" /> IVR Menu
            </Button>
            <Button size="sm" className="gap-1.5 text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setShowScheduleDialog(true)}>
              <Calendar className="w-4 h-4" /> Schedule Call
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Calls Today', value: totalCalls.toString(), icon: Phone, color: ALO_BLUE, sub: '+5 vs yesterday' },
            { label: 'Connection Rate', value: `${connectionRate}%`, icon: UserCheck, color: '#10B981', sub: `${answeredCalls} answered` },
            { label: 'Avg Duration', value: formatDuration(avgDuration), icon: Timer, color: ALO_ORANGE, sub: 'Per connected call' },
            { label: 'Recordings', value: CALL_RECORDS.filter(c => c.recordingUrl).length.toString(), icon: Mic, color: '#8B5CF6', sub: 'Available for playback' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white shadow-sm border">
            <TabsTrigger value="call-log" className="gap-1.5"><Phone className="w-4 h-4" /> Call Log</TabsTrigger>
            <TabsTrigger value="recordings" className="gap-1.5"><Mic className="w-4 h-4" /> Recordings</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="w-4 h-4" /> Schedule</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
          </TabsList>

          {/* ── Call Log Tab ── */}
          <TabsContent value="call-log">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search calls..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
              </div>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-36 bg-white"><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Outcomes</SelectItem>
                  <SelectItem value="ANSWERED">Answered</SelectItem>
                  <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
                  <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                  <SelectItem value="BUSY">Busy</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-32 bg-white"><SelectValue placeholder="Direction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="INBOUND">Inbound</SelectItem>
                  <SelectItem value="OUTBOUND">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.map(call => {
                      const oc = OUTCOME_CONFIG[call.outcome] || OUTCOME_CONFIG.FAILED;
                      return (
                        <TableRow key={call.id}>
                          <TableCell className="font-medium">{call.callerName}</TableCell>
                          <TableCell className="text-sm text-slate-500 font-mono">{call.callerPhone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              {call.direction === 'INBOUND' ? <PhoneCall className="w-3 h-3" /> : <PhoneForwarded className="w-3 h-3" />}
                              {call.direction === 'INBOUND' ? 'In' : 'Out'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{call.agentName}</TableCell>
                          <TableCell>
                            <Badge className={oc.color}>
                              <oc.icon className="w-3 h-3 mr-1" />{oc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{formatDuration(call.duration)}</TableCell>
                          <TableCell className="text-xs text-slate-400">{new Date(call.createdAt).toLocaleTimeString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {call.recordingUrl && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePlayback(call.id)}>
                                  {playingCall === call.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: ALO_ORANGE }}>
                                <Phone className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Recordings Tab ── */}
          <TabsContent value="recordings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CALL_RECORDS.filter(c => c.recordingUrl).map((call, i) => (
                <motion.div key={call.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">{call.callerName}</p>
                          <p className="text-xs text-slate-500 font-mono">{call.callerPhone}</p>
                        </div>
                        <Badge className={OUTCOME_CONFIG[call.outcome]?.color || ''}>
                          {OUTCOME_CONFIG[call.outcome]?.label}
                        </Badge>
                      </div>
                      {call.notes && (
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{call.notes}</p>
                      )}
                      {/* Audio Player Mock */}
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => togglePlayback(call.id)}>
                          {playingCall === call.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: playingCall === call.id ? '45%' : '0%', backgroundColor: ALO_BLUE, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-mono shrink-0">{formatDuration(call.duration)}</span>
                        <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(call.createdAt).toLocaleString()} · Agent: {call.agentName}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ── Schedule Tab ── */}
          <TabsContent value="schedule">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Upcoming Scheduled Calls</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Scheduled For</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {SCHEDULED_CALLS.map(sc => {
                          const ssc = SCHEDULED_STATUS_CONFIG[sc.status] || SCHEDULED_STATUS_CONFIG.PENDING;
                          return (
                            <TableRow key={sc.id}>
                              <TableCell className="font-medium">{sc.contactName}</TableCell>
                              <TableCell className="text-sm text-slate-500 font-mono">{sc.phone}</TableCell>
                              <TableCell className="text-sm">{new Date(sc.scheduledAt).toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-slate-600 max-w-[150px] truncate">{sc.purpose}</TableCell>
                              <TableCell className="text-sm text-slate-500">{sc.agentName}</TableCell>
                              <TableCell><Badge className={ssc.color}>{ssc.label}</Badge></TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {sc.status === 'PENDING' && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: '#10B981' }}><Phone className="w-3.5 h-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400"><XCircle className="w-3.5 h-3.5" /></Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Contact</label>
                      <Input placeholder="Name or phone" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Date & Time</label>
                      <Input type="datetime-local" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Purpose</label>
                      <Select>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="follow-up">Follow-Up</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="document">Document Collection</SelectItem>
                          <SelectItem value="visa">Visa Interview Prep</SelectItem>
                          <SelectItem value="scholarship">Scholarship Discussion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full text-white gap-1.5" style={{ backgroundColor: ALO_ORANGE }}>
                      <Calendar className="w-4 h-4" /> Schedule Call
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Call Volume (This Week)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={CALL_VOLUME_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="inbound" fill={ALO_BLUE} name="Inbound" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outbound" fill={ALO_ORANGE} name="Outbound" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Call Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RPieChart>
                      <Pie data={OUTCOME_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {OUTCOME_DATA.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avg Call Duration by Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={DURATION_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit="s" />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg" stroke={ALO_BLUE} strokeWidth={2} name="Avg Duration (s)" dot={{ r: 4, fill: ALO_BLUE }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Calls This Week', value: '87', change: '+12%', up: true },
                      { label: 'Connection Rate', value: `${connectionRate}%`, change: '+3.5%', up: true },
                      { label: 'Avg Call Duration', value: formatDuration(avgDuration), change: '+15s', up: true },
                      { label: 'Voicemail Rate', value: '15.2%', change: '-2.1%', up: true },
                      { label: 'Callback Rate', value: '8.4%', change: '+1.2%', up: true },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-600">{m.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{m.value}</span>
                          <span className={`text-xs flex items-center gap-0.5 ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>
                            <TrendingUp className="w-3 h-3" />{m.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Call Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: ALO_ORANGE }} /> Schedule a Call
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Contact Name</label>
              <Input placeholder="e.g. Rahim Uddin" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Phone Number</label>
              <Input placeholder="e.g. +880171234567" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Schedule Date & Time</label>
              <Input type="datetime-local" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Purpose</label>
              <Select>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow-up">Follow-Up</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="document">Document Collection</SelectItem>
                  <SelectItem value="visa">Visa Interview Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Assign Agent</label>
              <Select>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fatima">Fatima Begum</SelectItem>
                  <SelectItem value="amir">Amir Siddiqui</SelectItem>
                  <SelectItem value="rina">Rina Akter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="text-white" style={{ backgroundColor: ALO_ORANGE }}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IVR Menu Dialog */}
      <Dialog open={showIvrDialog} onOpenChange={setShowIvrDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: '#10B981' }} /> IVR Menu Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">Configure your Interactive Voice Response menu:</p>
            <div className="space-y-2">
              {[
                { key: '1', label: 'Admissions Inquiry', action: 'Route to Admissions Team' },
                { key: '2', label: 'Visa & Immigration', action: 'Route to Visa Team' },
                { key: '3', label: 'Scholarship Information', action: 'Play Scholarship Info' },
                { key: '4', label: 'Document Status', action: 'Route to Application Team' },
                { key: '5', label: 'Speak to Counselor', action: 'Route to Available Counselor' },
                { key: '0', label: 'Main Menu / Repeat', action: 'Replay Menu' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-sm" style={{ color: ALO_BLUE }}>
                    {item.key}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.action}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="text-white" style={{ backgroundColor: '#10B981' }}>Save IVR Config</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
