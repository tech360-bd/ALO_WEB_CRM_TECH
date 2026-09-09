'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bot, Activity, CheckCircle, XCircle, Clock, Zap,
  RefreshCw, Play, Pause, Settings, AlertTriangle,
  TrendingUp, BarChart3, Terminal, ArrowUpRight,
  MoreVertical, Search, Filter, Download, ChevronDown,
  Shield, Brain, FileCheck, Mail, GraduationCap,
  Award, Cpu, Database, ZapOff, Eye, ChevronRight,
} from 'lucide-react';

type AgentStatus = 'Active' | 'Idle' | 'Error';
type LogStatus = 'Success' | 'Failed' | 'Running';

interface AgentCard {
  id: string;
  name: string;
  type: string;
  description: string;
  status: AgentStatus;
  lastRun: string;
  successRate: number;
  tasksCompleted: number;
  tasksPerDay: number;
  enabled: boolean;
  icon: React.ElementType;
  color: string;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  input: string;
  output: string;
  status: LogStatus;
  duration: string;
}

const statusDotColors: Record<AgentStatus, string> = {
  Active: 'bg-green-500',
  Idle: 'bg-yellow-500',
  Error: 'bg-red-500',
};

const statusBadgeColors: Record<AgentStatus, string> = {
  Active: 'bg-green-100 text-green-700',
  Idle: 'bg-yellow-100 text-yellow-700',
  Error: 'bg-red-100 text-red-700',
};

const logStatusColors: Record<LogStatus, string> = {
  Success: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Running: 'bg-blue-100 text-blue-700',
};

const logStatusIcons: Record<LogStatus, React.ElementType> = {
  Success: CheckCircle,
  Failed: XCircle,
  Running: RefreshCw,
};

const defaultAgents: AgentCard[] = [
  {
    id: 'AGT-001', name: 'Lead Qualifier', type: 'Lead Management',
    description: 'Automatically qualifies incoming leads based on criteria such as GPA, IELTS score, budget, and destination preference.',
    status: 'Active', lastRun: '2 min ago', successRate: 97.2, tasksCompleted: 14520,
    tasksPerDay: 156, enabled: true, icon: Filter, color: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'AGT-002', name: 'Document Validator', type: 'Document Processing',
    description: 'Validates uploaded student documents against university requirements. Checks completeness, format, and authenticity.',
    status: 'Active', lastRun: '5 min ago', successRate: 94.8, tasksCompleted: 8734,
    tasksPerDay: 89, enabled: true, icon: FileCheck, color: 'text-emerald-600 bg-emerald-100',
  },
  {
    id: 'AGT-003', name: 'Email Responder', type: 'Communication',
    description: 'Generates and sends personalized email responses for common student inquiries about applications, visas, and documents.',
    status: 'Idle', lastRun: '18 min ago', successRate: 91.5, tasksCompleted: 23450,
    tasksPerDay: 312, enabled: true, icon: Mail, color: 'text-purple-600 bg-purple-100',
  },
  {
    id: 'AGT-004', name: 'Visa Checker', type: 'Visa Compliance',
    description: 'Monitors visa processing status and alerts when actions are needed. Tracks application deadlines and document expiry.',
    status: 'Active', lastRun: '1 min ago', successRate: 99.1, tasksCompleted: 5678,
    tasksPerDay: 45, enabled: true, icon: Shield, color: 'text-red-600 bg-red-100',
  },
  {
    id: 'AGT-005', name: 'Course Matcher', type: 'Academic Matching',
    description: 'Matches students with suitable courses based on their academic profile, interests, and career goals using NLP analysis.',
    status: 'Active', lastRun: '8 min ago', successRate: 96.3, tasksCompleted: 18920,
    tasksPerDay: 198, enabled: true, icon: GraduationCap, color: 'text-orange-600 bg-orange-100',
  },
  {
    id: 'AGT-006', name: 'Scholarship Finder', type: 'Financial Aid',
    description: 'Searches and matches available scholarships based on student nationality, program, GPA, and other eligibility criteria.',
    status: 'Error', lastRun: '45 min ago', successRate: 88.7, tasksCompleted: 7650,
    tasksPerDay: 67, enabled: false, icon: Award, color: 'text-amber-600 bg-amber-100',
  },
];

