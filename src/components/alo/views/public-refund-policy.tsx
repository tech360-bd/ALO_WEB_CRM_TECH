"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, PageHeader } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

interface Props { onNavigate: (v: ViewKey, slug?: string) => void; }

export function PublicRefundPolicy({ onNavigate }: Props) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Refund Policy" subtitle="ALO Education's refund and cancellation policy" icon="DollarSign" />
      <div className="mx-auto max-w-[800px]">
        <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-8 space-y-6">
            <section><h2 className="text-xl font-bold text-[#0B2447]">1. Service Fees</h2><p className="mt-2 text-[#5A7299]">ALO Education charges service fees for premium services such as application assistance, visa guidance, and document checking. The first counseling session is free of charge.</p></section>
            <section><h2 className="text-xl font-bold text-[#0B2447]">2. Refund Eligibility</h2><p className="mt-2 text-[#5A7299]">Refunds may be issued under the following circumstances:</p><ul className="mt-2 ml-4 list-disc space-y-1 text-[#5A7299]"><li>Service not delivered as promised</li><li>Duplicate payment</li><li>Cancellation within 7 days of payment and before any service has been rendered</li><li>Visa refusal due to ALO's documented error</li></ul></section>
            <section><h2 className="text-xl font-bold text-[#0B2447]">3. Non-Refundable Items</h2><p className="mt-2 text-[#5A7299]">The following are non-refundable:</p><ul className="mt-2 ml-4 list-disc space-y-1 text-[#5A7299]"><li>University application fees (paid directly to universities)</li><li>Visa application fees (paid to embassies)</li><li>English test fees (paid to test providers)</li><li>Services already rendered (document review, SOP drafting, etc.)</li><li>Courier and translation charges</li></ul></section>
            <section><h2 className="text-xl font-bold text-[#0B2447]">4. Refund Process</h2><p className="mt-2 text-[#5A7299]">To request a refund, contact us at info@aloeducation.com with your payment receipt and reason for refund. Refund requests are processed within 14 business days.</p></section>
            <section><h2 className="text-xl font-bold text-[#0B2447]">5. University Tuition Deposits</h2><p className="mt-2 text-[#5A7299]">University tuition deposits are governed by each university's refund policy, not ALO Education. We facilitate the process but do not control university refund decisions.</p></section>
            <div className="rounded-xl bg-[#EAF3FF] p-4"><p className="text-sm text-[#0066CC]"><Icon name="Info" className="mr-1 inline size-4" />Questions about refunds? <button onClick={() => onNavigate("public-contact")} className="font-semibold underline">Contact us</button></p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default PublicRefundPolicy;
