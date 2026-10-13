"use client";

/**
 * ApplyCta — the "Apply Through ALO Education" button.
 *
 * Flow:
 *  1. Click → opens a consent Dialog explaining the ALO Education
 *     transfer, with a privacy-policy link and an unchecked consent
 *     checkbox.
 *  2. User ticks the checkbox and clicks "Continue to ALO Education".
 *  3. Frontend POSTs to `/api/v1/higher-study/referral` with the
 *     referralType + public context (no PII). Server creates the
 *     referral audit record + signs the token + builds the ALO
 *     Education URL.
 *  4. On success: shows a "Transferring…" state for ~1.2s (so the
 *     user sees confirmation), then `window.location.href` to the
 *     returned ALO Education URL.
 *  5. On error: shows an inline error message + retry option.
 *
 * All public context is typed via `ReferralContext` from types.ts.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Send,
  Loader2,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
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
import { Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALO_EDUCATION_URL } from "@/lib/higher-study/constants";
import type {
  ReferralType,
  ReferralContext,
} from "@/lib/higher-study/types";

type Phase = "idle" | "consent" | "creating" | "transferring" | "error";

export interface ApplyCtaProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> {
  referralType: ReferralType;
  countrySlug?: string;
  universitySlug?: string;
  courseSlug?: string;
  scholarshipSlug?: string;
  researchSlug?: string;
  supervisorSlug?: string;
  studyLevel?: string;
  intake?: string;
  campaignCode?: string;
  /** Button label override (default "Apply"). */
  label?: string;
  /** Show the ALO Education "via" sub-label (default true). */
  showViaLabel?: boolean;
}

/**
 * Render the Apply CTA with consent dialog + referral flow.
 */
export function ApplyCta({
  referralType,
  countrySlug,
  universitySlug,
  courseSlug,
  scholarshipSlug,
  researchSlug,
  supervisorSlug,
  studyLevel,
  intake,
  campaignCode,
  label = "Apply",
  showViaLabel = true,
  variant = "default",
  size = "default",
  className,
  children,
  ...rest
}: ApplyCtaProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [consented, setConsented] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Reset state when the dialog closes.
  useEffect(() => {
    if (phase === "idle") {
      setConsented(false);
      setErrorMsg(null);
      setRedirectUrl(null);
    }
  }, [phase]);

  const context: ReferralContext = {
    countrySlug,
    universitySlug,
    courseSlug,
    scholarshipSlug,
    researchSlug,
    supervisorSlug,
    studyLevel,
    intake,
    campaignCode,
  };

  const handleCreateReferral = useCallback(async () => {
    setPhase("creating");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/v1/higher-study/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralType,
          consentGiven: true,
          consentVersion: "2026-07",
          context,
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
          json?.message ?? "Could not start your application. Please try again.",
        );
      }
      setRedirectUrl(json.data.targetUrl);
      setPhase("transferring");
      // Brief delay so the user sees confirmation before redirect.
      setTimeout(() => {
        if (json.data?.targetUrl) {
          window.location.href = json.data.targetUrl;
        }
      }, 1200);
    } catch (err) {
      setPhase("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Network error. Please try again.",
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- context is derived from the listed primitive deps; including it would cause infinite re-creation
  }, [referralType, countrySlug, universitySlug, courseSlug, scholarshipSlug, researchSlug, supervisorSlug, studyLevel, intake, campaignCode]);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setPhase("consent")}
        className={cn(
          "gap-1.5 transition-all",
          className,
        )}
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
              Apply through ALO Education
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
              , Alaminn.info's official student-application partner. They will
              collect your details securely on their own domain to process
              your application.
            </DialogDescription>
          </DialogHeader>

          {/* Phase: consent (initial) */}
          {(phase === "consent" || phase === "creating") && (
            <div className="space-y-4">
              <ul className="space-y-2 rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    Only public context (study level, country, programme)
                    is shared with ALO Education in the referral URL.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    Your name, email and documents are collected by ALO
                    Education <strong>after</strong> this transfer.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    The referral is audited on Alaminn.info with a 24-hour
                    signed token. You can read our{" "}
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
                htmlFor="apply-consent"
                className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-200 p-3 text-sm font-medium text-ink-800 hover:bg-blue-50"
              >
                <Checkbox
                  id="apply-consent"
                  checked={consented}
                  onCheckedChange={(v) => setConsented(v === true)}
                  className="mt-0.5"
                  aria-label="Consent to transfer to ALO Education"
                />
                <span>
                  I consent to being transferred to ALO Education and to
                  Alaminn.info sharing the public context above for
                  application processing.
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

          {/* Phase: transferring */}
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

          {/* Phase: error */}
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
