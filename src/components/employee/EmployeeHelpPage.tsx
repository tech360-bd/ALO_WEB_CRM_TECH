'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { HelpCircle, Phone, Mail, Monitor, MessageCircle, Send, Headphones, Users, Calculator } from 'lucide-react';

const contacts = [
  { label: 'IT Support', detail: 'ext 101 · it@alo.edu.bd', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'HR Department', detail: 'ext 102 · hr@alo.edu.bd', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Finance', detail: 'ext 103 · finance@alo.edu.bd', icon: Calculator, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Manager', detail: 'ext 105 · sarah.khan@alo.edu.bd', icon: Headphones, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const faqs = [
  { q: 'How do I reset my password?', a: 'Go to Settings > Change Password. Enter your current password and set a new one. If you forgot your current password, contact IT Support (ext 101).' },
  { q: 'How to submit a leave request?', a: 'Navigate to Leave Management from the sidebar. Click "Apply for Leave", select the type, dates, and reason. Your manager will review and approve/reject within 24 hours.' },
  { q: 'How to update student application status?', a: 'Go to Applications page, find the application, click "Update Status" button, select the new stage. The student will be automatically notified.' },
  { q: 'Where can I find my payslips?', a: 'Go to Salary & Payslips from the sidebar. You can view your current month breakdown and download PDF payslips from the history table.' },
  { q: 'How to contact a student via the portal?', a: 'Go to Messages, select the student conversation, type your message and press Enter or click Send. Students will see messages in their portal.' },
  { q: 'How to request document review?', a: 'Go to Documents page to see documents awaiting your review. Click Approve, Reject, or Request More Info with optional notes.' },
  { q: 'How to track my attendance?', a: 'Go to Attendance page. Use the Clock In/Out buttons to record your daily attendance. The monthly calendar shows your attendance history.' },
  { q: 'How to generate reports?', a: 'Go to Reports page. Available reports include Daily Activity, Student Pipeline, Application Summary, Financial, Performance, and Attendance. Click Download to get the file.' },
];

export default function EmployeeHelpPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: '', priority: '', subject: '', description: '' });

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const handleSubmit = async () => {
    if (!form.category || !form.priority || !form.subject || !form.description) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    try {
      await fetch('/api/employee/support-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast.success('Support ticket submitted successfully');
      setDialogOpen(false);
      setForm({ category: '', priority: '', subject: '', description: '' });
    } catch { toast.error('Failed to submit ticket'); }
    setSubmitting(false);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Help Center</h1>
          <p className="text-sm text-alo-text-muted">Find answers and get support</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Send className="w-4 h-4" /> Submit Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Support Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="access">Access Problem</SelectItem>
                  <SelectItem value="data">Data/Report Issue</SelectItem>
                  <SelectItem value="hr">HR Related</SelectItem>
                  <SelectItem value="finance">Finance Related</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent></Select></div>
              <div><Label>Priority</Label><Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent></Select></div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief description" className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the issue" rows={4} className="mt-1" /></div>
              <Button variant="brand" className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {contacts.map(c => (
          <Card key={c.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mx-auto mb-3`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
              <p className="text-sm font-semibold text-alo-text">{c.label}</p>
              <p className="text-xs text-alo-text-muted mt-1">{c.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Frequently Asked Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-alo-text hover:text-alo-brand">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-alo-text-secondary leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