const defaultActivityLog: ActivityLogEntry[] = [
  { id: 'LOG-001', timestamp: '2025-06-28T10:45:00', agent: 'Lead Qualifier', action: 'Qualified Lead', input: 'New lead: Arif Rahman, BUET, CGPA 3.7', output: 'Score: 92/100 - High Priority Lead', status: 'Success', duration: '0.8s' },
  { id: 'LOG-002', timestamp: '2025-06-28T10:44:00', agent: 'Document Validator', action: 'Validated Documents', input: 'Passport + Transcript upload for Sakib H.', output: 'Pass: All documents valid and complete', status: 'Success', duration: '1.2s' },
  { id: 'LOG-003', timestamp: '2025-06-28T10:43:00', agent: 'Email Responder', action: 'Generated Response', input: 'Student inquiry: Visa processing time', output: 'Sent personalized visa guidance email', status: 'Success', duration: '2.1s' },
  { id: 'LOG-004', timestamp: '2025-06-28T10:42:00', agent: 'Visa Checker', action: 'Status Check', input: 'UK Visa App: VAF-2025-08923', output: 'Application in processing stage. ETA: 3 weeks', status: 'Success', duration: '3.4s' },
  { id: 'LOG-005', timestamp: '2025-06-28T10:40:00', agent: 'Course Matcher', action: 'Matched Courses', input: 'Profile: BSc CS, BUET, CGPA 3.7', output: 'Top 5: UCL, Imperial, Manchester, Edinburgh, Warwick', status: 'Success', duration: '1.5s' },
  { id: 'LOG-006', timestamp: '2025-06-28T10:38:00', agent: 'Scholarship Finder', action: 'Search Scholarships', input: 'UK, MSc CS, CGPA 3.7, Bangladesh', output: 'Error: External API timeout after 30s', status: 'Failed', duration: '30.0s' },
  { id: 'LOG-007', timestamp: '2025-06-28T10:35:00', agent: 'Lead Qualifier', action: 'Qualified Lead', input: 'New lead: Fatima B., IELTS 6.5, UK interest', output: 'Score: 78/100 - Medium Priority Lead', status: 'Success', duration: '0.9s' },
  { id: 'LOG-008', timestamp: '2025-06-28T10:33:00', agent: 'Document Validator', action: 'Validated Documents', input: 'IELTS certificate scan for Nusrat J.', output: 'Fail: IELTS certificate expired (issued 2019)', status: 'Failed', duration: '1.1s' },
  { id: 'LOG-009', timestamp: '2025-06-28T10:30:00', agent: 'Email Responder', action: 'Generated Response', input: 'Student inquiry: Scholarship deadline', output: 'Sent scholarship application checklist email', status: 'Success', duration: '1.8s' },
  { id: 'LOG-010', timestamp: '2025-06-28T10:28:00', agent: 'Course Matcher', action: 'Matched Courses', input: 'Profile: BBA, NSU, CGPA 3.85', output: 'Top 5: Leeds, Birmingham, Sheffield, Nottingham, Aston', status: 'Success', duration: '1.3s' },
  { id: 'LOG-011', timestamp: '2025-06-28T10:25:00', agent: 'Visa Checker', action: 'Deadline Alert', input: 'Monitoring 12 active visa applications', output: 'Alert: 2 applications nearing decision deadline', status: 'Success', duration: '4.2s' },
  { id: 'LOG-012', timestamp: '2025-06-28T10:22:00', agent: 'Document Validator', action: 'Validated Documents', input: 'Financial docs for Tanvir A.', output: 'Warning: Bank statement needs re-verification', status: 'Success', duration: '1.6s' },
];

