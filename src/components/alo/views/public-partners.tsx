"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

interface Props { onNavigate: (v: ViewKey, slug?: string) => void; }

export function PublicPartners({ onNavigate }: Props) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Become a Partner" subtitle="Join ALO Education's partner network and grow your education consultancy business" icon="Handshake" />
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border border-[#DCE8F5] bg-white shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-[#0B2447]">Partner Portal Benefits</h2>
            <p className="mt-2 text-[#5A7299]">ALO Education partners get access to powerful tools and resources to help their students succeed.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { icon: "Users", title: "Student Management", desc: "Submit and track students through the entire application journey" },
                { icon: "Search", title: "Course Search", desc: "Access 794+ courses across 239 universities in 13 countries" },
                { icon: "DollarSign", title: "Commission Tracking", desc: "Transparent commission tracking and payment management" },
                { icon: "FileText", title: "Document Management", desc: "Upload and manage student documents securely" },
                { icon: "BarChart3", title: "Analytics Dashboard", desc: "Track your performance with real-time analytics" },
                { icon: "Bell", title: "Notifications", desc: "Stay updated on application status changes and deadlines" },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 rounded-xl border border-[#DCE8F5] bg-[#F7FAFE] p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2563EB]">
                    <Icon name={feature.icon} className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0B2447]">{feature.title}</h3>
                    <p className="text-sm text-[#5A7299]">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => onNavigate("auth-login")} className="bg-[#F97316] text-white hover:bg-[#D8590E]">Partner Login</Button>
              <Button onClick={() => onNavigate("public-contact")} variant="outline">Become a Partner</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default PublicPartners;
