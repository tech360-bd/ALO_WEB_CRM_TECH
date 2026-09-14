"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/alo/shared";

const SERVICE_LABELS: Record<string, string> = {
  ADMISSIONS: "University Admissions",
  VISA: "Visa Guidance",
  ENGLISH_TEST: "English Test Preparation",
  SOP: "SOP & CV Writing",
  GENERAL: "General Consultation",
};

export function PublicReviewSubmit({ token }: { token: string }) {
  const { toast } = useToast();
  const [invitation, setInvitation] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = React.useState(false);

  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [consentPublish, setConsentPublish] = React.useState(false);
  const [consentMarketing, setConsentMarketing] = React.useState(false);
  const [consentShowName, setConsentShowName] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [moderationResult, setModerationResult] = React.useState<any>(null);

  const fetchInvitation = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/submit/${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load invitation");
        if (json.alreadySubmitted) setAlreadySubmitted(true);
      } else {
        setInvitation(json.invitation);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void fetchInvitation();
  }, [fetchInvitation]);

  const submit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    if (reviewText.trim().length < 10) {
      toast({ title: "Please write at least a short review (10+ characters)", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/submit/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          reviewText,
          consentPublish,
          consentMarketing,
          consentShowName,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Submission failed");
      }
      setSubmitted(true);
      setModerationResult(json.moderation);
      toast({ title: "Review submitted!", description: json.message });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f0fb] to-white p-4">
        <Card className="max-w-lg w-full p-8 rounded-2xl border-2 border-[#E2E8F0] text-center">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-[#0057B8]/20 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white p-4">
        <Card className="max-w-lg w-full p-8 rounded-2xl border-2 border-amber-200 text-center">
          <Icon name="Clock" className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {alreadySubmitted ? "Review Already Submitted" : "Link Unavailable"}
          </h1>
          <p className="text-slate-600 text-sm">
            {error || "This review link has already been used or has expired."}
          </p>
          <p className="text-xs text-slate-400 mt-4">
            If you believe this is an error, please contact your ALO Education counselor.
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
        <Card className="max-w-lg w-full p-8 rounded-2xl border-2 border-emerald-200 text-center">
          <div className="h-16 w-16 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Icon name="Check" className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-600 text-sm mb-6">
            Your review has been submitted successfully. {consentPublish
              ? "It will be published on the ALO Education website after moderation."
              : "Your feedback has been recorded internally."}
          </p>

          {moderationResult && moderationResult.flags.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-left">
              <div className="text-xs font-semibold text-amber-700 mb-1">Review flagged for manual review:</div>
              <div className="flex flex-wrap gap-1">
                {moderationResult.flags.map((f: string) => (
                  <Badge key={f} className="bg-amber-100 text-amber-700 text-xs">{f}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Multi-channel: show Google/Facebook links if available */}
          {(invitation.googleReviewUrl || invitation.facebookRecommendUrl) && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4 text-left">
              <div className="text-sm font-semibold text-[#0057B8] mb-2">Optional: Also share on these platforms</div>
              <p className="text-xs text-slate-600 mb-3">
                You can optionally share your experience on Google and Facebook. Clicking a link opens the official platform — you submit the review yourself. We never post on your behalf.
              </p>
              <div className="flex flex-wrap gap-2">
                {invitation.googleReviewUrl && (
                  <a href={invitation.googleReviewUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-[#0057B8] text-[#0057B8]">
                      <Icon name="Star" className="h-4 w-4 mr-1" /> Google Reviews
                    </Button>
                  </a>
                )}
                {invitation.facebookRecommendUrl && (
                  <a href={invitation.facebookRecommendUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-[#0057B8] text-[#0057B8]">
                      <Icon name="ThumbsUp" className="h-4 w-4 mr-1" /> Facebook
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Need help? Contact your counselor or email info@aloeducation.com
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f0fb] via-white to-orange-50/30 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#F37021] flex items-center justify-center text-white font-bold text-lg">A</div>
            <div className="text-left">
              <div className="font-bold text-slate-900">ALO Education</div>
              <div className="text-xs text-slate-500">Study Abroad Consultants</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Share Your Experience</h1>
          <p className="text-sm text-slate-600">
            Hi {invitation.studentName}! We'd love to hear about your journey with ALO Education.
          </p>
        </div>

        <Card className="rounded-2xl border-2 border-[#E2E8F0] p-6 space-y-5">
          {/* Context */}
          {(invitation.country || invitation.serviceType) && (
            <div className="flex flex-wrap gap-2">
              {invitation.country && <Badge className="bg-blue-50 text-blue-700">🌍 {invitation.country}</Badge>}
              {invitation.serviceType && <Badge className="bg-orange-50 text-orange-700">{SERVICE_LABELS[invitation.serviceType] || invitation.serviceType}</Badge>}
            </div>
          )}

          {/* Rating */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">Your Rating *</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <Icon
                    name="Star"
                    className={`h-8 w-8 ${(hoverRating || rating) >= star ? "fill-[#F37021] text-[#F37021]" : "text-slate-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">Your Review *</Label>
            <Textarea
              className="mt-2 min-h-[120px]"
              placeholder="Tell us about your experience with ALO Education. How did we help you? What did you appreciate most?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={2000}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{reviewText.length}/2000</div>
          </div>

          {/* Consent */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-700">Consent — please select what you're comfortable with</div>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consentPublish} onCheckedChange={(v) => setConsentPublish(!!v)} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700">Publish on ALO Education website</div>
                <div className="text-xs text-slate-500">Your review may appear on our website's reviews page.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consentMarketing} onCheckedChange={(v) => setConsentMarketing(!!v)} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700">Allow use in marketing materials</div>
                <div className="text-xs text-slate-500">We may use your review (with or without your name) in social media, brochures, and ads.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consentShowName} onCheckedChange={(v) => setConsentShowName(!!v)} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700">Allow my name to appear with the review</div>
                <div className="text-xs text-slate-500">If unchecked, your review will be shown as "Anonymous ALO Student".</div>
              </div>
            </label>
          </div>

          {/* AI notice */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-slate-600">
            <Icon name="Info" className="h-4 w-4 inline mr-1 text-[#0057B8]" />
            Your review will be checked by our AI system for spam and inappropriate content. We never modify your words — the review is published as you wrote it (after moderation).
          </div>

          {/* Submit */}
          <Button
            onClick={submit}
            disabled={submitting || rating === 0 || reviewText.trim().length < 10}
            className="w-full h-12 bg-[#F37021] hover:bg-[#F37021]/90 text-white"
          >
            {submitting ? (
              <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Icon name="Send" className="h-4 w-4 mr-2" /> Submit Review</>
            )}
          </Button>

          {/* Optional multi-channel links (shown before submission too) */}
          {(invitation.googleReviewUrl || invitation.facebookRecommendUrl) && (
            <div className="border-t border-slate-200 pt-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">Optional: Also share on these platforms</div>
              <p className="text-xs text-slate-500 mb-3">
                After submitting here, you can optionally share your experience on Google and/or Facebook. You'll submit the review yourself on each platform — we never post on your behalf.
              </p>
              <div className="flex flex-wrap gap-2">
                {invitation.googleReviewUrl && (
                  <a href={invitation.googleReviewUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-[#0057B8] text-[#0057B8]">
                      <Icon name="Star" className="h-4 w-4 mr-1" /> Google Reviews
                    </Button>
                  </a>
                )}
                {invitation.facebookRecommendUrl && (
                  <a href={invitation.facebookRecommendUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-[#0057B8] text-[#0057B8]">
                      <Icon name="ThumbsUp" className="h-4 w-4 mr-1" /> Facebook
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} ALO Education. Your privacy is protected.
        </p>
      </div>
    </div>
  );
}
export default PublicReviewSubmit;
