"use client";

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
  "Free Counseling Request",
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
    value: "House 25, Road 11\nBanani, Dhaka 1213\nBangladesh",
    accent: "blue" as const,
  },
  {
    icon: "Phone",
    label: "Phone",
    value: "+880 1805 020101",
    href: "tel:+8801805020101",
    accent: "orange" as const,
  },
  {
    icon: "MessageCircle",
    label: "WhatsApp",
    value: "+880 1805 020101",
    href: "https://wa.me/8801805020101",
    accent: "emerald" as const,
  },
  {
    icon: "Mail",
    label: "Email",
    value: "hello@aloeducation.com",
    href: "mailto:hello@aloeducation.com",
    accent: "blue" as const,
  },
];

const HOURS = [
  { day: "Saturday – Thursday", time: "9:00 AM – 6:00 PM (Asia/Dhaka)" },
  { day: "Friday", time: "Closed" },
  { day: "Public Holidays", time: "By appointment only" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", icon: "Facebook", href: "https://www.facebook.com/aloeducation" },
  { label: "Instagram", icon: "Instagram", href: "https://www.instagram.com/aloeducation" },
  { label: "LinkedIn", icon: "Linkedin", href: "https://www.linkedin.com/company/aloeducation" },
  { label: "YouTube", icon: "Youtube", href: "https://www.youtube.com/@aloeducation" },
];

export function PublicContact({ onNavigate }: PublicContactProps) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    subject: "Free Counseling Request",
    message: "",
    consent: true,
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
          title: "Message sent!",
          description: data.message || "An ALO counselor will reach out within 24 hours.",
        });
      }
    } catch {
      toast({
        title: "Network error",
        description: "Please try again or call us at 01805020101.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0057B8]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Contact" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#E8501A] border border-[#E8501A]/20 hover:bg-[#FFF3EA]">
              <Icon name="Phone" className="mr-1 size-3" />
              24-Hour Response Promise
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Contact <span className="text-[#0057B8]">ALO Education</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
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
                    blue: "bg-[#EAF3FF] text-[#0057B8]",
                    orange: "bg-[#FFF3EA] text-[#E8501A]",
                    emerald: "bg-emerald-50 text-emerald-600",
                  };
                  return (
                    <div
                      key={info.label}
                      className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#0057B8]/30"
                    >
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", accentColors[info.accent])}>
                        <Icon name={info.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5A7299]">{info.label}</p>
                        {info.href ? (
                          <a
                            href={info.href}
                            target={info.href.startsWith("http") ? "_blank" : undefined}
                            rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="mt-0.5 block whitespace-pre-line text-sm font-semibold text-[#0B2447] transition-colors hover:text-[#0057B8]"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-[#0B2447]">{info.value}</p>
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
                  <div key={h.day} className="flex items-center justify-between border-b border-[#E2E8F0] py-2 last:border-0">
                    <span className="text-sm font-medium text-[#0B2447]">{h.day}</span>
                    <span className="text-sm text-[#5A7299]">{h.time}</span>
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
                    className="flex items-center gap-2 rounded-xl border border-[#0057B8]/15 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[#0057B8]/30 hover:bg-[#EAF3FF]/30"
                  >
                    <Icon name={s.icon} className="size-5 text-[#0057B8]" />
                    <span className="text-sm font-semibold text-[#0B2447]">{s.label}</span>
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Map placeholder */}
            <SectionCard title="Visit our office" description="Banani, Dhaka" icon="MapPin">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[#0057B8]/15 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
                      <Icon name="MapPin" className="size-7" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#0B2447]">House 25, Road 11, Banani</p>
                    <p className="text-xs text-[#5A7299]">Dhaka 1213, Bangladesh</p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Banani+Dhaka+Bangladesh"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0057B8] hover:underline"
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
              <Card className="rounded-2xl border-2 border-emerald-300 bg-emerald-50">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Icon name="Check" className="size-8" />
                  </div>
                  <p className="mt-5 text-xl font-black text-emerald-900">Message received!</p>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                    Thank you for contacting ALO Education. One of our counselors will reach out within 24 hours via
                    phone or WhatsApp. For urgent matters, call us at <span className="font-semibold">01805020101</span>.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button
                      onClick={() => onNavigate("public-home")}
                      className="h-11 bg-[#0057B8] text-white hover:bg-[#0057B8]/90"
                    >
                      <Icon name="Home" className="size-4" />
                      Back to Home
                    </Button>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ fullName: "", phone: "", email: "", subject: "Free Counseling Request", message: "", consent: true });
                      }}
                      variant="outline"
                      className="h-11 border-emerald-400 text-emerald-700 hover:bg-emerald-100"
                    >
                      Send another message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-2 border-[#0057B8]/15 bg-white alo-shadow">
                <CardContent className="p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-[#0057B8]">Send us a message</h3>
                    <p className="mt-1 text-sm text-[#5A7299]">We respond within 24 hours.</p>
                  </div>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold">Full Name <span className="text-[#E8501A]">*</span></Label>
                        <Input
                          required
                          value={form.fullName}
                          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                          className="mt-1 h-11"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Phone <span className="text-[#E8501A]">*</span></Label>
                        <Input
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="mt-1 h-11"
                          placeholder="+8801805020100"
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
                    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[#5A7299]">
                      <Checkbox
                        checked={form.consent}
                        onCheckedChange={(v) => setForm({ ...form, consent: v as boolean })}
                        className="mt-0.5 border-[#0057B8]/40 data-[state=checked]:bg-[#0057B8]"
                      />
                      <span>
                        I agree to be contacted by ALO Education via phone, WhatsApp, and email about my inquiry.
                        My data is private, RBAC-protected, and audit-logged. <span className="text-[#E8501A]">*</span>
                      </span>
                    </label>
                    <Button
                      type="submit"
                      disabled={loading || !form.fullName || !form.phone || !form.consent}
                      className="h-12 w-full bg-[#E8501A] text-white hover:bg-[#c8451a]"
                    >
                      {loading ? (
                        <><Icon name="Loader2" className="size-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Icon name="Send" className="size-4" /> Send Message</>
                      )}
                    </Button>
                    <p className="text-center text-xs text-[#5A7299]">
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
