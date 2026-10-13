"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MeetingType = "discovery" | "strategy" | "partnership" | "education";

const MEETING_TYPES: { id: MeetingType; label: string; duration: string; description: string }[] = [
  { id: "discovery", label: "Discovery Call", duration: "30 min", description: "Quick introductory conversation to understand your context." },
  { id: "strategy", label: "Strategy Session", duration: "60 min", description: "Deep-dive into a specific business challenge or opportunity." },
  { id: "partnership", label: "Partnership Discussion", duration: "45 min", description: "Institutional, university or tech-partner collaboration." },
  { id: "education", label: "Education Advisory", duration: "30 min", description: "Student referral, counselling operations, or education-business growth." },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "20:00", "20:30", "21:00",
];

const TIMEZONE = "Asia/Dhaka (BST, UTC+6)";

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 5; // Friday weekend in Bangladesh
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ScheduleMeetingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  // Body scroll lock + ESC handler — kept here (parent) so it persists across
  // mount/unmount of the inner form (which has its own state).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <ScheduleMeetingDialog onOpenChange={onOpenChange} />
      )}
    </AnimatePresence>
  );
}

function ScheduleMeetingDialog({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // type → date → details → confirm
  const [meetingType, setMeetingType] = useState<MeetingType>("discovery");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ reference: string } | null>(null);

  const days = useMemo(() => getNext14Days(), []);

  const canProceed = (() => {
    if (step === 0) return !!meetingType;
    if (step === 1) return !!selectedDate && !!selectedTime;
    if (step === 2) return name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);
    return true;
  })();

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/v1/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingType,
          requestedDate: selectedDate?.toISOString(),
          requestedTime: selectedTime,
          contactName: name,
          contactEmail: email,
          organization: org || undefined,
          topic: topic || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setSubmitError(
          Array.isArray(json.errors) && json.errors.length > 0
            ? `Submission failed: ${json.errors.join(", ")}`
            : json.message || "Submission failed."
        );
        setSubmitting(false);
        return;
      }
      setConfirmation({ reference: json.data?.reference || "" });
      setStep(3);
    } catch {
      setSubmitError("Network error. Please try again or email directly.");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a meeting"
    >
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-2xl"
      >
            {/* Header */}
            <div className="relative shrink-0 grad-intelligence px-6 py-5 text-white">
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-blue-100 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                <Sparkles className="h-3 w-3 text-orange-300" />
                Book a Strategic Conversation
              </div>
              <h2 className="mt-1.5 font-display text-xl font-extrabold leading-tight">
                {step === 3 ? "Request received" : "Schedule a meeting with Al Aminn"}
              </h2>
              {step < 3 && (
                <p className="mt-1 max-w-md text-sm text-blue-100">
                  Choose a format, pick a time, and share context. Confirmation arrives within 24 hours.
                </p>
              )}
            </div>

            {/* Progress steps */}
            {step < 3 && (
              <div className="shrink-0 border-b border-ink-100 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px]">
                  {["Format", "Time", "Details"].map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                          step >= i ? "bg-orange-600 text-white" : "bg-ink-100 text-ink-500"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          step === i ? "text-ink-800" : "text-ink-500"
                        )}
                      >
                        {label}
                      </span>
                      {i < 2 && <span className="mx-1 h-px w-6 bg-ink-200" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto scroll-area px-6 py-5">
              {step === 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {MEETING_TYPES.map((m) => {
                    const active = meetingType === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMeetingType(m.id)}
                        className={cn(
                          "group flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
                          active
                            ? "border-orange-500 bg-orange-50/60 shadow-orange"
                            : "border-ink-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-display text-sm font-bold text-ink-900">
                            {m.label}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              active ? "bg-orange-600 text-white" : "bg-ink-100 text-ink-600"
                            )}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {m.duration}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-ink-500">{m.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                      Next 14 days · {TIMEZONE}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                      <MapPin className="h-3 w-3" />
                      Fridays are weekends (BD)
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {days.map((d) => {
                      const disabled = isWeekend(d);
                      const active = selectedDate?.toDateString() === d.toDateString();
                      return (
                        <button
                          key={d.toISOString()}
                          disabled={disabled}
                          onClick={() => setSelectedDate(d)}
                          className={cn(
                            "flex flex-col items-center rounded-xl border py-2 transition-all",
                            disabled
                              ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300"
                              : active
                                ? "border-orange-500 bg-orange-50/60 text-orange-700 shadow-orange"
                                : "border-ink-200 bg-white text-ink-700 hover:border-blue-300 hover:bg-blue-50/40"
                          )}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            {fmtDay(d)}
                          </span>
                          <span className="mt-0.5 text-xs font-bold tabular">{fmtDate(d)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="mt-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                        Available times
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {TIME_SLOTS.map((t) => {
                          const active = selectedTime === t;
                          return (
                            <button
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className={cn(
                                "rounded-lg border py-2 text-xs font-semibold tabular transition-all",
                                active
                                  ? "border-orange-500 bg-orange-600 text-white shadow-orange"
                                  : "border-ink-200 bg-white text-ink-700 hover:border-blue-300 hover:bg-blue-50/40"
                              )}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                        Full name *
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Organization (optional)
                    </label>
                    <input
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      placeholder="Company / institution"
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      What would you like to discuss? (optional)
                    </label>
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="One or two sentences about your context, goals or challenge…"
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-xs leading-relaxed text-ink-600">
                    <strong className="font-semibold text-ink-800">Summary:</strong>{" "}
                    {MEETING_TYPES.find((m) => m.id === meetingType)?.label} ·{" "}
                    {MEETING_TYPES.find((m) => m.id === meetingType)?.duration} ·{" "}
                    {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}{" "}
                    at {selectedTime} · {TIMEZONE}
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs font-medium leading-relaxed text-red-700">
                      {submitError}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16 }}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                  >
                    <CheckCircle2 className="h-9 w-9" />
                  </motion.div>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-ink-900">
                    Request received
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-ink-600">
                    Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We&rsquo;ve received your request for a{" "}
                    <strong className="font-semibold text-ink-800">
                      {MEETING_TYPES.find((m) => m.id === meetingType)?.label}
                    </strong>{" "}
                    on{" "}
                    <strong className="font-semibold text-ink-800">
                      {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </strong>{" "}
                    at <strong className="font-semibold text-ink-800">{selectedTime}</strong>. A
                    confirmation with the meeting link will arrive at{" "}
                    <strong className="font-semibold text-ink-800">{email}</strong> within 24 hours.
                  </p>
                  {confirmation?.reference && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50/70 px-3 py-1.5 text-[11px] font-semibold text-ink-700">
                      Reference: <span className="font-mono text-orange-700">{confirmation.reference}</span>
                    </div>
                  )}
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-2 text-xs font-semibold text-blue-700">
                    <Video className="h-3.5 w-3.5" />
                    Meeting held via Google Meet · link shared on confirmation
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {step < 3 && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-ink-100 px-6 py-3">
                <button
                  onClick={() => step > 0 && setStep((s) => (s - 1) as 0 | 1 | 2)}
                  disabled={step === 0}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    step === 0
                      ? "cursor-not-allowed text-ink-300"
                      : "text-ink-700 hover:bg-ink-50"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="flex items-center gap-2 text-[11px] text-ink-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Step {step + 1} of 3
                </div>
                {step < 2 ? (
                  <button
                    onClick={() => canProceed && setStep((s) => (s + 1) as 0 | 1 | 2)}
                    disabled={!canProceed}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                      canProceed
                        ? "bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                        : "cursor-not-allowed bg-ink-100 text-ink-400"
                    )}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={!canProceed || submitting}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                      canProceed && !submitting
                        ? "bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                        : "cursor-not-allowed bg-ink-100 text-ink-400"
                    )}
                  >
                    {submitting ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                        />
                        Sending…
                      </>
                    ) : (
                      <>
                        Request meeting
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="flex shrink-0 justify-end gap-3 border-t border-ink-100 px-6 py-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                >
                  Done
                </button>
              </div>
            )}
      </motion.div>
    </motion.div>
  );
}
