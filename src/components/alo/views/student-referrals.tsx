"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

type Referral = {
  id: string;
  referralCode?: string;
  referredName?: string;
  referredPhone?: string;
  referredEmail?: string;
  status?: string;
  createdAt?: string;
};

export function StudentReferrals() {
  const { toast } = useToast();
  const { studentId } = useStudentId();

  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/student/referrals?studentId=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setReferrals(d.referrals || []);
        setCode(d.referralCode || "");
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

  const handleRefer = async () => {
    if (!studentId) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    if (!name && !phone) {
      toast({ title: "Name or phone required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerStudentId: studentId || "",
          referredName: name,
          referredPhone: phone,
          referredEmail: email,
          source: "DIRECT",
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setReferrals([d.referral, ...referrals]);
        setName("");
        setPhone("");
        setEmail("");
        toast({ title: "Referral sent!" });
      } else {
        toast({ title: "Failed to send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast({ title: "Referral code copied!" });
  };

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader title="Refer a Friend" subtitle="Share ALO Education and earn rewards" icon="Gift" />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to access your referral code and start referring friends."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Refer a Friend"
        subtitle="Share ALO Education and earn rewards"
        icon="Gift"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-[#DCE8F5] bg-gradient-to-br from-[#EAF3FF] to-white">
          <CardContent className="p-4 text-center sm:p-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#2563EB] text-white">
              <Icon name="Gift" className="size-8" />
            </div>
            <p className="mt-4 text-sm font-bold uppercase text-[#5A7299]">
              Your Referral Code
            </p>
            <p className="mt-2 break-all text-2xl font-black text-[#2563EB]">
              {code || "AEFR-XXXXXX"}
            </p>
            <Button
              onClick={copyCode}
              variant="outline"
              className="mt-4 w-full border-[#2563EB] text-[#2563EB]"
            >
              <Icon name="Copy" className="mr-1.5 size-4" />
              Copy Code
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-[#0B2447]">Refer a Friend</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Friend&apos;s Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label>Friend&apos;s Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  placeholder="+8801805020100"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Friend&apos;s Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="friend@example.com"
                />
              </div>
            </div>
            <Button
              onClick={handleRefer}
              disabled={submitting}
              className="mt-4 bg-[#F97316] text-white hover:bg-[#D8590E]"
            >
              <Icon name="Send" className="mr-1.5 size-4" />
              Send Referral
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-bold text-[#0B2447]">My Referrals</h3>
          {loading ? (
            <p className="mt-4 text-[#5A7299]">Loading...</p>
          ) : referrals.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="Users" title="No referrals yet" description="Share your code to start earning rewards." />
            </div>
          ) : (
            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B2447]">
                      {r.referredName || "Unknown"}
                    </p>
                    <p className="text-xs text-[#5A7299]">
                      {r.referralCode}
                      {r.referredEmail ? ` · ${r.referredEmail}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className={cn("capitalize w-fit")}>
                    {(r.status || "pending").toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentReferrals;
