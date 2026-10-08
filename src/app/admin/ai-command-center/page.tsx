'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Cpu,
  Building2,
  RefreshCw,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function AICommandCenterDashboard() {
  const [health, setHealth] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [activeTab, setActiveTab] = useState('terminal');

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch('/api/agentos/dashboard');
      if (res.ok) {
        const data = await res.json();
        setHealth(data && typeof data === 'object' ? data : null);
      } else {
        setHealth(null);
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

  useEffect(() => {
    fetchHealth();
    fetchDepartments();
    fetchEngines();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Master Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-[#F97316]" />
            <h1 className="text-2xl font-bold tracking-tight">ALO Education AI Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Legacy AgentOS registry snapshot — runtime and cross-registry health are not verified here.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            title="This page reads legacy AgentOS database records; it does not establish live runtime health."
            className={`text-xs px-3 py-1 font-bold ${health ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40' : 'bg-slate-700 text-slate-200 border border-slate-600'}`}
          >
            {loadingHealth ? 'CHECKING LEGACY DATA' : health ? 'LEGACY DB SNAPSHOT' : 'STATUS UNAVAILABLE'}
          </Badge>
          <Button onClick={fetchHealth} size="sm" className="bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Legacy departments</span>
          <p className="text-2xl font-black text-[#0B5ED7]">{health?.totalDepartments ?? '—'}</p>
          <span className="text-[10px] text-[#0B5ED7] font-semibold">Active organizational units in this registry</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Legacy agent definitions</span>
          <p className="text-2xl font-black text-[#F97316]">{health?.totalAgents ?? '—'}</p>
          <span className="text-[10px] text-[#F97316] font-semibold">{health?.activeAgents ?? '—'} marked active in this database</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Tasks recorded today</span>
          <p className="text-2xl font-black text-purple-600">{health?.tasksToday ?? '—'}</p>
          <span className="text-[10px] text-purple-600 font-semibold">{health?.totalTasksEver ?? '—'} total task records</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pending legacy approvals</span>
          <p className="text-2xl font-black text-amber-600">{health?.pendingApprovals ?? '—'}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Database status only; decision flow not verified</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'terminal', label: 'Dispatch status', icon: Terminal },
          { id: 'departments', label: `Legacy departments (${health?.totalDepartments ?? '—'})`, icon: Building2 },
          { id: 'engines', label: `Legacy engine types (${health?.totalEngineTypes ?? '—'})`, icon: Cpu },
          { id: 'activity', label: 'Recent Activity', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 transition ${
                isActive ? 'bg-[#0B5ED7] text-white font-bold' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LEGACY DISPATCH STATUS */}
      {activeTab === 'terminal' && (
        <Card className="bg-slate-950 text-slate-100 p-6 rounded-2xl shadow-2xl border border-slate-800 min-h-64 flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Terminal className="w-5 h-5" aria-hidden="true" />
            <h2 className="font-semibold">Legacy free-text dispatch is disabled</h2>
          </div>
          <p className="text-sm text-slate-300 max-w-3xl">
            This surface previously guessed a workflow from command keywords and could trigger unscoped lead processing. Dispatch is paused while the existing AgentOS and AI Workforce registries, permissions, and execution-result contracts are reconciled. This disabled panel does not dispatch tasks.
          </p>
          <p className="text-xs text-slate-400">
            The counts on this page are a snapshot of legacy AgentOS database records, not live runtime or delivery verification.
          </p>
        </Card>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0B5ED7]" /> AI Enterprise Departments
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {departments.map((d: any) => (
              <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {d.icon} {d.name}
                  </span>
                  <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] text-[9px]">{d._count?.agents || 0} AGENTS</Badge>
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
              <Cpu className="w-5 h-5 text-[#F97316]" /> AI Engine Types
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {engines.map((e: any) => (
              <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{e.name}</span>
                  <Badge className="bg-[#F97316]/10 text-[#F97316] text-[9px]">{e._count?.agents || 0} AGENTS USING</Badge>
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
            <Activity className="w-5 h-5 text-indigo-600" /> Recent legacy AgentOS audit records
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
                <div className="text-sm text-slate-500 py-4 text-center">
                  {loadingHealth ? 'Loading legacy audit records…' : health ? 'No recent legacy audit records were returned.' : 'Legacy activity data is unavailable.'}
                </div>
            )}
          </div>
        </Card>
      )}

    </div>
  );
}
