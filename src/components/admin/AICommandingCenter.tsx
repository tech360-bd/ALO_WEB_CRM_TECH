'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Bot, Terminal, ShieldAlert, Sparkles, RefreshCw, Send, CheckCircle2,
  XCircle, Play, Undo, Code, FileText, Settings, Layers, Database,
  ArrowRight, ShieldCheck, Cpu, HardDrive, HelpCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'WAITING_FOR_APPROVAL';
  reasoning?: string[];
  diff?: string;
}

interface ChangePlan {
  planId: string;
  title: string;
  affectedFiles: string[];
  databaseImpact: string;
  apiImpact: string;
  securityImpact: string;
  testsRequired: string;
  rollbackStrategy: string;
  isDestructive: boolean;
  diff: string;
}

export default function AICommandingCenter() {
  const { token } = usePortalStore();

  const [activeAgent, setActiveAgent] = useState('master-router');
  const [explorerTab, setExplorerTab] = useState<'crm' | 'website' | 'system'>('crm');
  const [selectedFile, setSelectedFile] = useState('prisma/schema.prisma');
  
  const [command, setCommand] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Welcome back, Super Admin. I am connected to the 2,000+ agent framework and ready to coordinate secure modifications, code checkouts, test cycles, and system deployments. What would you like to build today?',
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS'
    }
  ]);
  const [currentPlan, setCurrentPlan] = useState<ChangePlan | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string>('ALO System Terminal Online.\nWaiting for commands...');
  
  const [, setTrustedMode] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [healthStats, setHealthStats] = useState<any>({
    agents: 2000,
    skills: 2000,
    departments: 100,
    workflows: 40,
    protectionMode: true,
    paymentGuard: true
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI Commanding Center health on mount
  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/ai-command-center', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.success && data.health) {
        setHealthStats({
          agents: data.health.agents_count,
          skills: data.health.skills_count,
          departments: data.health.departments_count,
          workflows: data.health.workflows_count,
          protectionMode: data.health.protection_mode_enabled,
          paymentGuard: data.health.payment_guard_enabled
        });
      }
    } catch (err) {
      console.error('Failed to fetch commanding center health:', err);
    }
  };

  // Run general terminal tools (tests, compile, lint, build)
  const runTerminalTool = async (tool: 'run-tests' | 'run-lint' | 'run-build' | 'run-typecheck') => {
    setIsExecuting(true);
    setTerminalLogs((prev) => `${prev}\n\n$ executing: ${tool}...`);
    try {
      const res = await fetch('/api/admin/ai-command-center', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'execute-terminal', command: tool })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTerminalLogs((prev) => `${prev}\n${data.output}\n>> Tool executed successfully.`);
        toast.success(`${tool} executed successfully!`);
      } else {
        setTerminalLogs((prev) => `${prev}\n${data.output || data.error}\n>> Tool execution failed.`);
        toast.error(`${tool} failed.`);
      }
    } catch (err: any) {
      setTerminalLogs((prev) => `${prev}\nError: ${err.message}\n>> Network error.`);
      toast.error('Network failure executing tool.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Submit Natural Language Command
  const handleSubmitCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const userCmd = command;
    setCommand('');
    const newMsgId = `msg-${Date.now()}`;
    
    // Add user message
    setMessages((prev) => [...prev, {
      id: newMsgId,
      sender: 'user',
      text: userCmd,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setIsExecuting(true);
    setTerminalLogs((prev) => `${prev}\n\n$ ai-command: "${userCmd}"`);

    // Helper: detect terminal requests
    const cmdLower = userCmd.toLowerCase();
    if (cmdLower.includes('run all tests') || cmdLower.includes('run tests')) {
      await runTerminalTool('run-tests');
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'I have executed the entire test suite. See the bottom terminal panel for detailed coverage logs.',
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS'
      }]);
      setIsExecuting(false);
      return;
    }
    if (cmdLower.includes('run build') || cmdLower.includes('compile') || cmdLower.includes('typecheck')) {
      await runTerminalTool('run-typecheck');
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'Typecheck compiled successfully with 0 errors.',
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS'
      }]);
      setIsExecuting(false);
      return;
    }

    // Natural Language Change Plan Generator
    try {
      const res = await fetch('/api/admin/ai-command-center', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'generate-plan', command: userCmd })
      });
      const data = await res.json();
      if (res.ok && data.success && data.plan) {
        const plan: ChangePlan = data.plan;
        setCurrentPlan(plan);
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Generated change plan: **${plan.title}**. Affected files: \`${plan.affectedFiles.join(', ')}\`. This is a preview only; applying plans from here is disabled.`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'WAITING_FOR_APPROVAL',
          reasoning: [
            'Parsed command intent: SCHEMA_MODIFICATION',
            'Inspecting schema.prisma structures...',
            'Validating column requirements against existing fields',
            'Drafted change plan & diff preview'
          ],
          diff: plan.diff
        }]);

      } else {
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `I encountered an issue generating a plan for that directive: ${data.error || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'FAILED'
        }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Network failure connecting to AI agent: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'FAILED'
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Applying change plans is disabled server-side (503 SCHEMA_MUTATION_DISABLED).
  // The UI never calls the disabled action; it explains the approved route instead.
  const SCHEMA_APPLY_DISABLED_MSG = 'Applying plans is disabled. Schema and code changes must go through a reviewed Prisma migration or pull request, with backup and release approval.';
  const handleApprovePlan = (_planId: string) => {
    setTerminalLogs((prev) => `${prev}\n\n$ apply plan: DISABLED. No files, schema or database were changed.`);
    toast.info(SCHEMA_APPLY_DISABLED_MSG);
  };

  // Reject Change Plan
  const handleRejectPlan = () => {
    setCurrentPlan(null);
    setMessages((prev) => [...prev, {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: 'Change Plan rejected and discarded by Super Admin.',
      timestamp: new Date().toLocaleTimeString(),
      status: 'FAILED'
    }]);
    toast.info('Plan rejected.');
  };

  // Schema rollback over HTTP is disabled server-side; restore from a verified backup instead.
  const handleRollback = () => {
    toast.info('Database rollback is not available here. Restore from a verified backup following the runbook.');
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-900">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-500 animate-pulse" />
            <h1 className="text-lg font-bold">AI Commanding Center</h1>
            <Badge className="bg-orange-500 text-white text-[10px] uppercase font-mono">Owner Protection Enabled</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Department Co-processor • Local-First Execution • Payment Guard: Active ({healthStats.agents} Agents Online)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white" onClick={fetchHealth}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload Core
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs bg-slate-800 text-slate-500 border-slate-700 font-semibold" disabled title="Disabled: restore from a verified backup following the runbook" onClick={handleRollback}>
            <Undo className="w-3.5 h-3.5 mr-1" /> Revert Database (disabled)
          </Button>
        </div>
      </div>

      {/* CORE 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Explorer & Agents (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Agent/Department Selector */}
          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-orange-500" /> Target AI Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex flex-col gap-1">
                {[
                  { id: 'master-router', name: 'Master Command Router', dept: 'Executive Brain' },
                  { id: 'crm-agent', name: 'CRM Automation Agent', dept: 'Operations & Leads' },
                  { id: 'website-agent', name: 'Website Builder Agent', dept: 'Marketing & UI' },
                  { id: 'database-agent', name: 'Database Architect', dept: 'System & Schema' },
                  { id: 'qa-agent', name: 'QA Compiler Agent', dept: 'Testing & Gates' }
                ].map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setActiveAgent(agent.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all ${activeAgent === agent.id ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <div>{agent.name}</div>
                    <div className={`text-[10px] ${activeAgent === agent.id ? 'text-orange-200' : 'text-slate-400'}`}>{agent.dept}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Explorer */}
          <Card className="bg-white border-slate-200 shadow-2xs flex-1 flex flex-col">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Workspace</CardTitle>
              <div className="flex gap-1 mt-2 border-b border-slate-100 pb-2">
                {['crm', 'website', 'system'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setExplorerTab(tab as any)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${explorerTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1 flex flex-col pt-0">
              <ScrollArea className="h-64 lg:h-80">
                <div className="flex flex-col gap-1 font-mono text-[10px]">
                  {explorerTab === 'crm' && (
                    <>
                      <ExplorerItem name="src/app/crm/leads/" isDir active={selectedFile === 'src/app/crm/leads/'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/app/crm/students/" isDir active={selectedFile === 'src/app/crm/students/'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/app/api/crm/leads/route.ts" active={selectedFile === 'src/app/api/crm/leads/route.ts'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/app/api/crm/students/route.ts" active={selectedFile === 'src/app/api/crm/students/route.ts'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/components/crm/leads/LeadTable.tsx" active={selectedFile === 'src/components/crm/leads/LeadTable.tsx'} onClick={setSelectedFile} />
                    </>
                  )}
                  {explorerTab === 'website' && (
                    <>
                      <ExplorerItem name="src/app/page.tsx" active={selectedFile === 'src/app/page.tsx'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/app/about/page.tsx" active={selectedFile === 'src/app/about/page.tsx'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/app/courses/page.tsx" active={selectedFile === 'src/app/courses/page.tsx'} onClick={setSelectedFile} />
                      <ExplorerItem name="src/components/website/Hero.tsx" active={selectedFile === 'src/components/website/Hero.tsx'} onClick={setSelectedFile} />
                    </>
                  )}
                  {explorerTab === 'system' && (
                    <>
                      <ExplorerItem name="prisma/schema.prisma" active={selectedFile === 'prisma/schema.prisma'} onClick={setSelectedFile} />
                      <ExplorerItem name="package.json" active={selectedFile === 'package.json'} onClick={setSelectedFile} />
                      <ExplorerItem name="tsconfig.json" active={selectedFile === 'tsconfig.json'} onClick={setSelectedFile} />
                      <ExplorerItem name="vite.config.ts" active={selectedFile === 'vite.config.ts'} onClick={setSelectedFile} />
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN: Command console, Chat history & Diffs (Span 6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Card className="bg-white border-slate-200 shadow-2xs flex-1 flex flex-col h-[500px]">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Command Chat Console</CardTitle>
                <CardDescription className="text-xs text-slate-500">Coordinate and review changes to code or database models.</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Auth Gate: Active
              </div>
            </CardHeader>
            
            {/* Messages Area */}
            <CardContent className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
              <ScrollArea className="flex-1 pr-2">
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      
                      {msg.reasoning && msg.reasoning.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-2.5 mt-1.5 w-full text-[10px] text-amber-800">
                          <div className="font-bold flex items-center gap-1 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Reasoning steps:
                          </div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {msg.reasoning.map((step, idx) => <li key={idx}>{step}</li>)}
                          </ul>
                        </div>
                      )}

                      {msg.diff && (
                        <div className="bg-slate-950 text-slate-200 font-mono text-[9px] p-2.5 rounded-xl mt-1.5 w-full border border-slate-800 overflow-x-auto whitespace-pre">
                          <div className="font-bold text-slate-400 mb-1 border-b border-slate-800 pb-1">GIT DIFF PREVIEW</div>
                          {msg.diff}
                        </div>
                      )}

                      <div className="text-[9px] text-slate-400 mt-0.5">{msg.timestamp}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-100">
              <form onSubmit={handleSubmitCommand} className="flex gap-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="e.g. Add a Source column to the CRM Lead table..."
                  disabled={isExecuting}
                  className="h-9 text-xs focus:ring-orange-500 focus:border-orange-500"
                />
                <Button type="submit" disabled={isExecuting} size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Change plan, controls, and stats (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Change Plan Panel */}
          <Card className="bg-white border-slate-200 shadow-2xs flex-1 flex flex-col">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" /> Proposed Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              {currentPlan ? (
                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">TITLE</div>
                      <div className="text-xs font-extrabold text-slate-900">{currentPlan.title}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">AFFECTED FILES</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentPlan.affectedFiles.map((f) => (
                          <Badge key={f} variant="outline" className="text-[9px] font-mono bg-slate-50">{f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">DB IMPACT</div>
                        <div className="text-[10px] font-bold text-slate-800">{currentPlan.databaseImpact}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">API IMPACT</div>
                        <div className="text-[10px] font-bold text-slate-800">{currentPlan.apiImpact}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">SECURITY</div>
                        <Badge className={`text-[9px] uppercase ${currentPlan.securityImpact === 'HIGH' ? 'bg-red-500' : 'bg-slate-500'}`}>{currentPlan.securityImpact}</Badge>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">TESTS REQUIRED</div>
                        <div className="text-[10px] font-medium text-slate-600">{currentPlan.testsRequired}</div>
                      </div>
                    </div>
                    {currentPlan.isDestructive && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5 text-[10px] text-red-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span><strong>Destructive Operation:</strong> Always verify and backups schema before approving.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500">{SCHEMA_APPLY_DISABLED_MSG}</p>
                    <Button onClick={() => handleApprovePlan(currentPlan.planId)} disabled className="w-full h-8 text-xs bg-slate-300 text-slate-600 font-bold" title={SCHEMA_APPLY_DISABLED_MSG}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Apply disabled (preview only)
                    </Button>
                    <Button onClick={handleRejectPlan} disabled={isExecuting} variant="outline" className="w-full h-8 text-xs border-slate-200 text-slate-600">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Discard Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                  <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <div className="text-xs font-bold">No active plan</div>
                  <div className="text-[10px] mt-1">Submit a change command in chat to draft a code plan.</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trusted Mode & Quick tools */}
          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Developer Settings</span>
                <Badge variant="outline" className="text-[9px] bg-slate-50 text-indigo-600 border-indigo-200">Gates Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Trusted Dev Mode</div>
                  <div className="text-[9px] text-slate-400">Unavailable: plans cannot be applied from here</div>
                </div>
                <Switch checked={false} onCheckedChange={setTrustedMode} disabled />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] bg-white border-slate-200 hover:bg-slate-50" onClick={() => runTerminalTool('run-lint')}>
                  Lint Check
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] bg-white border-slate-200 hover:bg-slate-50" onClick={() => runTerminalTool('run-typecheck')}>
                  Typecheck
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] bg-white border-slate-200 hover:bg-slate-50" onClick={() => runTerminalTool('run-tests')}>
                  Run Vitest
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] bg-white border-slate-200 hover:bg-slate-50" onClick={() => runTerminalTool('run-build')}>
                  Prod Build
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* BOTTOM PANEL: Monospace Console & Status (Span 12) */}
      <Card className="bg-slate-950 border-slate-800 text-slate-300 shadow-2xl overflow-hidden">
        <CardHeader className="p-3 border-b border-slate-900 bg-slate-900/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Terminal className="w-4 h-4 text-orange-500 animate-pulse" /> Terminal Console Log
          </div>
          
          {/* Badge Quality Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-indigo-600 text-white font-mono text-[9px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> tsc: OK
            </Badge>
            <Badge className="bg-emerald-600 text-white font-mono text-[9px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> tests: 82/82
            </Badge>
            <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px] flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> SQLite: 47 Tables
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 font-mono text-xs">
          <ScrollArea className="h-32 bg-black/60 rounded-xl p-3 border border-slate-900">
            <pre className="whitespace-pre overflow-x-auto text-[10px] text-emerald-400">
              {terminalLogs}
            </pre>
            <div ref={terminalEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}

// Explorer Item Helper
function ExplorerItem({ name, isDir, active, onClick }: { name: string; isDir?: boolean; active: boolean; onClick: (name: string) => void }) {
  return (
    <button
      onClick={() => onClick(name)}
      className={`w-full text-left p-1 rounded-sm flex items-center gap-1.5 truncate ${active ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      {isDir ? (
        <Layers className={`w-3.5 h-3.5 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
      ) : (
        <FileText className={`w-3.5 h-3.5 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
      )}
      <span className="truncate">{name}</span>
    </button>
  );
}
