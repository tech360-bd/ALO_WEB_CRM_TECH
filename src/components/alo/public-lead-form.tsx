"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "./shared";
import { COUNTRIES, LEAD_SOURCES } from "@/lib/alo-types";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { collectAttributionPayload, rememberEntryAttribution } from "@/lib/analytics/attribution-payload";
import { ALO_PUBLIC_CONTACT_CTA } from "@/lib/alo-site-info";

interface PublicLeadFormProps {
  sourceTag?: string; // e.g. "UK country page", "University of Manchester page"
  preferredCountry?: string;
  preferredCourse?: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

const STUDY_LEVELS = ["Foundation", "Bachelor", "Top-up", "Pre-Masters", "Masters", "MBA", "PhD"];
const INTAKES = ["January", "February", "April", "May", "July", "September", "October", "November"];

export function PublicLeadForm({ sourceTag, preferredCountry, preferredCourse, compact = false, title = "Request study-abroad guidance", subtitle = "Submit your enquiry for staff review. Response timing depends on current service availability." }: PublicLeadFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    altPhone: "",
    preferredCountry: preferredCountry || "",
    preferredCourse: preferredCourse || "",
    preferredLevel: "",
    preferredIntake: "",
    budget: "",
    englishScore: "",
    notes: "",
    // Unchecked by default. A pre-ticked consent box is not consent — the
    // visitor has to make an affirmative choice for the record to mean
    // anything. It was previously `true` here AND never sent to the API, so the
    // checkbox was decorative while appearing to grant permission.
    consent: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; leadId?: string; duplicate?: boolean; message: string } | null>(null);
  /**
   * The attribution the visitor ARRIVED with, captured once. An application or
   * enquiry journey can move the visitor across SPA routes before they submit;
   * the campaign that acquired them must not be replaced by the route they
   * happened to end on.
   */
  const entryAttribution = React.useRef(rememberEntryAttribution());

