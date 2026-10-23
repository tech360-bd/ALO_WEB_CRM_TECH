"use client";

import * as React from "react";
import { Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader, MiniBar } from "@/components/alo/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { timeAgo } from "@/lib/alo-types";

const MODERATION_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  NEEDS_REVIEW: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
};

const PUBLICATION_COLORS: Record<string, string> = {
  INTERNAL: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  UNPUBLISHED: "bg-rose-100 text-rose-700",
};

export function ReviewDashboard({ onNavigate }: { onNavigate: (v: any, slug?: string) => void }) {
  const { toast } = useToast();
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);
  const [actionNotes, setActionNotes] = React.useState("");
  const [acting, setActing] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteForm, setInviteForm] = React.useState({ studentName: "", country: "", serviceType: "", googleReviewUrl: "", facebookRecommendUrl: "" });

  const fetchDashboard = React.useCallback(async () => {
    try {
      const res = await fetch("/api/reviews/dashboard");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const performAction = async (reviewId: string, action: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: actionNotes, performedBy: "marketing@aloedu.com" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      toast({ title: `Review ${action.toLowerCase()}d`, description: json.message });
      setSelectedReview(null);
      setActionNotes("");
      fetchDashboard();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const createInvitation = async () => {
    if (!inviteForm.studentName) {
      toast({ title: "Student name required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/reviews/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inviteForm, createdBy: "marketing@aloedu.com" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Invitation created", description: `Share: ${json.reviewUrl}` });
      setInviteOpen(false);
      setInviteForm({ studentName: "", country: "", serviceType: "", googleReviewUrl: "", facebookRecommendUrl: "" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  if (loading || !data) return <LoadingGrid count={6} />;
  const s = data.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Review Center"
        subtitle="Collect, moderate, and publish student reviews. Multi-channel invitations (Website + Google + Facebook). Never fabricated — students submit their own reviews."
        icon="Star"
        action={
          <Button onClick={() => setInviteOpen(true)} className="h-10 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90">
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Send Review Invitation
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Total Reviews" value={s.totalReviews} icon="Star" accent="blue" />
        <StatCard label="Avg Rating" value={s.avgRating || "—"} icon="Star" accent="orange" hint="out of 5" />
        <StatCard label="Pending" value={s.pending} icon="Clock" accent="amber" />
        <StatCard label="Published" value={s.published} icon="CheckCircle" accent="emerald" />
        <StatCard label="Needs Review" value={s.needsReview} icon="AlertTriangle" accent="rose" />
        <StatCard label="Response Rate" value={`${s.responseRate}%`} icon="TrendingUp" accent="violet" hint={`${s.submittedInvitations}/${s.totalInvitations} invitations`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <SectionCard title="Rating Distribution" icon="BarChart3">
          <div className="space-y-2">
            {data.ratingDistribution.length > 0 ? (
              data.ratingDistribution.map((r: any) => (
                <div key={r.rating} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 w-16">
                    <span className="font-semibold text-[var(--alo-body)]">{r.rating}</span>
                    <Icon name="Star" className="h-3 w-3 fill-[var(--alo-cta)] text-[var(--alo-cta)]" />
                  </div>
                  <div className="flex-1"><MiniBar value={r.count} max={Math.max(...data.ratingDistribution.map((x: any) => x.count), 1)} color="#E8501A" /></div>
                  <div className="w-8 text-right text-xs text-[var(--alo-body)]">{r.count}</div>
                </div>
              ))
            ) : (
              <EmptyState icon="Star" title="No reviews yet" />
            )}
          </div>
        </SectionCard>

        {/* Channel Tracking */}
        <SectionCard title="Multi-Channel Tracking" icon="Share2">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--alo-body)]">Website Reviews</span>
              <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">{s.published}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--alo-body)]">Google Clicks</span>
              <Badge className="bg-emerald-50 text-emerald-700">{s.googleClicks}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--alo-body)]">Facebook Clicks</span>
              <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">{s.facebookClicks}</Badge>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-700 mt-2">
              <Icon name="Info" className="h-3 w-3 inline mr-1" />
              Students submit reviews themselves on each platform. We never post on their behalf.
            </div>
          </div>
        </SectionCard>

        {/* By Sentiment */}
        <SectionCard title="AI Sentiment Analysis" icon="Brain">
          <div className="space-y-2">
            {data.bySentiment.length > 0 ? (
              data.bySentiment.map((snt: any) => (
                <div key={snt.sentiment} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--alo-body)] capitalize">{snt.sentiment.toLowerCase()}</span>
                  <Badge className={snt.sentiment === "POSITIVE" ? "bg-emerald-100 text-emerald-700" : snt.sentiment === "NEGATIVE" ? "bg-rose-100 text-rose-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}>{snt.count}</Badge>
                </div>
              ))
            ) : (
              <EmptyState icon="Brain" title="No sentiment data" />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Review Queue */}
      <SectionCard title="Recent Reviews — Moderation Queue" icon="MessageSquare">
        {data.recentReviews.length === 0 ? (
          <EmptyState icon="MessageSquare" title="No reviews yet" description="Send review invitations to your students to start collecting feedback." />
        ) : (
          <Card className="rounded-2xl border-2 border-[var(--alo-border)] overflow-hidden">
            <div className="max-h-[600px] overflow-auto alo-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs">Review</TableHead>
                    <TableHead className="text-xs">Consent</TableHead>
                    <TableHead className="text-xs">AI Flags</TableHead>
                    <TableHead className="text-xs">Moderation</TableHead>
                    <TableHead className="text-xs">Publication</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentReviews.map((r: any) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-[var(--alo-page)]" onClick={() => { setSelectedReview(r); setActionNotes(""); }}>
                      <TableCell className="align-top">
                        <div className="text-sm font-medium text-[var(--alo-text)]">{r.studentName}</div>
                        <div className="text-xs text-[var(--alo-text-muted)]">{r.country || "—"} · {r.serviceType || "—"}</div>
                        {r.isVerifiedStudent && <Badge className="mt-1 bg-emerald-50 text-emerald-700 text-xs">Verified</Badge>}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Icon key={s} name="Star" className={`h-3 w-3 ${r.rating >= s ? "fill-[var(--alo-cta)] text-[var(--alo-cta)]" : "text-slate-200"}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top max-w-xs">
                        <div className="text-xs text-[var(--alo-body)] line-clamp-3">{r.reviewText}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-0.5">
                          {r.consentPublish && <Badge className="bg-emerald-50 text-emerald-700 text-xs">Website</Badge>}
                          {r.consentMarketing && <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] text-xs">Marketing</Badge>}
                          {r.consentShowName && <Badge className="bg-violet-50 text-violet-700 text-xs">Name</Badge>}
                          {!r.consentPublish && !r.consentMarketing && <Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] text-xs">Internal only</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {r.aiSpamScore > 0.5 ? <Badge className="bg-rose-100 text-rose-700 text-xs">{(r.aiSpamScore * 100).toFixed(0)}%</Badge> : <span className="text-xs text-[var(--alo-text-muted)]">clean</span>}
                      </TableCell>
                      <TableCell className="align-top"><Badge className={MODERATION_COLORS[r.moderationStatus]}>{r.moderationStatus}</Badge></TableCell>
                      <TableCell className="align-top"><Badge className={PUBLICATION_COLORS[r.publicationStatus]}>{r.publicationStatus}</Badge></TableCell>
                      <TableCell className="align-top text-xs text-[var(--alo-text-muted)]">{timeAgo(r.createdAt)}</TableCell>
                      <TableCell className="align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => performAction(r.id, "PUBLISH")} disabled={acting || !r.consentPublish}>Publish</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => performAction(r.id, "REJECT")} disabled={acting}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </SectionCard>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(o) => !o && setSelectedReview(null)}>
        <DialogContent className="max-w-2xl">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon name="MessageSquare" className="h-5 w-5 text-[var(--alo-brand)]" />
                  Review by {selectedReview.studentName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((s) => (
                    <Icon key={s} name="Star" className={`h-5 w-5 ${selectedReview.rating >= s ? "fill-[var(--alo-cta)] text-[var(--alo-cta)]" : "text-slate-200"}`} />
                  ))}
                  <span className="text-sm text-[var(--alo-body)] ml-2">{selectedReview.rating}/5</span>
                </div>
                <div className="rounded-lg bg-[var(--alo-page)] p-4">
                  <div className="text-xs font-semibold text-[var(--alo-text-muted)] mb-1">Review Text</div>
                  <p className="text-sm text-[var(--alo-text)] whitespace-pre-wrap">{selectedReview.reviewText}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`rounded-lg p-2 text-center ${selectedReview.consentPublish ? "bg-emerald-50 text-emerald-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]"}`}>
                    <Icon name={selectedReview.consentPublish ? "Check" : "X"} className="h-4 w-4 mx-auto mb-1" />
                    Website
                  </div>
                  <div className={`rounded-lg p-2 text-center ${selectedReview.consentMarketing ? "bg-emerald-50 text-emerald-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]"}`}>
                    <Icon name={selectedReview.consentMarketing ? "Check" : "X"} className="h-4 w-4 mx-auto mb-1" />
                    Marketing
                  </div>
                  <div className={`rounded-lg p-2 text-center ${selectedReview.consentShowName ? "bg-emerald-50 text-emerald-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]"}`}>
                    <Icon name={selectedReview.consentShowName ? "Check" : "X"} className="h-4 w-4 mx-auto mb-1" />
                    Show Name
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[var(--alo-text-muted)]">Moderation Notes</Label>
                  <Textarea className="mt-1" rows={2} placeholder="Optional notes..." value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => performAction(selectedReview.id, "REJECT")} disabled={acting}>Reject</Button>
                <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => performAction(selectedReview.id, "APPROVE")} disabled={acting}>Approve (Internal)</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => performAction(selectedReview.id, "PUBLISH")} disabled={acting || !selectedReview.consentPublish}>
                  {selectedReview.consentPublish ? "Publish to Website" : "Cannot Publish (no consent)"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invitation Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Send" className="h-5 w-5 text-[var(--alo-cta)]" /> Send Review Invitation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Student Name *</Label>
              <Input className="h-10" value={inviteForm.studentName} onChange={(e) => setInviteForm({ ...inviteForm, studentName: e.target.value })} placeholder="e.g. Rahim Uddin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Country</Label>
                <Input className="h-10" value={inviteForm.country} onChange={(e) => setInviteForm({ ...inviteForm, country: e.target.value })} placeholder="uk" />
              </div>
              <div>
                <Label className="text-xs">Service Type</Label>
                <Select value={inviteForm.serviceType} onValueChange={(v) => setInviteForm({ ...inviteForm, serviceType: v })}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMISSIONS">Admissions</SelectItem>
                    <SelectItem value="VISA">Visa</SelectItem>
                    <SelectItem value="ENGLISH_TEST">English Test</SelectItem>
                    <SelectItem value="SOP">SOP/CV</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Google Review URL (optional — official Google Business Profile link)</Label>
              <Input className="h-10" value={inviteForm.googleReviewUrl} onChange={(e) => setInviteForm({ ...inviteForm, googleReviewUrl: e.target.value })} placeholder="https://g.page/r/XXXXX/review" />
            </div>
            <div>
              <Label className="text-xs">Facebook Recommendation URL (optional)</Label>
              <Input className="h-10" value={inviteForm.facebookRecommendUrl} onChange={(e) => setInviteForm({ ...inviteForm, facebookRecommendUrl: e.target.value })} placeholder="https://facebook.com/aloeducation/reviews" />
            </div>
            <div className="rounded-lg bg-[var(--alo-brand-pale)] p-2 text-xs text-[var(--alo-body)]">
              <Icon name="Info" className="h-3 w-3 inline mr-1 text-[var(--alo-brand)]" />
              The student will receive a unique link. They submit the review themselves — we never post on their behalf.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={createInvitation} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90">Create Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ReviewDashboard;
