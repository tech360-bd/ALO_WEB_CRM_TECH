"use client";

/**
 * ReferralCta — generic CTA that creates an ALO Education referral and
 * redirects the user. Mirrors `src/components/higher-study/apply-cta.tsx`
 * but posts to `/api/v1/english-learning/referral`.
 *
 * Supports three referral types:
 *   - "course-package"      (default; for paid course packages)
 *   - "tutor-booking"       (1:1 tutor bookings)
 *   - "mock-test-bundle"    (paid mock-test bundles)
 *
 * The dialog explains the ALO Education handoff and requires explicit
 * consent before transferring.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Send,
  Loader2,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ALO_EDUCATION_URL } from "@/lib/english-learning/constants";
import type { ReferralContext, ReferralType } from "@/lib/english-learning/types";

type Phase = "idle" | "consent" | "creating" | "transferring" | "error";

export interface ReferralCtaProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> {
  referralType: ReferralType;
  courseSlug?: string;
  tutorSlug?: string;
  testSlug?: string;
  level?: string;
  campaignCode?: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
  label?: string;
  showViaLabel?: boolean;
}

export function ReferralCta({
  referralType,
  courseSlug,
  tutorSlug,
  testSlug,
  level,
  campaignCode,
  sourceEntityId,
  sourceEntityType,
  label = "Apply",
  showViaLabel = true,
  variant = "default",
  size = "default",
  className,
  children,
  ...rest
}: ReferralCtaProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [consented, setConsented] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (phase === "idle") {
      setConsented(false);
      setErrorMsg(null);
      setRedirectUrl(null);
    }
  }, [phase]);

  const context: ReferralContext = {
    courseSlug,
    tutorSlug,
    testSlug,
    level,
    campaignCode,
  };

  const handleCreateReferral = useCallback(async () => {
    setPhase("creating");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/v1/english-learning/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralType,
          consentGiven: true,
          consentVersion: "english-learning-consent-v1",
          context,
          sourceEntityId,
          sourceEntityType,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            success: boolean;
            data?: { targetUrl?: string; referralCode?: string } | null;
            message?: string;
          }
        | null;
      if (!res.ok || !json?.success || !json.data?.targetUrl) {
        throw new Error(
          json?.message ?? "Could not start your referral. Please try again.",
        );
      }
      setRedirectUrl(json.data.targetUrl);
      setPhase("transferring");
      setTimeout(() => {
        if (json.data?.targetUrl) {
          window.location.href = json.data.targetUrl;
        }
      }, 1200);
    } catch (err) {
      setPhase("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- context is derived from the listed primitive deps; including it would cause infinite re-creation
  }, [
    referralType,
    courseSlug,
    tutorSlug,
    testSlug,
    level,
    campaignCode,
    sourceEntityId,
    sourceEntityType,
  ]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setPhase("consent")}
        className={cn("gap-1.5 transition-all", className)}
        {...rest}
      >
        {children ?? (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
            {showViaLabel && (
              <span className="ml-1 hidden text-[10px] font-medium uppercase tracking-widest opacity-80 sm:inline">
                via ALO Education
              </span>
            )}
          </>
        )}
      </Button>

      <Dialog
        open={phase !== "idle"}
        onOpenChange={(open) => {
          if (!open) setPhase("idle");
        }}
      >
        <DialogContent className="max-w-[480px] overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Continue on ALO Education
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ink-600">
              You are about to be transferred to{" "}
              <a
                href={ALO_EDUCATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-blue-700 hover:underline"
              >
                ALO Education
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              , Alaminn.info&apos;s official English-learning services partner.
              They will collect your details securely on their own domain to
              process your request.
            </DialogDescription>
          </DialogHeader>

          {(phase === "consent" || phase === "creating") && (
            <div className="space-y-4">
              <ul className="space-y-2 rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    Only public context (target test, level, tutor/course slug)
                    is shared with ALO Education in the referral URL.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    Your name, email and payment details are collected by ALO
                    Education <strong>after</strong> this transfer.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    The referral is audited on Alaminn.info with a 24-hour
                    signed token. Read our{" "}
                    <a
                      href="/legal/privacy"
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      privacy policy
                    </a>
                    .
                  </span>
                </li>
              </ul>

              <label
                htmlFor="el-consent"
                className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-200 p-3 text-sm font-medium text-ink-800 hover:bg-blue-50"
              >
                <Checkbox
                  id="el-consent"
                  checked={consented}
                  onCheckedChange={(v) => setConsented(v === true)}
                  className="mt-0.5"
                  aria-label="Consent to transfer to ALO Education"
                />
                <span>
                  I consent to being transferred to ALO Education and to
                  Alaminn.info sharing the public context above for service
                  processing.
                </span>
              </label>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-ink-200"
                    disabled={phase === "creating"}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={!consented || phase === "creating"}
                  onClick={handleCreateReferral}
                  className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                >
                  {phase === "creating" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Starting…
                    </>
                  ) : (
                    <>
                      Continue to ALO Education
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {phase === "transferring" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display text-base font-bold text-ink-900">
                  Transferring you to ALO Education…
                </div>
                <p className="mt-1 text-sm text-ink-600">
                  Your referral code has been created. If you are not
                  redirected automatically, click the button below.
                </p>
              </div>
              {redirectUrl && (
                <a
                  href={redirectUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-blue hover:bg-blue-700"
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                  Open ALO Education
                </a>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg ?? "Something went wrong."}</span>
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl">
                    Close
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={handleCreateReferral}
                  className="rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                >
                  Try again
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
