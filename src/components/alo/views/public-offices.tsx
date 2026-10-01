"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

interface Props { onNavigate: (v: ViewKey, slug?: string) => void; }

export function PublicOffices({ onNavigate }: Props) {
  const offices = [
    { city: "Dhaka", address: "House 12, Road 5, Dhanmondi, Dhaka 1205", phone: "01805020101", hours: "Sat-Thu: 9:00 AM - 6:00 PM", isMain: true },
    { city: "Chattogram", address: "Agrabad Commercial Area, Chattogram", phone: "01805020102", hours: "Sat-Thu: 9:00 AM - 6:00 PM" },
  ];
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Our Offices" subtitle="Visit us at our offices across Bangladesh" icon="MapPin" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => (
          <Card key={office.city} className="rounded-2xl border border-[#DCE8F5] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0B5ED7]">
                  <Icon name="MapPin" className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B2447]">{office.city}</h3>
                  {office.isMain && <Badge className="mt-1 bg-[#EAF3FF] text-[#0B5ED7]">Main Office</Badge>}
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-[#5A7299]">{office.address}</p>
                <p className="text-[#0B2447] font-medium"><Icon name="Phone" className="mr-1 inline size-3.5" />{office.phone}</p>
                <p className="text-[#5A7299]"><Icon name="Clock" className="mr-1 inline size-3.5" />{office.hours}</p>
              </div>
              <Button onClick={() => onNavigate("public-contact")} className="mt-4 w-full" variant="outline">Contact Office</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
export default PublicOffices;
