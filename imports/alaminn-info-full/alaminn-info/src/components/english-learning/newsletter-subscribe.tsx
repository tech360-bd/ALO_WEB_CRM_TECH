"use client";

/**
 * NewsletterSubscribe — newsletter subscription box for the English
 * Learning home page. POSTs to the platform's existing /api/v1/newsletter
 * endpoint with `interest: "english-learning"`.
 */
import { useState, type FormEvent } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type State = "idle" | "loading" | "success" | "error";

export interface NewsletterSubscribeProps {
  className?: string;
  title?: string;
  description?: string;
}

export function NewsletterSubscribe({
  className,
  title = "Get English Learning tips & new resource alerts",
  description = "Bi-weekly digest of new lessons, practice tests, tutor spotlights and study tips. No spam — unsubscribe anytime.",
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState("error");
      setError("Please enter a valid email address.");
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          consent: true,
          interest: "english-learning",
          utmSource: "english-learning-home",
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setState("success");
        setEmail("");
      } else {
        setState("error");
        setError(json?.message ?? "Subscription failed. Please try again later.");
      }
    } catch {
      setState("error");
      setError("Network error. Please try again later.");
    }
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-ink-200 bg-white p-6 shadow-soft sm:p-8",
        className,
      )}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-700">
            <Bell className="h-3 w-3" aria-hidden="true" />
            Stay informed
          </div>
          <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {description}
          </p>
        </div>

        <div>
          {state === "success" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
            >
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <div className="font-display text-base font-bold">
                  You&apos;re subscribed!
                </div>
                <p className="mt-0.5 text-sm">
                  Look out for the next English Learning digest in your inbox.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <label
                htmlFor="el-newsletter-email"
                className="block text-xs font-semibold uppercase tracking-widest text-ink-600"
              >
                Email address
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="el-newsletter-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "error") setState("idle");
                    }}
                    disabled={state === "loading"}
                    aria-invalid={state === "error"}
                    aria-describedby="el-newsletter-caption el-newsletter-error"
                    className="h-11 rounded-xl border-ink-200 pl-9 text-sm focus-visible:border-orange-400 focus-visible:ring-orange-400/30"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={state === "loading"}
                  className="h-11 gap-1.5 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Subscribing…
                    </>
                  ) : (
                    <>Subscribe</>
                  )}
                </Button>
              </div>
              {state === "error" && error && (
                <p
                  id="el-newsletter-error"
                  role="alert"
                  className="flex items-start gap-1.5 text-xs font-medium text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
              <p
                id="el-newsletter-caption"
                className="text-[11px] leading-relaxed text-ink-500"
              >
                By subscribing, you consent to receiving bi-weekly English
                Learning digests from Alaminn.info. You can unsubscribe at any
                time. We never share your email.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
