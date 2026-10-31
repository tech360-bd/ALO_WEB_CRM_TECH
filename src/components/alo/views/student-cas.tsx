"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, PageHeader } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

export function StudentCas() {
  const { toast } = useToast();
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="CAS Center" subtitle="Confirmation of Acceptance for Studies" icon="FileCheck" />
      <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white"><CardContent className="p-6">
        <div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"><Icon name="FileCheck" className="size-7" /></div>
        <div><h3 className="text-xl font-bold text-[var(--alo-text)]">CAS Status: Pending</h3><p className="text-sm text-[var(--alo-text-muted)]">CAS will be issued after deposit payment and conditions are met.</p></div></div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)] p-4"><p className="text-xs font-bold uppercase text-[var(--alo-text-muted)]">Offer Status</p><p className="mt-1 font-semibold text-[var(--alo-text)]">Conditional</p></div>
          <div className="rounded-xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)] p-4"><p className="text-xs font-bold uppercase text-[var(--alo-text-muted)]">Deposit Status</p><p className="mt-1 font-semibold text-[var(--alo-text)]">Not Paid</p></div>
          <div className="rounded-xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)] p-4"><p className="text-xs font-bold uppercase text-[var(--alo-text-muted)]">Conditions</p><p className="mt-1 font-semibold text-[var(--alo-text)]">2 remaining</p></div>
        </div>
        <div className="mt-6 rounded-xl border-2 border-crm-warning-border bg-crm-warning-bg p-4"><div className="flex items-start gap-3"><Icon name="AlertTriangle" className="mt-0.5 size-5 text-crm-warning-text" /><div><p className="font-semibold text-crm-warning-text">Next Steps for CAS</p><p className="text-sm text-crm-warning-text mt-1">1. Pay deposit<br/>2. Complete CAS questionnaire<br/>3. Prepare for credibility interview</p></div></div></div>
        <Button className="mt-4 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]" onClick={() => toast({ title: "Coming soon", description: "CAS questionnaire available after deposit." })}>Start CAS Questionnaire</Button>
      </CardContent></Card>
    </div>
  );
}
export default StudentCas;