export default function CrmAgentOperationsPage() {
  const [agents, setAgents] = useState<AgentCard[]>(defaultAgents);
  const [activityLog] = useState<ActivityLogEntry[]>(defaultActivityLog);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AgentStatus | 'all'>('all');

  const filteredAgents = agents.filter(agent => {
    if (filterStatus !== 'all' && agent.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return agent.name.toLowerCase().includes(q) || agent.type.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredLog = activityLog.filter(entry => {
    if (selectedAgent && entry.agent !== selectedAgent) return false;
    return true;
  });

  const activeCount = agents.filter(a => a.status === 'Active').length;
  const idleCount = agents.filter(a => a.status === 'Idle').length;
  const errorCount = agents.filter(a => a.status === 'Error').length;
  const totalTasks = agents.reduce((acc, a) => acc + a.tasksCompleted, 0);
  const avgSuccess = (agents.reduce((acc, a) => acc + a.successRate, 0) / agents.length).toFixed(1);

  const handleToggleAgent = (agentId: string) => {
    setAgents(agents.map(a => {
      if (a.id === agentId) {
        const newEnabled = !a.enabled;
        return {
          ...a,
          enabled: newEnabled,
          status: newEnabled ? 'Active' : 'Idle',
        };
      }
      return a;
    }));
  };

  const handleRestartAgent = (agentId: string) => {
    setAgents(agents.map(a => a.id === agentId ? { ...a, status: 'Active', lastRun: 'Just now' } : a));
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Agent Operations</h1>
            <p className="text-sm text-gray-500">Monitor and manage your AI agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-1" />
            Health Check
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg"><Zap className="h-4 w-4 text-green-600" /></div>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{activeCount}</p>
            <p className="text-xs text-gray-500">Active Agents</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-4 w-4 text-yellow-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{idleCount}</p>
            <p className="text-xs text-gray-500">Idle Agents</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-4 w-4 text-red-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{errorCount}</p>
            <p className="text-xs text-gray-500">Error State</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 className="h-4 w-4 text-blue-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{totalTasks.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Tasks Completed</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="h-4 w-4 text-orange-600" /></div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">+0.3%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{avgSuccess}%</p>
            <p className="text-xs text-gray-500">Avg Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Agent Registry</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search agents..." className="pl-9 h-8 text-xs w-48" />
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden">
              {(['all', 'Active', 'Idle', 'Error'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAgents.map(agent => {
            const AgentIcon = agent.icon;
            return (
              <Card key={agent.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agent.color}`}>
                        <AgentIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                          <span className={`w-2 h-2 rounded-full ${statusDotColors[agent.status]} ${agent.status === 'Active' ? 'animate-pulse' : ''}`} />
                        </div>
                        <p className="text-xs text-gray-500">{agent.type}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${statusBadgeColors[agent.status]}`}>{agent.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{agent.description}</p>
                  <Separator className="mb-3" />
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{agent.successRate}%</p>
                      <p className="text-[10px] text-gray-400">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{agent.tasksPerDay}</p>
                      <p className="text-[10px] text-gray-400">Tasks/Day</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{(agent.tasksCompleted / 1000).toFixed(1)}K</p>
                      <p className="text-[10px] text-gray-400">Total Tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400">Last run: {agent.lastRun}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-[10px] px-2 ${agent.enabled ? 'text-green-600 border-green-300 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => handleToggleAgent(agent.id)}
                      >
                        {agent.enabled ? <Play className="h-3 w-3 mr-0.5" /> : <Pause className="h-3 w-3 mr-0.5" />}
                        {agent.enabled ? 'Enabled' : 'Disabled'}
                      </Button>
                      {agent.status === 'Error' && (
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleRestartAgent(agent.id)}>
                          <RefreshCw className="h-3 w-3 mr-0.5" />
                          Restart
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${selectedAgent === null ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  All Agents
                </button>
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.name)}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${selectedAgent === agent.name ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Timestamp</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Agent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Action</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Input</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Output</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.map(entry => {
                  const LogIcon = logStatusIcons[entry.status];
                  return (
                    <tr key={entry.id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-[10px]">{entry.agent}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{entry.action}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[200px] truncate">{entry.input}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[200px] truncate">{entry.output}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge className={`text-[10px] ${logStatusColors[entry.status]}`}>
                          <LogIcon className="h-3 w-3 mr-0.5" />
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500">{entry.duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Health Indicators */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm font-semibold">System Health</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {agents.map(agent => (
              <div key={agent.id} className="border rounded-lg p-3 flex flex-col items-center gap-2">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${agent.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <agent.icon className={`h-5 w-5 ${agent.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDotColors[agent.status]} ${agent.status === 'Active' ? 'animate-pulse' : ''}`} />
                </div>
                <p className="text-xs font-medium text-gray-700 text-center">{agent.name}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden`}>
                    <div
                      className={`h-full rounded-full transition-all ${agent.successRate >= 95 ? 'bg-green-500' : agent.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${agent.successRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{agent.successRate}%</span>
                </div>
                <p className="text-[10px] text-gray-400">{agent.lastRun}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
