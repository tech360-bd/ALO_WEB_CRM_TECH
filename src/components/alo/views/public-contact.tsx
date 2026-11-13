"use client";

import { ALO_CONTACT, ALO_PUBLIC_CONTACT_CTA, ALO_SOCIALS } from '@/lib/alo-site-info';
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { useToast } from "@/hooks/use-toast";
import { type ViewKey } from "@/lib/alo-types";

interface PublicContactProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const SUBJECTS = [
  "Counseling Request",
  "Application Support",
  "Visa & Immigration Question",
  "Scholarship Inquiry",
  "English Test Preparation",
  "University Shortlisting",
  "Partnership Opportunity",
  "Press / Media",
  "Feedback / Complaint",
  "Other",
];

const CONTACT_INFO = [
  {
    icon: "MapPin",
    label: "Office Address",
    value: ALO_CONTACT.address,
    accent: "blue" as const,
  },
  ...(ALO_CONTACT.hasContactPhone ? [{
    icon: "Phone",
    label: "Phone",
    value: ALO_CONTACT.mobileDisplay,
    href: ALO_CONTACT.mobileHref,
    accent: "orange" as const,
  }] : []),
  ...(ALO_CONTACT.hasWhatsApp ? [{
    icon: "MessageCircle",
    label: "WhatsApp",
    value: ALO_CONTACT.whatsappDisplay,
    href: ALO_CONTACT.whatsappHref,
    accent: "emerald" as const,
  }] : []),
  {
    icon: "Mail",
    label: "Email",
    value: ALO_CONTACT.email,
    href: ALO_CONTACT.emailHref,
    accent: "blue" as const,
  },
];

const HOURS = [
  { day: "Saturday – Thursday", time: "9:00 AM – 6:00 PM (Asia/Dhaka)" },
  { day: "Friday", time: "Closed" },
  { day: "Public Holidays", time: "By appointment only" },
];

const SOCIAL_LINKS = ALO_SOCIALS.map((social) => ({ label: social.label, href: social.href, icon: ({facebook:'Facebook',instagram:'Instagram',linkedin:'Linkedin',youtube:'Youtube'} as const)[social.id] }));

