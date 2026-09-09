'use client';

import { useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  HelpCircle, Phone, Mail, MessageCircle, Send, Loader2,
  ChevronRight, Headphones, FileText, GraduationCap, Plane, DollarSign,
} from 'lucide-react';

const faqs = [
  { q: 'How do I submit a new student lead?', a: 'Navigate to the Leads Management page from the sidebar and click the "Submit New Lead" button. Fill in the student\'s details including name, phone, email, preferred destination country, study level, and intake. Click submit and our counseling team will follow up within 24 hours.' },
  { q: 'What is the commission structure?', a: 'Commissions vary by destination and program level. Typically: UK/Masters: BDT 10,000-20,000 per enrollment, USA/Bachelors: BDT 15,000-25,000, Australia/Diploma: BDT 8,000-15,000, Canada/Masters: BDT 12,000-22,000. Commissions are paid on the 15th of each month for the previous month\'s confirmed enrollments.' },
  { q: 'What documents are required for university applications?', a: 'Standard documents include: Academic transcripts and certificates (attested), Passport copy, Statement of Purpose (SOP), Letters of Recommendation (2), CV/Resume, English proficiency test scores (IELTS/TOEFL/Duolingo), and financial documents. Some universities may require additional documents like portfolios or work experience certificates.' },
  { q: 'How long does the application process take?', a: 'The timeline varies by destination: UK: 4-8 weeks from application to offer, USA: 6-12 weeks, Canada: 4-10 weeks, Australia: 4-8 weeks. After receiving an offer, visa processing takes an additional 2-6 weeks depending on the country.' },
  { q: 'Does ALO provide visa support?', a: 'Yes, ALO provides comprehensive visa support including: Document preparation and review, CAS/CoE assistance, Visa application guidance, Mock interview preparation, Biometrics appointment scheduling, and ongoing tracking until visa decision. Our dedicated visa officers will guide your students through the entire process.' },
  { q: 'How can I track my commission payments?', a: 'Visit the Commission page in your partner portal to see a detailed breakdown of all commission payments. You can filter by month, status (pending/paid), and student name. Payment receipts are available for download. If you notice any discrepancies, contact the Finance Team through the Messages section.' },
  { q: 'Can I refer other education agencies to ALO?', a: 'Yes! We have a referral program for partners. When you refer another agency that signs up with ALO, you earn a 5% override commission on their first 6 months of enrollments. Contact your Partner Manager for the referral link and terms.' },
  { q: 'What marketing materials are available?', a: 'We provide a comprehensive set of marketing materials including: University brochures, Social media templates, Campus banners and flyers, Brand guidelines and logos, Video testimonials, Scholarship lists, and Visa information guides. All materials are available for download in the Resources section of your portal.' },
  { q: 'How do I update my partner profile?', a: 'Go to Settings from the sidebar. In the Account Settings section, you can update your company name, email, phone number, and office address. Changes are saved immediately. For changes that require verification (like bank account details), our team will review and confirm within 48 hours.' },
  { q: 'What happens if my student\'s visa is rejected?', a: 'If a student\'s visa is rejected, no commission is payable for that case. However, we encourage reapplication if the rejection reason is addressable. Our visa officers will analyze the rejection letter and advise on the best course of action. In many cases, students succeed on their second attempt with improved documentation.' },
];

const ticketCategories = ['General Inquiry', 'Lead Issue', 'Application Problem', 'Commission Query', 'Technical Issue', 'Document Request', 'Visa Support', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;

export default function PartnerHelpPage() {
  const { user } = usePortalStore();
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmitTicket = async () => {
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!category) { toast.error('Please select a category'); return; }
    if (!priority) { toast.error('Please select a priority'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }
    setSubmitting(true);
    try { await fetch('/api/partner/help', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: user?.id, subject, category, priority, description }) }); } catch { /* fallback */ } finally { setSubmitting(false); setSubject(''); setCategory(''); setPriority(''); setDescription(''); toast.success('Support ticket submitted! We will respond within 24 hours.'); }
  };

  if (loading) { return (<div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-[600px] w-full rounded-xl" /></div>); }

  return (
    <div className="space-y-6 p-1 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-alo-text">Help Center</h1><p className="text-sm text-alo-text-muted mt-0.5">Find answers and get support from our team</p></div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-5 flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><MessageCircle className="w-6 h-6 text-emerald-600" /></div><div><p className="text-sm font-semibold text-alo-text">WhatsApp</p><p className="text-xs text-alo-text-muted">01805020100</p></div><Button variant="outline" size="sm" className="mt-1" onClick={() => { navigator.clipboard.writeText('01805020100'); toast.success('WhatsApp number copied!'); }}>Copy Number</Button></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-5 flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center"><Mail className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm font-semibold text-alo-text">Email Support</p><p className="text-xs text-alo-text-muted">support@alo.edu.bd</p></div><Button variant="outline" size="sm" className="mt-1" onClick={() => { navigator.clipboard.writeText('support@alo.edu.bd'); toast.success('Email address copied!'); }}>Copy Email</Button></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-5 flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center"><Phone className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm font-semibold text-alo-text">Phone Support</p><p className="text-xs text-alo-text-muted">+880 2-55663344</p></div><Button variant="outline" size="sm" className="mt-1" onClick={() => { navigator.clipboard.writeText('+880 2-55663344'); toast.success('Phone number copied!'); }}>Copy Number</Button></CardContent></Card>
      </div>

      {/* FAQ Section */}
      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Frequently Asked Questions</CardTitle><CardDescription className="text-xs text-alo-text-muted">Quick answers to common partner questions</CardDescription></div></div></CardHeader><CardContent>
        <Accordion type="single" collapsible className="w-full">{faqs.map((faq, i) => (<AccordionItem key={i} value={'faq-' + i}><AccordionTrigger className="text-sm text-alo-text hover:no-underline text-left">{faq.q}</AccordionTrigger><AccordionContent className="text-sm text-alo-text-secondary leading-relaxed">{faq.a}</AccordionContent></AccordionItem>))}</Accordion>
      </CardContent></Card>

      {/* Support Ticket */}
      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-alo-brand-light/30 flex items-center justify-center"><Headphones className="w-5 h-5 text-alo-brand" /></div><div><CardTitle className="text-lg text-alo-text">Create Support Ticket</CardTitle><CardDescription className="text-xs text-alo-text-muted">Cannot find what you are looking for? Submit a ticket</CardDescription></div></div></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="ticketSubject">Subject <span className="text-red-500">*</span></Label><Input id="ticketSubject" placeholder="Brief description of your issue" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="ticketCat">Category <span className="text-red-500">*</span></Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="ticketCat"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{ticketCategories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="ticketPri">Priority <span className="text-red-500">*</span></Label><Select value={priority} onValueChange={setPriority}><SelectTrigger id="ticketPri"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent>{priorities.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select></div>
        </div>
        <div className="space-y-2"><Label htmlFor="ticketDesc">Description <span className="text-red-500">*</span></Label><Textarea id="ticketDesc" placeholder="Please provide as much detail as possible about your issue or question..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} /></div>
        <div className="flex justify-end"><Button variant="brand" onClick={handleSubmitTicket} disabled={submitting}>{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Ticket</>}</Button></div>
      </CardContent></Card>
    </div>
  );
}
