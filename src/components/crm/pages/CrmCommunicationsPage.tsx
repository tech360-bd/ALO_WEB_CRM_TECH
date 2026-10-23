'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Send, Search, FileText, Megaphone, RefreshCw,
  AlertTriangle, MessageCircle, Smartphone, Users, ShieldCheck,
} from 'lucide-react';

type CommChannel = 'email' | 'sms' | 'whatsapp';

// ─── Types ───────────────────────────────────────────────────────────
// Templates mirror CommunicationTemplate via /api/communications/templates.
interface TemplateItem {
  id: string;
  templateCode: string;
  templateName: string;
  channel: string;
  category: string;
  language: string;
  body: string;
  status: string;
  requiresApproval: boolean;
  isLocked: boolean;
  updatedAt: string;
}

// Recipients mirror PortalStudentProfile via /api/crm/students.
interface Recipient {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
}

const CHANNEL_META: Record<CommChannel, { label: string; icon: React.ElementType }> = {
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: Smartphone },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
};

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CrmCommunicationsPage() {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<CommChannel>('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState('');

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [recipientsError, setRecipientsError] = useState('');

  const [showBlast, setShowBlast] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [blastSubject, setBlastSubject] = useState('');
  const [blastMessage, setBlastMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError('');
    try {
      const response = await fetch('/api/communications/templates', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Templates could not be loaded.');
      setTemplates(Array.isArray(result?.templates) ? result.templates : []);
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : 'Templates could not be loaded.');
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadRecipients = useCallback(async () => {
    setRecipientsLoading(true);
    setRecipientsError('');
    try {
      const response = await fetch('/api/crm/students?limit=100', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Recipients could not be loaded.');
      }
      const rows = Array.isArray(result.data) ? result.data : [];
      setRecipients(rows.map((r: any) => ({
        id: r.id,
        studentId: r.studentId || '',
        fullName: r.fullName || 'Unnamed student',
        email: r.user?.email || '',
        phone: r.user?.phone || '',
      })));
    } catch (error) {
      setRecipientsError(error instanceof Error ? error.message : 'Recipients could not be loaded.');
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
    void loadRecipients();
  }, [loadTemplates, loadRecipients]);

  const filteredTemplates = templates.filter((t) => {
    if (!showAllTemplates && (t.channel || '').toLowerCase() !== activeChannel) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.templateName.toLowerCase().includes(q)
      || t.templateCode.toLowerCase().includes(q)
      || t.body.toLowerCase().includes(q);
  });

  const filteredRecipients = recipients.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.fullName.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q);
  });

  const handleApplyTemplate = (template: TemplateItem) => {
    setShowBlast(true);
    setBlastMessage(template.body);
    if (!blastSubject && template.channel.toLowerCase() === 'email') {
      setBlastSubject(`[${template.templateName}]`);
    }
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  /**
   * The email API only accepts a consent-checked campaign dry run — it returns
   * how many consented recipients exist and flags the send as requiring
   * approval. There is no bulk send endpoint, so this reports that outcome
   * rather than claiming a campaign was delivered.
   */
  const handleSendBlast = async () => {
    if (!blastMessage.trim()) {
      toast({ title: 'Message is empty', description: 'Write the message before validating.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      if (activeChannel === 'email') {
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_campaign',
            dryRun: true,
            subject: blastSubject || '(no subject)',
            html: blastMessage,
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'The campaign could not be validated.');
        toast({
          title: 'Campaign validated, not sent',
          description: `${result.count ?? 0} consented recipient(s) matched. Sending requires approval.`,
        });
      } else {
        toast({
          title: 'Bulk send is not available on this channel',
          description: 'Send individual WhatsApp messages from the WhatsApp page instead.',
          variant: 'destructive',
        });
      }
      setShowBlast(false);
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const channelMeta = CHANNEL_META[activeChannel];
  const ChannelIcon = channelMeta.icon;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--alo-text)]">Communications</h1>
            <p className="text-sm text-[var(--alo-text-muted)]">Email, SMS &amp; WhatsApp Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { void loadTemplates(); void loadRecipients(); }}>
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" onClick={() => setShowBlast(!showBlast)} className="bg-orange-600 hover:bg-orange-700">
            <Megaphone className="h-4 w-4 mr-1" />Compose
          </Button>
        </div>
      </div>

      {/* No send log exists */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          No outbound message log is stored for email, SMS or WhatsApp in this workspace, so no send
          history or delivery statistics are displayed here. Figures would otherwise have to be invented.
        </p>
      </div>

      <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as CommChannel)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList>
            {(Object.keys(CHANNEL_META) as CommChannel[]).map((key) => {
              const meta = CHANNEL_META[key];
              const Icon = meta.icon;
              return (
                <TabsTrigger key={key} value={key} className="text-xs">
                  <Icon className="h-3.5 w-3.5 mr-1" />{meta.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--alo-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates and recipients..."
              className="pl-9 h-8 text-xs"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-[var(--alo-body)]">
            <input
              type="checkbox"
              checked={showAllTemplates}
              onChange={(e) => setShowAllTemplates(e.target.checked)}
              className="rounded border-[var(--alo-border-strong)]"
            />
            Show all channels
          </label>
        </div>

        {/* Templates */}
        <TabsContent value={activeChannel} className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />Message Templates
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">{filteredTemplates.length} shown</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {templatesError ? (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-semibold">Templates are unavailable</p>
                  <p className="text-muted-foreground">{templatesError}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => void loadTemplates()}>
                    Try again
                  </Button>
                </div>
              ) : templatesLoading ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-[var(--alo-surface-muted)]" />)}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)] py-8 text-center">
                  {templates.length === 0
                    ? 'No message templates have been created yet.'
                    : 'No templates match this channel or search.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="p-3 rounded-lg border border-[var(--alo-border)] hover:border-orange-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-[var(--alo-text)]">{template.templateName}</span>
                            <Badge variant="outline" className="text-[11px] font-normal">{template.channel}</Badge>
                            {template.category && <Badge variant="muted" className="text-[11px]">{template.category}</Badge>}
                            {template.requiresApproval && (
                              <Badge className="text-[11px] bg-amber-100 text-amber-700">Needs approval</Badge>
                            )}
                            {template.isLocked && <Badge variant="muted" className="text-[11px]">Locked</Badge>}
                          </div>
                          {template.templateCode && (
                            <p className="text-[11px] text-[var(--alo-text-muted)] font-mono mt-0.5">{template.templateCode}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => handleApplyTemplate(template)}>
                          Use
                        </Button>
                      </div>
                      <p className="text-xs text-[var(--alo-body)] mt-1.5 line-clamp-2">{template.body || 'No body stored.'}</p>
                      <p className="text-[11px] text-[var(--alo-text-muted)] mt-1.5">Updated {formatDate(template.updatedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose */}
      {showBlast && (
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ChannelIcon className="h-4 w-4 text-orange-600" />Compose {channelMeta.label} Message
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBlast(false)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeChannel === 'email' && (
              <div className="space-y-1.5">
                <label htmlFor="blast-subject" className="text-xs font-medium text-[var(--alo-body)]">Subject</label>
                <Input id="blast-subject" value={blastSubject} onChange={(e) => setBlastSubject(e.target.value)} className="h-9 text-sm" />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="blast-message" className="text-xs font-medium text-[var(--alo-body)]">Message</label>
              <Textarea id="blast-message" value={blastMessage} onChange={(e) => setBlastMessage(e.target.value)} rows={5} className="text-sm resize-y" />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--alo-body)] flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />Recipients
                <span className="text-[var(--alo-text-muted)] font-normal">({selectedIds.length} selected)</span>
              </p>
              {recipientsError ? (
                <p className="text-xs text-destructive" role="alert">{recipientsError}</p>
              ) : recipientsLoading ? (
                <div className="space-y-1.5" aria-busy="true">
                  {[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-[var(--alo-surface-muted)]" />)}
                </div>
              ) : filteredRecipients.length === 0 ? (
                <p className="text-xs text-[var(--alo-text-muted)]">
                  {recipients.length === 0
                    ? 'No student records are available to select as recipients.'
                    : 'No recipients match your search.'}
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--alo-border)] divide-y divide-gray-50">
                  {filteredRecipients.map((recipient) => (
                    <label key={recipient.id} className="flex items-center gap-2 p-2 hover:bg-[var(--alo-page)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(recipient.id)}
                        onChange={() => handleToggleRecipient(recipient.id)}
                        className="rounded border-[var(--alo-border-strong)]"
                      />
                      <span className="text-xs text-[var(--alo-text)] flex-1 truncate">{recipient.fullName}</span>
                      <span className="text-[11px] text-[var(--alo-text-muted)] font-mono">{recipient.studentId}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-md bg-blue-50/70 border border-blue-100 p-2.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-600 mt-0.5" />
              <p className="text-[11px] text-blue-900 leading-relaxed">
                Email campaigns are validated against stored consent and then require approval before any
                message leaves the system. This action does not send.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBlast(false)} disabled={sending}>Cancel</Button>
              <Button onClick={() => void handleSendBlast()} disabled={sending} className="bg-orange-600 hover:bg-orange-700">
                <Send className="h-4 w-4 mr-1" />
                {sending ? 'Validating…' : activeChannel === 'email' ? 'Validate campaign' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
