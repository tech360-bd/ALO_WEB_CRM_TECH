'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Cpu,
  ShieldCheck,
  Building2,
  RefreshCw,
  Send,
  AlertTriangle,
  Play,
  FileCode,
  Activity,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function AICommandCenterDashboard() {
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<Array<{ type: 'input' | 'output' | 'system'; text: string; details?: any }>>([
    {
      type: 'system',
      text: '🤖 ALO AGENTOS INITIALIZED — CONNECTED TO ENTERPRISE REGISTRY.',
    },
  ]);
  const [health, setHealth] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [activeTab, setActiveTab] = useState('terminal');

  useEffect(() => {
    fetchHealth();
    fetchDepartments();
    fetchEngines();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch('/api/agentos/dashboard');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        if (data.recentActivity) {
            setLogs(prev => [
                ...prev, 
                { type: 'system', text: `Loaded ${data.totalAgents} Agents across ${data.totalDepartments} Departments.` }
            ]);
        }
      }
    } catch {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/agentos/departments');
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEngines = async () => {
    try {
      const res = await fetch('/api/agentos/engines');
      if (res.ok) {
        setEngines(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunCommand = async () => {
    if (!command.trim() || executing) return;
    const cmdText = command.trim();
    setCommand('');
    setExecuting(true);

    setLogs((prev) => [...prev, { type: 'input', text: `> ADMIN COMMAND: ${cmdText}` }]);

    try {
      // Create a task for the Master Router agent
      const res = await fetch('/api/agentos/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            agentId: 'cuid-placeholder-for-router', // In a real app, resolve the ID of AGT-0001
            input: cmdText,
            triggerType: 'user',
            triggeredBy: 'Super Admin'
        }),
      });

      if (res.ok) {
        const json = await res.json();
        
        setLogs((prev) => [
          ...prev,
          {
            type: 'output',
            text: `[WORKFLOW INITIATED] Task ID: ${json.taskCode} queued for execution.`,
            details: json,
          },
        ]);
        toast.success(`Task ${json.taskCode} queued successfully`);
        fetchHealth(); // Refresh stats
      } else {
        const err = await res.json();
        setLogs((prev) => [...prev, { type: 'output', text: `❌ ERROR: ${err.error || 'Execution failed'}` }]);
        toast.error('Command execution failed');
      }
    } catch (e: any) {
      setLogs((prev) => [...prev, { type: 'output', text: `❌ EXCEPTION: ${e.message}` }]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Master Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-[#F37021] animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">ALO Education AI Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Agent Orchestration, Governance & Task Queue Monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 font-bold">
            RUNTIME ACTIVE
          </Badge>
          <Button onClick={fetchHealth} size="sm" className="bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Departments</span>
          <p className="text-2xl font-black text-[#0066CC]">{health?.totalDepartments || 0}</p>
          <span className="text-[10px] text-[#0066CC] font-semibold">Active Organizational Units</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Private Agents</span>
          <p className="text-2xl font-black text-[#F37021]">{health?.totalAgents || 0}</p>
          <span className="text-[10px] text-[#F37021] font-semibold">{health?.activeAgents || 0} Online & Ready</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Tasks Executed Today</span>
          <p className="text-2xl font-black text-purple-600">{health?.tasksToday || 0}</p>
          <span className="text-[10px] text-purple-600 font-semibold">{health?.totalTasksEver || 0} All-Time Total</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Approvals Pending</span>
          <p className="text-2xl font-black text-amber-600">{health?.pendingApprovals || 0}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Human-in-the-Loop Required</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'terminal', label: 'Command Terminal', icon: Terminal },
          { id: 'departments', label: `Departments (${health?.totalDepartments || 0})`, icon: Building2 },
          { id: 'engines', label: `Engine Types (${health?.totalEngineTypes || 0})`, icon: Cpu },
          { id: 'activity', label: 'Recent Activity', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 transition ${
                isActive ? 'bg-[#0066CC] text-white font-bold' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TERMINAL & FEED */}
      {activeTab === 'terminal' && (
        <div className="space-y-4">
          <Card className="bg-slate-950 text-slate-100 p-5 rounded-2xl font-mono text-xs shadow-2xl border border-slate-800 h-[450px] flex flex-col justify-between overflow-hidden">
            <div className="overflow-y-auto space-y-3 pr-2 flex-1">
              {logs.map((l, idx) => (
                <div key={idx} className="space-y-1">
                  {l.type === 'system' && <p className="text-emerald-400 font-bold">{l.text}</p>}
                  {l.type === 'input' && <p className="text-[#FFB347] font-bold">{l.text}</p>}
                  {l.type === 'output' && (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-slate-300">
                      <p className="text-indigo-300 font-semibold">{l.text}</p>
                      {l.details && (
                        <div className="text-[11px] text-slate-400 space-y-1 pl-3 border-l-2 border-indigo-500/50">
                          <p>Status: {l.details.status}</p>
                          <p>Triggered By: {l.details.triggeredBy}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <span className="text-[#F37021] font-bold text-sm">$</span>
              <input
                type="text"
                placeholder="Type command to dispatch task..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
                className="flex-1 bg-transparent text-white focus:outline-none text-xs font-mono"
              />
              <Button
                disabled={executing}
                onClick={handleRunCommand}
                className="bg-[#0066CC] hover:bg-blue-700 text-white text-xs px-4 rounded-xl flex items-center gap-1.5"
              >
                {executing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Execute
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0066CC]" /> AI Enterprise Departments
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {departments.map((d: any) => (
              <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {d.icon} {d.name}
                  </span>
                  <Badge className="bg-[#0066CC]/10 text-[#0066CC] text-[9px]">{d._count?.agents || 0} AGENTS</Badge>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">{d.description}</p>
                <p className="text-[9px] font-semibold" style={{ color: d.color }}>Category: {d.category}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: ENGINES */}
      {activeTab === 'engines' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#F37021]" /> AI Engine Types
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {engines.map((e: any) => (
              <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{e.name}</span>
                  <Badge className="bg-[#F37021]/10 text-[#F37021] text-[9px]">{e._count?.agents || 0} AGENTS USING</Badge>
                </div>
                <p className="text-[11px] text-slate-600">{e.description}</p>
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Model: {e.modelId}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Tokens: {e.maxTokens}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: RECENT ACTIVITY */}
      {activeTab === 'activity' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-indigo-600" /> Recent Agent Audit Logs
          </h2>
          <div className="space-y-3">
            {health?.recentActivity && health.recentActivity.length > 0 ? (
                health.recentActivity.map((log: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{log.agentCode} - {log.agentName}</p>
                            <p className="text-xs text-slate-600">{log.action}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(log.ts).toLocaleString()}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-sm text-slate-500 py-4 text-center">No recent activity found.</div>
            )}
          </div>
        </Card>
      )}

    </div>
  );
}
