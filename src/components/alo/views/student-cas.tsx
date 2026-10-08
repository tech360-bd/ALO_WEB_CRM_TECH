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
      <Card className="rounded-2xl border border-[#DCE8F5] bg-white"><CardContent className="p-6">
        <div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2563EB]"><Icon name="FileCheck" className="size-7" /></div>
        <div><h3 className="text-xl font-bold text-[#0B2447]">CAS Status: Pending</h3><p className="text-sm text-[#5A7299]">CAS will be issued after deposit payment and conditions are met.</p></div></div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4"><p className="text-xs font-bold uppercase text-[#5A7299]">Offer Status</p><p className="mt-1 font-semibold text-[#0B2447]">Conditional</p></div>
          <div className="rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4"><p className="text-xs font-bold uppercase text-[#5A7299]">Deposit Status</p><p className="mt-1 font-semibold text-[#0B2447]">Not Paid</p></div>
          <div className="rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4"><p className="text-xs font-bold uppercase text-[#5A7299]">Conditions</p><p className="mt-1 font-semibold text-[#0B2447]">2 remaining</p></div>
        </div>
        <div className="mt-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><Icon name="AlertTriangle" className="mt-0.5 size-5 text-amber-600" /><div><p className="font-semibold text-amber-900">Next Steps for CAS</p><p className="text-sm text-amber-800 mt-1">1. Pay deposit<br/>2. Complete CAS questionnaire<br/>3. Prepare for credibility interview</p></div></div></div>
        <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#0052a3]" onClick={() => toast({ title: "Coming soon", description: "CAS questionnaire available after deposit." })}>Start CAS Questionnaire</Button>
      </CardContent></Card>
    </div>
  );
}
export default StudentCas;
