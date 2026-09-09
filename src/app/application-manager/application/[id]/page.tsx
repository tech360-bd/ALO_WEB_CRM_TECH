'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileCheck, Send, Clock, Award, Shield, AlertTriangle, CheckCircle2,
  Users, Building2, BookOpen, Lock, ArrowRight, ArrowLeft, RefreshCw,
  FileText, Calendar, MessageSquare, Check, X, Loader2, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = usePortalStore(state => state.token);
  const applicationId = params?.id as string;

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'submission' | 'b2b' | 'offer' | 'cas' | 'visa' | 'comments'>('overview');
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('student_visible');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApplication = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setApp(json.application || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleVisaHandover = async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/visa-handover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Application successfully handed over to Visa Team! VisaCase linked.' });
        fetchApplication();
      } else {
        setMessage({ type: 'error', text: data.error || 'Visa handover failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          commentText,
          commentType,
          visibility: commentType === 'b2b_confidential' ? 'b2b_internal' : commentType
        })
      });
      if (res.ok) {
        setCommentText('');
        fetchApplication();
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-[#0a0f1e] min-h-screen text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0057B8]" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center bg-[#0a0f1e] min-h-screen text-white">
        <p>Application record not found.</p>
        <Link href="/application-manager/applications">
          <Button className="mt-4">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/application-manager/applications">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-400">{app.applicationCode || app.id}</span>
                <Badge className={
                  app.stage === 'conditional_offer' || app.stage === 'unconditional_offer' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                  app.stage === 'submitted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }>
                  {app.stage.toUpperCase()}
                </Badge>
                {app.isB2b && (
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                    <Lock className="w-2.5 h-2.5 mr-1" /> CONFIDENTIAL B2B
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold mt-1">{app.student?.name || 'Student Application'}</h1>
              <p className="text-gray-400 text-xs">{app.universityName} • {app.courseName} • {app.country}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleVisaHandover}
            className="bg-gradient-to-r from-[#0057B8] to-[#E8501A] hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-[#0057B8]/20"
          >
            <Shield className="w-4 h-4" />
            <span>Handover to Visa Team</span>
          </Button>
          <Button onClick={fetchApplication} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'documents', label: 'Documents' },
          { key: 'submission', label: 'Submission & Receipts' },
          { key: 'offer', label: 'Offer & Decision' },
          { key: 'cas', label: 'CAS / I-20 / COE' },
          { key: 'b2b', label: 'B2B Confidential', lock: true },
          { key: 'comments', label: 'Comments & Timeline' },
        ].map((tab: any) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.key ? 'border-[#0057B8] text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.lock && <Lock className="w-3 h-3 text-rose-400" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-[#0d1526] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10">
              <CardTitle className="text-base font-semibold">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Target University</p>
                <p className="font-semibold text-white mt-0.5">{app.universityName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Course / Degree</p>
                <p className="font-semibold text-white mt-0.5">{app.courseName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Country & Campus</p>
                <p className="font-semibold text-white mt-0.5">{app.country} {app.campus ? `(${app.campus})` : ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Target Intake</p>
                <p className="font-semibold text-white mt-0.5">{app.intake || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Application Source</p>
                <p className="font-semibold text-blue-400 mt-0.5">{app.applicationSource}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Student Safe Status</p>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs mt-1">
                  {app.safeStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400">Assigned Counselor</p>
                <p className="font-semibold text-white mt-0.5">{app.counselorName || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Application Officer</p>
                <p className="font-semibold text-white mt-0.5">{app.applicationOfficer || 'Pending Assignment'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Visa Handover State */}
          <div className="space-y-4">
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardHeader className="p-4 border-b border-white/10">
                <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visa Handover Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Handover State</span>
                  <Badge className={
                    app.visaHandoverStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }>
                    {app.visaHandoverStatus.toUpperCase()}
                  </Badge>
                </div>
                <Button
                  onClick={handleVisaHandover}
                  className="w-full bg-[#0057B8] hover:bg-[#0046a0] text-white text-xs py-2"
                >
                  Initiate Visa File Creation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: B2B Confidential */}
      {activeTab === 'b2b' && (
        <Card className="bg-gradient-to-br from-[#1a0f1e] to-[#0d1526] border-rose-500/30 text-white">
          <CardHeader className="p-6 border-b border-rose-500/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-rose-200">CONFIDENTIAL B2B INFORMATION</CardTitle>
                <p className="text-xs text-rose-400/80 mt-0.5">Strictly restricted to Application Manager, Application Team & Super Admin. Never exposed to Students, Partners or unauthorized staff.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-400">B2B Channel Type</p>
              <p className="font-semibold text-white mt-1">{app.b2bType || 'B2B_OUTBOUND'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">B2B Provider</p>
              <p className="font-semibold text-rose-300 mt-1">{app.b2bProvider?.name || 'Global Aggregator Channel'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">B2B Portal Reference</p>
              <p className="font-mono text-xs text-blue-400 mt-1">{app.b2bApplication?.b2bReference || 'REF-B2B-2026-992'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Commission Rule & Terms</p>
              <p className="text-xs text-gray-300 mt-1">{app.b2bApplication?.b2bCommissionType || 'Standard University Partner Tier'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: Comments & Timeline */}
      {activeTab === 'comments' && (
        <Card className="bg-[#0d1526] border-white/10 text-white">
          <CardHeader className="p-4 border-b border-white/10">
            <CardTitle className="text-base font-semibold">Two-Layer Application Comments & Communication</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleAddComment} className="space-y-4">
              <textarea
                rows={3}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write comment or update note..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#0057B8]"
              />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Visibility:</span>
                  <select
                    value={commentType}
                    onChange={e => setCommentType(e.target.value)}
                    className="bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300"
                  >
                    <option value="student_visible">Student Visible (Safe Portal Note)</option>
                    <option value="partner_visible">Partner Visible</option>
                    <option value="counselor_visible">Counselor & Team Only</option>
                    <option value="b2b_confidential">B2B Confidential (App Team Only)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="bg-[#0057B8] hover:bg-[#0046a0] text-white text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
