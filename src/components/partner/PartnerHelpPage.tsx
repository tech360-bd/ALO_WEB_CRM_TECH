'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { HelpCircle, MessageCircle, Send, Loader2, Headphones, RefreshCw } from 'lucide-react';

interface Faq { id: string; question: string; answer: string }
const ticketCategories = ['General Inquiry', 'Lead Issue', 'Application Problem', 'Commission Query', 'Technical Issue', 'Document Request', 'Visa Support', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;

export default function PartnerHelpPage() {
  const setView = usePortalStore((state) => state.setView);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/partner/help?section=faq', { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Could not load FAQs (HTTP ${response.status})`);
      setFaqs(Array.isArray(payload.data?.faqs) ? payload.data.faqs.map((faq: any) => ({ id: String(faq.id), question: String(faq.question || ''), answer: String(faq.answer || '') })) : []);
    } catch (caught) {
      setFaqs([]);
      setLoadError(caught instanceof Error ? caught.message : 'Could not load FAQ content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchFaqs(); }, [fetchFaqs]);

  const handleSubmitTicket = async () => {
    if (!subject.trim()) { toast.error('Subject is required.'); return; }
    if (!category) { toast.error('Select a category.'); return; }
    if (!priority) { toast.error('Select a priority.'); return; }
    if (!description.trim()) { toast.error('Description is required.'); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/partner/help', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority, description }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Ticket was not saved (HTTP ${response.status})`);
      setSubject(''); setCategory(''); setPriority(''); setDescription('');
      toast.success('Support ticket saved. Continue the conversation in Messages.');
      setView('partner-messages');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Support ticket could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-[500px] w-full rounded-xl" /></div>;

  return (
    <div className="space-y-6 p-1 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-alo-text">Help Center</h1><p className="text-sm text-alo-text-muted mt-0.5">Browse published FAQ content or create a saved support conversation.</p></div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-alo-brand-light/50 flex items-center justify-center"><MessageCircle className="w-6 h-6 text-alo-brand" /></div><div><p className="text-sm font-semibold text-alo-text">In-app partner support</p><p className="text-xs text-alo-text-muted">Messages are saved to your account; no response-time estimate is promised here.</p></div></div><Button variant="outline" onClick={() => setView('partner-messages')}>Open Messages</Button></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Frequently Asked Questions</CardTitle><CardDescription className="text-xs text-alo-text-muted">Published FAQ content from the shared website knowledge base</CardDescription></div></div></CardHeader><CardContent>{loadError ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-4"><p className="text-sm text-amber-900">{loadError}</p><Button variant="outline" size="sm" onClick={() => void fetchFaqs()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></div> : faqs.length === 0 ? <p className="py-8 text-center text-sm text-alo-text-muted">No active FAQ entries are published yet.</p> : <Accordion type="single" collapsible className="w-full">{faqs.map((faq) => <AccordionItem key={faq.id} value={faq.id}><AccordionTrigger className="text-sm text-alo-text hover:no-underline text-left">{faq.question}</AccordionTrigger><AccordionContent className="text-sm text-alo-text-secondary leading-relaxed">{faq.answer}</AccordionContent></AccordionItem>)}</Accordion>}</CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><Headphones className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Create Support Ticket</CardTitle><CardDescription className="text-xs text-alo-text-muted">This creates a saved partner support conversation; messages are available in the Messages section.</CardDescription></div></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2 sm:col-span-2"><Label htmlFor="ticketSubject">Subject <span className="text-red-500">*</span></Label><Input id="ticketSubject" maxLength={200} placeholder="Briefly describe your support request" value={subject} onChange={(event) => setSubject(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="ticketCat">Category <span className="text-red-500">*</span></Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="ticketCat"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{ticketCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="ticketPri">Priority <span className="text-red-500">*</span></Label><Select value={priority} onValueChange={setPriority}><SelectTrigger id="ticketPri"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent>{priorities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label htmlFor="ticketDesc">Description <span className="text-red-500">*</span></Label><Textarea id="ticketDesc" maxLength={5000} placeholder="Include relevant details and avoid sharing passwords or payment card details." value={description} onChange={(event) => setDescription(event.target.value)} rows={5} /></div><div className="flex justify-end"><Button variant="brand" onClick={() => void handleSubmitTicket()} disabled={submitting}>{submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit Ticket</>}</Button></div></CardContent></Card>
    </div>
  );
}
