"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

type Offer = {
  id: string;
  university?: string;
  course?: string;
  country?: string;
  studyLevel?: string;
  intake?: string;
  stage?: string;
  deadline?: string;
  notes?: string;
};

const OFFER_STAGES = ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"];

export function StudentOffers() {
  const { toast } = useToast();
  const { studentId } = useStudentId();
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/applications?studentId=${studentId || ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const all: Offer[] = d.applications || [];
        setOffers(all.filter((a) => OFFER_STAGES.includes(a.stage || "")));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const respondToOffer = async (id: string, action: "ACCEPTED" | "DECLINED") => {
    if (!studentId) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          stage: action === "ACCEPTED" ? "DEPOSIT_PENDING" : "VISA_REFUSED",
          userId: studentId || "",
        }),
      });
      if (res.ok) {
        toast({
          title: action === "ACCEPTED" ? "Offer accepted" : "Offer declined",
          description:
            action === "ACCEPTED"
              ? "You will receive deposit instructions shortly."
              : "Your counselor has been notified.",
        });
        setOffers((prev) =>
          prev.map((o) =>
            o.id === id
              ? { ...o, stage: action === "ACCEPTED" ? "DEPOSIT_PENDING" : "VISA_REFUSED" }
              : o
          )
        );
      }
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="University Offers"
          subtitle="Review conditional and unconditional offers, deadlines, and conditions"
          icon="Award"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your university offers."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="University Offers"
        subtitle="Review conditional and unconditional offers, deadlines, and conditions"
        icon="Award"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon="Award"
          title="No offers yet"
          description="When universities send you an offer, it will appear here for you to review and respond."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {offers.map((o) => {
            const isConditional = o.stage === "CONDITIONAL_OFFFER";
            const deadline = o.deadline ? new Date(o.deadline) : null;
            const daysLeft = deadline
              ? Math.ceil((deadline.getTime() - Date.now()) / 86400000)
              : null;
            return (
              <Card key={o.id} className="rounded-2xl border border-[#DCE8F5] bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-12 items-center justify-center rounded-xl",
                          isConditional
                            ? "bg-[#FFF3EA] text-[#F97316]"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <Icon name="Award" className="size-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0B2447]">{o.university}</h3>
                        <p className="text-sm text-[#5A7299]">{o.course}</p>
                        <p className="mt-0.5 text-xs text-[#5A7299]">
                          {o.country} • {o.studyLevel} • Intake: {o.intake}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        isConditional
                          ? "bg-[#FFF3EA] text-[#F97316]"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {isConditional ? "Conditional" : "Unconditional"}
                    </Badge>
                  </div>

                  {deadline && (
                    <div
                      className={cn(
                        "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                        daysLeft !== null && daysLeft < 7
                          ? "bg-rose-50 text-rose-700"
                          : "bg-[#EAF3FF] text-[#2563EB]"
                      )}
                    >
                      <Icon name="CalendarClock" className="size-4" />
                      <span>
                        {daysLeft !== null && daysLeft >= 0
                          ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to respond`
                          : "Deadline passed"}
                      </span>
                      <span className="ml-auto text-xs opacity-70">
                        {deadline.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {isConditional && (
                    <div className="mt-4 rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5A7299]">
                        Conditions
                      </p>
                      <p className="mt-1 text-sm text-[#0B2447]">
                        {o.notes || "Submit final transcripts and meet IELTS requirement."}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => respondToOffer(o.id, "ACCEPTED")}
                      className="bg-[#2563EB] text-white hover:bg-[#0052a3]"
                      size="sm"
                    >
                      <Icon name="Check" className="mr-1 size-4" /> Accept
                    </Button>
                    <Button
                      onClick={() => respondToOffer(o.id, "DECLINED")}
                      variant="outline"
                      className="border-[#F97316] text-[#F97316] hover:bg-[#FFF3EA]"
                      size="sm"
                    >
                      <Icon name="X" className="mr-1 size-4" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentOffers;
