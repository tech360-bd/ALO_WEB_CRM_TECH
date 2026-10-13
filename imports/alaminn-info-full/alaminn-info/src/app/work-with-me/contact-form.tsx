"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

const INQUIRY_TYPES = [
  { value: "business-consultation", label: "Business Consultation" },
  { value: "operations-review", label: "Operations Review" },
  { value: "sales-strategy", label: "Sales Strategy" },
  { value: "education-advisory", label: "Education Advisory" },
  { value: "ai-automation", label: "AI / Automation" },
  { value: "crm-digital", label: "CRM / Digital" },
  { value: "tech-collaboration", label: "Tech Collaboration" },
  { value: "university-partnership", label: "University Partnership" },
  { value: "speaking", label: "Speaking / Workshop" },
  { value: "media", label: "Media / Press" },
  { value: "student-referral", label: "Student Referral" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [type, setType] = useState(INQUIRY_TYPES[0].value);
  const [challenge, setChallenge] = useState("");
  const [outcome, setOutcome] = useState("");
  const [timeline, setTimeline] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !challenge || !privacyConsent) {
      setError("Please fill in your name, email, your current challenge, and consent to be contacted.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName, email, organization,
          type, currentChallenge: challenge,
          desiredOutcome: outcome, timeline,
          privacyConsent: true, commsConsent: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Submission failed.");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h3 className="font-bold text-lg mb-2">Inquiry received.</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Thank you, {fullName}. I'll review your inquiry and respond within 1-2 business days.
        </p>
        <Button variant="outline" onClick={() => {
          setSubmitted(false); setFullName(""); setEmail(""); setOrganization("");
          setChallenge(""); setOutcome(""); setTimeline("");
        }}>
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name *</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Inquiry type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INQUIRY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="challenge">Current challenge *</Label>
        <Textarea
          id="challenge"
          rows={4}
          value={challenge}
          onChange={(e) => setChallenge(e.target.value)}
          placeholder="What are you trying to solve?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outcome">Desired outcome</Label>
        <Textarea
          id="outcome"
          rows={3}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="What does success look like?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">Timeline</Label>
        <Input
          id="timeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. next 30 days, Q3, etc."
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="h-4 w-4 mt-0.5"
          required
        />
        <span className="text-muted-foreground">
          I consent to be contacted about this inquiry and have read the privacy policy. *
        </span>
      </label>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
        Send Inquiry
      </Button>
    </form>
  );
}
