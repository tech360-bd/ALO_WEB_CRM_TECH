"use client";

/**
 * ConsultationForm — booking form for a free 1:1 Higher Study
 * consultation.
 *
 * Fields: name, email, phone (optional), preferred date, preferred
 * time, topic, country of interest, study level, consent checkbox.
 *
 * On submit: POST to `/api/v1/higher-study/consultation` which creates
 * a MeetingRequest + HigherStudyReferral record. On success, show a
 * success state with the reference number.
 */
import { useCallback, useState, type FormEvent } from "react";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Tag,
  Globe2,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { COUNTRIES_LIST, STUDY_LEVEL_GROUPS } from "@/lib/higher-study/constants";

interface FormState {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  requestedDate: string;
  requestedTime: string;
  topic: string;
  countrySlug: string;
  studyLevel: string;
  consentGiven: boolean;
  /** honeypot — should stay empty */
  website: string;
}

const INITIAL: FormState = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  requestedDate: "",
  requestedTime: "",
  topic: "",
  countrySlug: "",
  studyLevel: "",
  consentGiven: false,
  website: "",
};

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "20:00", "20:30", "21:00",
];

const TOPICS = [
  { value: "university-application", label: "University Application" },
  { value: "course-selection", label: "Course Selection" },
  { value: "scholarship", label: "Scholarship Strategy" },
  { value: "phd", label: "PhD / Research" },
  { value: "visa", label: "Student Visa" },
  { value: "english-test", label: "English Test Preparation" },
  { value: "other", label: "Other" },
];

interface SuccessState {
  reference: string;
  requestedDate: string;
  requestedTime: string;
}

/**
 * Render the consultation booking form.
 */