export function PublicContact({ onNavigate }: PublicContactProps) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    subject: "Counseling Request",
    message: "",
    consent: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.consent) {
      toast({
        title: "Please complete required fields",
        description: "Full name, phone, and consent are required.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          source: "WEBSITE",
          sourceDetail: `Contact page — ${form.subject}`,
          notes: form.message,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Submission failed", description: data.error, variant: "destructive" });
      } else {
        setSubmitted(true);
        toast({
          title: "Enquiry received",
          description: data.message || "Your enquiry has been submitted for staff review.",
        });
      }
    } catch {
      toast({
        title: "Network error",
        description: `Please try again or contact us via ${ALO_PUBLIC_CONTACT_CTA.label}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-br from-[var(--alo-brand-light)] via-white to-[var(--alo-cta-soft)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Contact" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] border border-[var(--alo-cta)]/20 hover:bg-[var(--alo-cta-soft)]">
              <Icon name="Phone" className="mr-1 size-3" />
              24-Hour Response Promise
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--alo-text)] sm:text-5xl">
              Contact <span className="text-[var(--alo-brand)]">ALO Education</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--alo-text-muted)] sm:text-lg">
              Have a question, want to book a consultation, or just need someone to talk to about studying abroad?
              We respond to every inquiry within 24 hours — guaranteed in writing.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* LEFT — Contact info */}
          <div className="space-y-6">
            <SectionCard title="Get in touch" description="Reach us via any of these channels" icon="PhoneCall">
              <div className="space-y-3">
                {CONTACT_INFO.map((info) => {
                  const accentColors = {
                    blue: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
                    orange: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]",
                    emerald: "bg-crm-success-bg text-crm-success-text",
                  };
                  return (
                    <div
                      key={info.label}
                      className="flex items-start gap-3 rounded-xl border border-[var(--alo-border)] bg-white p-4 transition-colors hover:border-[var(--alo-brand)]/30"
                    >
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", accentColors[info.accent])}>
                        <Icon name={info.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">{info.label}</p>
                        {info.href ? (
                          <a
                            href={info.href}
                            target={info.href.startsWith("http") ? "_blank" : undefined}
                            rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="mt-0.5 block whitespace-pre-line text-sm font-semibold text-[var(--alo-text)] transition-colors hover:text-[var(--alo-brand)]"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-[var(--alo-text)]">{info.value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Office hours */}
            <SectionCard title="Office hours" icon="Clock">
              <div className="space-y-2">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex items-center justify-between border-b border-[var(--alo-border)] py-2 last:border-0">
                    <span className="text-sm font-medium text-[var(--alo-text)]">{h.day}</span>
                    <span className="text-sm text-[var(--alo-text-muted)]">{h.time}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Social */}
            <SectionCard title="Follow ALO Education" description="Daily updates, student stories, and study-abroad tips" icon="Users">
              <div className="grid grid-cols-2 gap-3">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[var(--alo-brand)]/15 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30 hover:bg-[var(--alo-brand-light)]/30"
                  >
                    <Icon name={s.icon} className="size-5 text-[var(--alo-brand)]" />
                    <span className="text-sm font-semibold text-[var(--alo-text)]">{s.label}</span>
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Map placeholder */}
            <SectionCard title="Visit our office" description="Banani, Dhaka" icon="MapPin">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[var(--alo-brand)]/15 bg-gradient-to-br from-[var(--alo-brand-light)] via-white to-[var(--alo-cta-soft)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
                      <Icon name="MapPin" className="size-7" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[var(--alo-text)]">House 25, Road 11, Banani</p>
                    <p className="text-xs text-[var(--alo-text-muted)]">Dhaka 1213, Bangladesh</p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Banani+Dhaka+Bangladesh"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--alo-brand)] hover:underline"
                    >
                      Open in Google Maps
                      <Icon name="ExternalLink" className="size-3" />
                    </a>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT — Contact form */}
          <div>
            {submitted ? (
              <Card className="rounded-2xl border-2 border-crm-success-border bg-crm-success-bg">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--alo-success)] text-white">
                    <Icon name="Check" className="size-8" />
                  </div>
                  <p className="mt-5 text-xl font-black text-crm-success-text">Message received!</p>
                  <p className="mt-2 text-sm leading-relaxed text-crm-success-text">
                    Thank you for contacting ALO Education. Your enquiry has been received. Our team will respond according to current service hours and availability. For urgent matters, use <a className="font-semibold underline" href={ALO_PUBLIC_CONTACT_CTA.href}>{ALO_PUBLIC_CONTACT_CTA.label}</a>.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button
                      onClick={() => onNavigate("public-home")}
                      className="h-11 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
                    >
                      <Icon name="Home" className="size-4" />
                      Back to Home
                    </Button>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ fullName: "", phone: "", email: "", subject: "Counseling Request", message: "", consent: false });
                      }}
                      variant="outline"
                      className="h-11 border-[var(--alo-success)] text-crm-success-text hover:bg-crm-success-bg"
                    >
                      Send another message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-white alo-shadow">
                <CardContent className="p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-[var(--alo-brand)]">Send us a message</h3>
                    <p className="mt-1 text-sm text-[var(--alo-text-muted)]">We respond within 24 hours.</p>
                  </div>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold">Full Name <span className="text-[var(--alo-cta)]">*</span></Label>
                        <Input
                          required
                          value={form.fullName}
                          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                          className="mt-1 h-11"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Phone <span className="text-[var(--alo-cta)]">*</span></Label>
                        <Input
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="mt-1 h-11"
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-1 h-11"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Subject</Label>
                      <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                        <SelectTrigger className="mt-1 h-11">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Message</Label>
                      <Textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="mt-1 min-h-[120px]"
                        placeholder="Tell us about your goals, questions, or anything we should know."
                      />
                    </div>
                    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[var(--alo-text-muted)]">
                      <Checkbox
                        checked={form.consent}
                        onCheckedChange={(v) => setForm({ ...form, consent: v as boolean })}
                        className="mt-0.5 border-[var(--alo-brand)]/40 data-[state=checked]:bg-[var(--alo-brand)]"
                      />
                      <span>
                        I agree to be contacted by ALO Education via phone, WhatsApp, and email about my inquiry.
                        My data is private, RBAC-protected, and audit-logged. <span className="text-[var(--alo-cta)]">*</span>
                      </span>
                    </label>
                    <Button
                      type="submit"
                      disabled={loading || !form.fullName || !form.phone || !form.consent}
                      className="h-12 w-full bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)]"
                    >
                      {loading ? (
                        <><Icon name="Loader2" className="size-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Icon name="Send" className="size-4" /> Send Message</>
                      )}
                    </Button>
                    <p className="text-center text-xs text-[var(--alo-text-muted)]">
                      <Icon name="ShieldCheck" className="mr-1 inline size-3" />
                      Your data is encrypted and never shared without consent.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default PublicContact;
