"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon, PageHeader } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import { ALO_CONTACT, ALO_PUBLIC_CONTACT_CTA } from "@/lib/alo-site-info";

export function StudentHelp() {
  const { toast } = useToast();
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [category, setCategory] = React.useState("GENERAL");

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Subject and message required", variant: "destructive" });
      return;
    }
    const body = `Category: ${category}\n\n${message.trim()}\n\nStudent reference: please add your reference if appropriate.`;
    const mailto = `${ALO_CONTACT.emailHref}?subject=${encodeURIComponent(`[Student support] ${subject.trim()}`)}&body=${encodeURIComponent(body)}`;
    window.location.assign(mailto);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Help Center" subtitle="Contact ALO Education using the configured public options" icon="HelpCircle" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white lg:col-span-2"><CardContent className="space-y-4 p-6">
          <h3 className="text-lg font-bold text-[var(--alo-text)]">Prepare a support email</h3>
          <p className="text-sm text-[var(--alo-text-muted)]">This form opens your email application. It does not create or save a support ticket in the portal.</p>
          <div><Label htmlFor="support-subject">Subject</Label><Input id="support-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your issue" className="mt-1" /></div>
          <div><Label htmlFor="support-category">Category</Label><select id="support-category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-[var(--alo-brand-border)] bg-white px-3"><option value="GENERAL">General</option><option value="TECHNICAL">Technical</option><option value="ADMISSION">Admission</option><option value="VISA">Visa</option><option value="PAYMENT">Payment</option><option value="DOCUMENT">Document</option></select></div>
          <div><Label htmlFor="support-message">Message</Label><Textarea id="support-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe your question. Do not include passwords or sensitive document numbers." className="mt-1" /></div>
          <Button onClick={handleSubmit} className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]">Prepare Support Email</Button>
        </CardContent></Card>
        <div className="space-y-4">
          <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)]"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"><Icon name="MessageCircle" className="size-5" /></div><div><p className="font-semibold text-[var(--alo-text)]">{ALO_CONTACT.hasWhatsApp ? "WhatsApp" : "Contact ALO Education"}</p><a className="text-sm text-[var(--alo-text-muted)] underline" href={ALO_PUBLIC_CONTACT_CTA.href} {...(ALO_CONTACT.hasWhatsApp ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{ALO_PUBLIC_CONTACT_CTA.label}</a></div></div></CardContent></Card>
          <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)]"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]"><Icon name="Mail" className="size-5" /></div><div><p className="font-semibold text-[var(--alo-text)]">Email</p><a className="text-sm text-[var(--alo-text-muted)] underline" href={ALO_CONTACT.emailHref}>{ALO_CONTACT.email}</a></div></div></CardContent></Card>
          <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)]"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-crm-success-bg text-crm-success-text"><Icon name="Bot" className="size-5" /></div><div><p className="font-semibold text-[var(--alo-text)]">AI Assistant</p><p className="text-sm text-[var(--alo-text-muted)]">General information only; it cannot access student records.</p></div></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
export default StudentHelp;
