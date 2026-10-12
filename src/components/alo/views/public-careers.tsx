"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

interface Props { onNavigate: (v: ViewKey, slug?: string) => void; }

export function PublicCareers({ onNavigate }: Props) {
  const positions = [
    { title: "Senior Counselor", department: "Counseling", location: "Dhaka", type: "Full-time", experience: "3+ years" },
    { title: "Application Officer", department: "Applications", location: "Dhaka", type: "Full-time", experience: "2+ years" },
    { title: "Visa Officer", department: "Visa", location: "Dhaka", type: "Full-time", experience: "2+ years" },
    { title: "Marketing Executive", department: "Marketing", location: "Dhaka", type: "Full-time", experience: "1+ years" },
  ];
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Careers at ALO Education" subtitle="Join our mission to help Bangladeshi students study abroad" icon="Briefcase" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 rounded-2xl border border-[#DCE8F5] bg-gradient-to-br from-[#EAF3FF] to-white">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#2563EB] text-white"><Icon name="Briefcase" className="size-8" /></div>
            <h3 className="mt-4 text-lg font-bold text-[#0B2447]">Why Join ALO?</h3>
            <p className="mt-2 text-sm text-[#5A7299]">Be part of a fast-growing education consultancy that's transforming how Bangladeshi students study abroad.</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-[#0B2447]">Open Positions</h3>
            {positions.length === 0 ? <div className="mt-4"><EmptyState icon="Briefcase" title="No open positions" description="Check back later for opportunities." /></div> :
            <div className="mt-4 space-y-3">{positions.map((pos) => (
              <div key={pos.title} className="flex items-center justify-between rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2563EB]"><Icon name="UserCog" className="size-5" /></div>
                  <div>
                    <p className="font-semibold text-[#0B2447]">{pos.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">{pos.department}</Badge>
                      <Badge variant="outline">{pos.location}</Badge>
                      <Badge variant="outline">{pos.type}</Badge>
                    </div>
                  </div>
                </div>
                <Button onClick={() => onNavigate("public-contact")} size="sm" variant="outline">Apply Now</Button>
              </div>
            ))}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default PublicCareers;
