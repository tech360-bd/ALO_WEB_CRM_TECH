"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";
import { ALO_CONTACT } from "@/lib/alo-site-info";

interface Props { onNavigate: (v: ViewKey, slug?: string) => void; }

export function PublicOffices({ onNavigate }: Props) {
  const hasOfficeDetails = Boolean(ALO_CONTACT.address.trim());

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader title="Our Offices" subtitle="Office details currently configured by ALO Education" icon="MapPin" />
      {!hasOfficeDetails ? (
        <EmptyState
          icon="MapPin"
          title="No public office details configured"
          description="Contact ALO Education for current location information."
          action={<Button onClick={() => onNavigate("public-contact")} variant="outline">Contact ALO Education</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                  <Icon name="MapPin" className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--alo-text)]">Dhaka</h3>
                  <Badge className="mt-1 bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">Office details from site configuration</Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-[var(--alo-text-muted)]">{ALO_CONTACT.address}</p>
                {ALO_CONTACT.hasContactPhone && (
                  <p className="font-medium text-[var(--alo-text)]"><Icon name="Phone" className="mr-1 inline size-3.5" />{ALO_CONTACT.mobileDisplay}</p>
                )}
                {ALO_CONTACT.officeHours && (
                  <p className="text-[var(--alo-text-muted)]"><Icon name="Clock" className="mr-1 inline size-3.5" />{ALO_CONTACT.officeHours}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => onNavigate("public-contact")} className="flex-1" variant="outline">Contact Office</Button>
                {ALO_CONTACT.mapsUrl && (
                  <Button asChild variant="outline" aria-label="Open office map">
                    <a href={ALO_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer"><Icon name="ExternalLink" className="size-4" /></a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
export default PublicOffices;
