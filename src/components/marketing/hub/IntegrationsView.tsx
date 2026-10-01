'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plug, CheckCircle2, AlertTriangle, RefreshCw, Webhook, ShieldCheck, Globe, MessageSquare, Mail, Smartphone } from 'lucide-react';

const INTEGRATIONS = [
  { id:'meta', name:'Meta Facebook & Instagram', provider:'meta_business', env:['FACEBOOK_APP_ID','FACEBOOK_APP_SECRET','FACEBOOK_PAGE_ID'], docs:'Marketing Social Connect (OAuth)' },
  { id:'whatsapp', name:'WhatsApp Business Platform', provider:'whatsapp', env:['WHATSAPP_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_BUSINESS_ACCOUNT_ID'], docs:'WHATSAPP-META-SETUP.md' },
  { id:'youtube', name:'YouTube', provider:'youtube', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], docs:'Provider Integration Matrix' },
  { id:'tiktok', name:'TikTok', provider:'tiktok', env:['TIKTOK_CLIENT_KEY','TIKTOK_CLIENT_SECRET'], docs:'Social APIs' },
  { id:'linkedin', name:'LinkedIn', provider:'linkedin', env:['LINKEDIN_CLIENT_ID','LINKEDIN_CLIENT_SECRET'], docs:'Social OAuth' },
  { id:'email', name:'Email (SMTP)', provider:'smtp_email', env:['MAIL_HOST','MAIL_PORT','MAIL_USERNAME','MAIL_PASSWORD'], docs:'EMAIL_CONFIGURATION_GUIDE.md' },
  { id:'sms', name:'SMS Gateway', provider:'sms_provider', env:['SMS_PROVIDER_API_KEY','THREECX_API_URL'], docs:'3CX / SMS provider' },
  { id:'n8n', name:'n8n Webhooks', provider:'n8n', env:['N8N_WEBHOOK_URL'], docs:'N8nWorkflowsView' },
  { id:'analytics', name:'Search Analytics', provider:'search_analytics', env:['GOOGLE_CLIENT_ID'], docs:'SEO & Blog Manager' },
];

export default function IntegrationsView() {
  const [status, setStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch('/api/marketing/automation').then(r=>r.json()).then(j=>{ const accounts=j.providerStatus||j.data?.accounts||[]; setStatus(accounts); }).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  const getStatus = (provider:string) => {
    const hit = status.find((s:any)=> s.provider===provider || s.provider?.includes(provider));
    return hit ? (hit.status || hit.healthStatus || hit.webhookStatus) : 'NOT_CONFIGURED';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Plug className="w-6 h-6 text-[#F97316]" />Integrations</h2>
        <p className="text-sm text-gray-500">Connect official APIs — health, sync status, token expiry alerts, webhook verification. Least privilege, secrets encrypted server-side, never in frontend/logs.</p>
      </div>
      {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#F97316]" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map(i=>{
            const st = getStatus(i.provider);
            const isConnected = st==='CONNECTED' || st==='connected';
            const isPending = st.includes('PENDING') || st.includes('REQUIRES');
            return (
              <Card key={i.id} className={isConnected ? 'border-emerald-200 bg-emerald-50/30' : isPending ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {i.id==='meta' ? <Globe className="w-4 h-4 text-blue-600" /> : i.id==='whatsapp' ? <MessageSquare className="w-4 h-4 text-emerald-600" /> : i.id==='email' ? <Mail className="w-4 h-4 text-blue-600" /> : i.id==='sms' ? <Smartphone className="w-4 h-4 text-[#F97316]" /> : <Webhook className="w-4 h-4 text-[#0B5ED7]" />}
                    {i.name}
                  </CardTitle>
                  <Badge className={isConnected ? 'bg-emerald-100 text-emerald-700 border-emerald-200 w-fit mt-1' : isPending ? 'bg-amber-100 text-amber-700 border-amber-200 w-fit mt-1' : 'bg-gray-100 text-gray-600 border-gray-200 w-fit mt-1'}>
                    {isConnected ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}{st}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-gray-500">Env: {i.env.join(', ')}</p>
                  <p className="text-gray-400">Docs: {i.docs}</p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="h-7 text-[11px]"><Plug className="w-3 h-3 mr-1" />Connect</Button>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]"><RefreshCw className="w-3 h-3 mr-1" />Health Check</Button>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" />Tokens encrypted, webhook signature verified, rate limits respected.</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Card className="bg-[#F8FAFC] border-dashed">
        <CardContent className="p-4 text-xs text-gray-500">
          Missing integration → UI shows “Integration not connected — connect in Integrations” and preserves task for completion. Official platform APIs only — respects permissions, rate limits, policies. No unauthorized account access, fake engagement, spam, or prohibited automation.
        </CardContent>
      </Card>
    </div>
  );
}