  // `lead_form_start` fires the first time the visitor engages with the form,
  // not on mount — a rendered form nobody touched is not a started form.
  const startReported = React.useRef(false);
  const reportFormStart = React.useCallback(() => {
    if (startReported.current) return;
    startReported.current = true;
    trackAnalyticsEvent('lead_form_start', {
      form_id: 'public-lead-form',
      lead_source: sourceTag || 'public_website',
      destination: preferredCountry || undefined,
    }, { source: 'public-lead-form' });
  }, [sourceTag, preferredCountry]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) return;
    setLoading(true);
    setResult(null);
    // Prefer the remembered entry attribution; fall back to the current page in
    // case the visitor deep-linked straight into a later step.
    const attribution = entryAttribution.current ?? collectAttributionPayload();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          altPhone: form.altPhone,
          source: "WEBSITE",
          sourceDetail: sourceTag || "Public website",
          preferredCountry: form.preferredCountry,
          preferredCourse: form.preferredCourse,
          preferredLevel: form.preferredLevel,
          preferredIntake: form.preferredIntake,
          budget: form.budget,
          englishScore: form.englishScore,
          notes: form.notes,
          // Only the affirmative opt-in is transmitted. Contact details alone
          // are not consent, and the server records nothing unless this is true.
          consent: form.consent,
          ...(attribution ?? {}),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResult({ ok: false, message: data.error });
        // The failure is measured too: a form that silently loses submissions
        // is invisible in GA4 unless the error is an event.
        trackAnalyticsEvent('lead_form_submit', {
          form_id: 'public-lead-form',
          success: false,
          error_code: 'api_error',
        }, { source: 'public-lead-form' });
      } else {
        setResult({ ok: true, leadId: data.lead?.leadId, duplicate: data.duplicate, message: data.message });
        // `lead_reference` is ALO's own opaque reference code (LEAD-2026-XXXXX),
        // not a name or contact detail — this is the join that makes the
        // campaign -> lead -> application funnel traceable in GA4.
        trackAnalyticsEvent('lead_form_submit', {
          form_id: 'public-lead-form',
          success: true,
          lead_source: sourceTag || 'public_website',
          lead_reference: data.lead?.leadId || '',
          destination: form.preferredCountry || undefined,
        }, { source: 'public-lead-form' });
        // Submitting this form is a request for a counselor, which is the
        // business conversion the marketing team actually reports on.
        trackAnalyticsEvent('counselor_request', {
          form_id: 'public-lead-form',
          lead_source: sourceTag || 'public_website',
          destination: form.preferredCountry || undefined,
        }, { source: 'public-lead-form' });
      }
    } catch {
      setResult({ ok: false, message: `Connection issue. Please try again or contact us via ${ALO_PUBLIC_CONTACT_CTA.label}: ${ALO_PUBLIC_CONTACT_CTA.href}.` });
      trackAnalyticsEvent('lead_form_submit', {
        form_id: 'public-lead-form',
        success: false,
        error_code: 'network',
      }, { source: 'public-lead-form' });
    } finally {
      setLoading(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Icon name="Check" className="size-7" />
        </div>
        <p className="mt-4 text-lg font-bold text-emerald-900">Enquiry received</p>
        <p className="mt-1 text-sm text-emerald-800">{result.message}</p>
        {result.leadId && (
          <p className="mt-3 text-xs text-emerald-700">
            Lead ID: <span className="font-mono font-bold">{result.leadId}</span>
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" onClick={() => router.push("/application-process")}>
            View Application Process
          </Button>
          <Button variant="outline" className="border-emerald-400 text-emerald-700 hover:bg-emerald-100" onClick={() => setResult(null)}>
            Submit another lead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-white p-6 alo-shadow", compact && "p-5")}>
      <div className="mb-5">
        <h3 className="text-lg font-bold text-[var(--alo-brand)]">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <form
        onSubmit={submit}
        onFocus={reportFormStart}
        // Focus does not bubble in the DOM but React normalises onFocus to a
        // bubbling focusin, so a single handler covers every field.
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold">Full Name <span className="text-[var(--alo-cta)]">*</span></Label>
            <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 h-10" placeholder="Your full name" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Mobile <span className="text-[var(--alo-cta)]">*</span></Label>
            <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-10" placeholder="01XXXXXXXXX" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-10" placeholder="you@example.com" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Alternative Mobile</Label>
            <Input value={form.altPhone} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} className="mt-1 h-10" placeholder="Optional" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold">Preferred Country</Label>
            <Select value={form.preferredCountry} onValueChange={(v) => setForm({ ...form, preferredCountry: v })}>
              <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Study Level</Label>
            <Select value={form.preferredLevel} onValueChange={(v) => setForm({ ...form, preferredLevel: v })}>
              <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{STUDY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Intake</Label>
            <Select value={form.preferredIntake} onValueChange={(v) => setForm({ ...form, preferredIntake: v })}>
              <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{INTAKES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold">Preferred Course / Subject</Label>
            <Input value={form.preferredCourse} onChange={(e) => setForm({ ...form, preferredCourse: e.target.value })} className="mt-1 h-10" placeholder="e.g. MSc Computer Science" />
          </div>
          <div>
            <Label className="text-xs font-semibold">English Score (if any)</Label>
            <Input value={form.englishScore} onChange={(e) => setForm({ ...form, englishScore: e.target.value })} className="mt-1 h-10" placeholder="e.g. IELTS 6.5" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Message (optional)</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 min-h-[70px]" placeholder="Tell us about your goals, questions, or anything we should know." />
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
          <Checkbox checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: v as boolean })} className="mt-0.5 border-[var(--alo-brand)]/40 data-[state=checked]:bg-[var(--alo-brand)]" />
          <span>
            Optional: I agree to receive promotional updates from ALO Education by email or WhatsApp. I can withdraw this permission at any time. This choice is separate from the response to my enquiry.
          </span>
        </label>
        <Button type="submit" disabled={loading || !form.fullName || !form.phone} className="h-12 w-full bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90">
          {loading ? (
            <><Icon name="Loader2" className="size-4 animate-spin" /> Submitting...</>
          ) : (
            <><Icon name="Send" className="size-4" /> Submit Enquiry</>
          )}
        </Button>
        {result && !result.ok && (
          <p className="text-center text-xs font-medium text-red-600">{result.message}</p>
        )}
      </form>
    </div>
  );
}