export function ConsultationForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      // Validate
      const errors: string[] = [];
      if (!form.contactName || form.contactName.length < 2) errors.push("contactName_required");
      if (!form.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
        errors.push("contactEmail_invalid");
      }
      if (!form.requestedDate) errors.push("requestedDate_required");
      if (!form.requestedTime) errors.push("requestedTime_required");
      if (!form.topic) errors.push("topic_required");
      if (!form.consentGiven) errors.push("consent_required");
      if (errors.length > 0) {
        setError("Please complete all required fields and tick the consent box.");
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch("/api/v1/higher-study/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json() as { success: boolean; data?: SuccessState; message?: string };
        if (!res.ok || !json.success) {
          throw new Error(json.message ?? "Server error");
        }
        setSuccess(json.data ?? null);
        setForm(INITIAL);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [form],
  );

  const copyReference = useCallback(() => {
    if (!success) return;
    navigator.clipboard
      .writeText(success.reference)
      .then(() => toast.success("Reference copied"))
      .catch(() => toast.error("Could not copy"));
  }, [success]);

  if (success) {
    return (
      <Card className="rounded-2xl border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold text-ink-900">
              Consultation requested!
            </h2>
            <p className="mt-1 text-sm text-ink-700">
              We&apos;ve received your booking request and will confirm your
              slot within 24 hours via email. A meeting link will be sent to
              the email address you provided.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-ink-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Reference
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-display text-sm font-extrabold text-ink-900">
                    {success.reference}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyReference}
                    className="h-6 w-6 rounded-md p-0 text-ink-500 hover:bg-ink-100"
                    aria-label="Copy reference"
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-ink-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Requested date
                </p>
                <p className="mt-1 font-display text-sm font-bold text-ink-900">
                  {new Date(success.requestedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-xl border border-ink-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Requested time
                </p>
                <p className="mt-1 font-display text-sm font-bold text-ink-900">
                  {success.requestedTime} (Asia/Dhaka)
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSuccess(null)}
              className="mt-5 gap-1.5 rounded-xl border-ink-200"
            >
              Book another consultation
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft sm:p-8">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {/* Honeypot (hidden from users) */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden="true"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="contactName" required>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
              className="h-11 rounded-xl border-ink-200 pl-10"
              aria-invalid={!form.contactName}
            />
            <FieldIcon icon={User} />
          </Field>

          <Field label="Email" htmlFor="contactEmail" required>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-11 rounded-xl border-ink-200 pl-10"
              aria-invalid={!form.contactEmail}
            />
            <FieldIcon icon={Mail} />
          </Field>

          <Field label="Phone (optional)" htmlFor="contactPhone">
            <Input
              id="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              placeholder="+880 1XXX-XXXXXX"
              autoComplete="tel"
              className="h-11 rounded-xl border-ink-200 pl-10"
            />
            <FieldIcon icon={Phone} />
          </Field>

          <Field label="Topic" htmlFor="topic" required>
            <Select
              value={form.topic || "__none__"}
              onValueChange={(v) => update("topic", v === "__none__" ? "" : v)}
            >
              <SelectTrigger id="topic" className="h-11 rounded-xl border-ink-200 pl-10">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select —</SelectItem>
                {TOPICS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldIcon icon={Tag} />
          </Field>

          <Field label="Preferred date" htmlFor="requestedDate" required>
            <Input
              id="requestedDate"
              type="date"
              value={form.requestedDate}
              onChange={(e) => update("requestedDate", e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
              className="h-11 rounded-xl border-ink-200 pl-10"
            />
            <FieldIcon icon={Calendar} />
          </Field>

          <Field label="Preferred time" htmlFor="requestedTime" required>
            <Select
              value={form.requestedTime || "__none__"}
              onValueChange={(v) => update("requestedTime", v === "__none__" ? "" : v)}
            >
              <SelectTrigger id="requestedTime" className="h-11 rounded-xl border-ink-200 pl-10">
                <SelectValue placeholder="Select time (Asia/Dhaka)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select —</SelectItem>
                {TIME_SLOTS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldIcon icon={Clock} />
          </Field>

          <Field label="Country of interest" htmlFor="countrySlug">
            <Select
              value={form.countrySlug || "__none__"}
              onValueChange={(v) => update("countrySlug", v === "__none__" ? "" : v)}
            >
              <SelectTrigger id="countrySlug" className="h-11 rounded-xl border-ink-200 pl-10">
                <SelectValue placeholder="Any country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Any / Not sure —</SelectItem>
                {COUNTRIES_LIST.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.flagEmoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldIcon icon={Globe2} />
          </Field>

          <Field label="Study level" htmlFor="studyLevel">
            <Select
              value={form.studyLevel || "__none__"}
              onValueChange={(v) => update("studyLevel", v === "__none__" ? "" : v)}
            >
              <SelectTrigger id="studyLevel" className="h-11 rounded-xl border-ink-200 pl-10">
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Any / Not sure —</SelectItem>
                {STUDY_LEVEL_GROUPS.map((g) => (
                  <SelectItem key={g.id} value={g.id} disabled>
                    — {g.label} —
                  </SelectItem>
                ))}
                {STUDY_LEVEL_GROUPS.flatMap((g) =>
                  g.values.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
            <FieldIcon icon={GraduationCap} />
          </Field>
        </div>

        {/* Consent */}
        <label
          htmlFor="consent"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-ink-50/40 p-4 hover:bg-ink-50"
        >
          <Checkbox
            id="consent"
            checked={form.consentGiven}
            onCheckedChange={(v) => update("consentGiven", v === true)}
            className="mt-0.5"
            aria-invalid={!form.consentGiven}
          />
          <div className="flex-1 text-xs leading-relaxed text-ink-700">
            <span className="font-semibold text-ink-900">
              I consent to Alaminn.info collecting my name, email, phone (if provided)
              and consultation preferences
            </span>{" "}
            for the sole purpose of scheduling and conducting this consultation. My
            details will be shared with the ALO Education team for follow-up. I can
            request deletion at any time by emailing{" "}
            <a href="mailto:privacy@alaminn.info" className="font-semibold text-blue-700 underline">
              privacy@alaminn.info
            </a>
            . See our{" "}
            <a href="/legal/privacy" className="font-semibold text-blue-700 underline">
              Privacy Policy
            </a>{" "}
            for full details.
          </div>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
          <p className="text-xs text-ink-500">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Free · 30 minutes · Online (Google Meet)
          </p>
          <Button
            type="submit"
            disabled={submitting || !form.consentGiven}
            className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              <>
                Request consultation
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Field helpers ───────────────────────────────────────────────────

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, htmlFor, required, children }: FieldProps) {
  return (
    <div>
      <Label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-ink-600"
      >
        {label}
        {required && <span className="ml-0.5 text-orange-600" aria-hidden="true">*</span>}
      </Label>
      <div className="relative mt-1.5">
        {children}
      </div>
    </div>
  );
}

function FieldIcon({ icon: Icon }: { icon: typeof User }) {
  return (
    <Icon
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
      aria-hidden="true"
    />
  );
}
