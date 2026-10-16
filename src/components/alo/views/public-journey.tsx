"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicApplicationProcess } from "@/components/alo/views/public-application-process";
import { type ViewKey } from "@/lib/alo-types";

interface PublicJourneyProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

/**
 * public-journey is a friendlier hero variant of public-application-process.
 * Same 12-step timeline content; different hero framing focused on the
 * emotional "your journey" narrative used by marketing.
 */
export function PublicJourney({ onNavigate }: PublicJourneyProps) {
  return (
    <div className="bg-white">
      {/* CUSTOM HERO */}
      <section className="border-b border-[#0057B8]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Journey" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#E8501A] border border-[#E8501A]/20 hover:bg-[#FFF3EA]">
              <Icon name="Compass" className="mr-1 size-3" />
              Your Story Starts Here
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              From ambition to <span className="text-[#0057B8]">admission</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Every Bangladeshi student's study-abroad journey follows the same 12 steps — but yours is uniquely
              yours. ALO walks every step with you, from the first counseling session to your first day at
              university and beyond.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("public-contact")} className="h-12 bg-[#E8501A] px-6 text-white hover:bg-[#c8451a]">
                <Icon name="CalendarCheck" className="size-4" />
                Begin Your Journey
              </Button>
              <Button onClick={() => onNavigate("public-services")} variant="outline" className="h-12 border-[#0057B8]/30 bg-white px-6 text-[#0057B8] hover:bg-[#EAF3FF]">
                <Icon name="Briefcase" className="size-4" />
                Explore Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Render the full 12-step timeline */}
      <PublicApplicationProcess onNavigate={onNavigate} />
    </div>
  );
}
export default PublicJourney;
