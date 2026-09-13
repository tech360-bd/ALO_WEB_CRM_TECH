'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw } from 'lucide-react';

export default function WhatsAppAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/analytics');
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, []);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Analytics</h1>
            <p className="text-gray-400 text-sm">Total conversations, leads, active, unread, AI handled, human handled, handovers, avg response, SLA breaches, escalations, urgent, follow-up, conversion, counselor/branch performance</p>
          </div>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" className="border-white/10"><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Total Conversations</p><p className="text-xl font-bold">{data.summary?.totalConversations || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Active</p><p className="text-xl font-bold text-emerald-400">{data.summary?.activeConversations || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">SLA Overdue</p><p className="text-xl font-bold text-rose-400">{data.summary?.slaOverdue || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Urgent Alarms</p><p className="text-xl font-bold text-amber-400">{data.summary?.urgentAlarms || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Follow-up Pending</p><p className="text-xl font-bold">{data.summary?.followUpPending || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Documents</p><p className="text-xl font-bold">{data.summary?.documentVolume || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Contacts</p><p className="text-xl font-bold">{data.summary?.contacts || 0}</p></CardContent></Card>
          <Card className="bg-[#0d1526] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-gray-400">Daily Records</p><p className="text-xl font-bold">{data.daily?.length || 0}</p></CardContent></Card>
        </div>
      )}

      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Daily Analytics</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {(data?.daily || []).slice(0,30).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-2 rounded bg-white/5 text-xs">
              <span className="font-mono">{d.date}</span>
              <span>Conv: {d.totalConversations} • Leads: {d.newLeads} • AI: {d.aiHandled} • SLA Breach: {d.slaBreaches} • Urgent: {d.urgentCases} • Follow-up: {d.followUpSent} • Docs: {d.documentVolume}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
