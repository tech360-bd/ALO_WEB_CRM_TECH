"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { useToast } from "@/hooks/use-toast";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicEventsProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface EventItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  content: string;
  coverImage?: string | null;
  eventType: string;
  category: string;
  eventDate: string;
  eventEndDate?: string | null;
  location: string;
  city?: string | null;
  country?: string | null;
  capacity?: number | null;
  registeredCount: number;
  isFree: boolean;
  price?: string | null;
  isFeatured: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEBINAR: "Webinar",
  WORKSHOP: "Workshop",
  INFO_SESSION: "Info Session",
  EXPO: "Expo",
  MEETUP: "Meetup",
  ONLINE: "Online",
  IN_PERSON: "In-Person",
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  WEBINAR: "Video",
  WORKSHOP: "Wrench",
  INFO_SESSION: "Info",
  EXPO: "Building",
  MEETUP: "Users",
  ONLINE: "Wifi",
  IN_PERSON: "MapPin",
};

export function PublicEvents({ slug, onNavigate }: PublicEventsProps) {
  if (slug) return <EventDetail slug={slug} onNavigate={onNavigate} />;
  return <EventList onNavigate={onNavigate} />;
}

// ──────────────────────────────────────────────────────────────────────────────

function EventList({ onNavigate }: { onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"upcoming" | "all">("upcoming");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const url = filter === "upcoming" ? "/api/events?upcoming=true" : "/api/events";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (cancelled) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn't load events",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filter, toast]);

  const featured = events.filter((e) => e.isFeatured);
  const regular = events.filter((e) => !e.isFeatured);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0057B8]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Events" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#E8501A] border border-[#E8501A]/20 hover:bg-[#FFF3EA]">
              <Icon name="Calendar" className="mr-1 size-3" />
              Free to Attend
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Events &amp; <span className="text-[#0057B8]">Webinars</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Join our free webinars, workshops, info sessions, and in-person events. Learn about study destinations,
              English tests, visa requirements, scholarship applications, and meet your future counselors.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
        {/* Filter */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              filter === "upcoming" ? "bg-[#0057B8] text-white" : "border border-[#0057B8]/20 bg-white text-[#0057B8] hover:bg-[#EAF3FF]"
            )}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              filter === "all" ? "bg-[#0057B8] text-white" : "border border-[#0057B8]/20 bg-white text-[#0057B8] hover:bg-[#EAF3FF]"
            )}
          >
            All Events
          </button>
        </div>

        {/* Featured */}
        {!loading && featured.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#E8501A]">⭐ Featured Events</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {featured.slice(0, 2).map((event) => (
                <Card
                  key={event.id}
                  className="alo-card-hover group cursor-pointer rounded-2xl border-2 border-[#E8501A]/25 bg-gradient-to-br from-[#FFF3EA]/30 to-white transition-all hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => onNavigate("public-events", event.slug)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-[#E8501A] text-white hover:bg-[#E8501A]">
                        <Icon name={EVENT_TYPE_ICONS[event.eventType] || "Calendar"} className="mr-1 size-3" />
                        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                      </Badge>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Free
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[#0B2447] group-hover:text-[#E8501A]">{event.title}</h3>
                    {event.subtitle && (
                      <p className="mt-1 text-sm text-[#5A7299]">{event.subtitle}</p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5A7299]">{event.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#5A7299]">
                      <span className="flex items-center gap-1.5">
                        <Icon name="Calendar" className="size-3.5 text-[#0057B8]" />
                        {fmtDate(event.eventDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="MapPin" className="size-3.5 text-[#0057B8]" />
                        {event.location}
                      </span>
                    </div>
                    {event.capacity && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#5A7299]">
                        <Icon name="Users" className="size-3.5" />
                        {event.registeredCount} / {event.capacity} registered
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All events */}
        <h2 className="mb-4 text-lg font-bold text-[#0B2447]">
          {filter === "upcoming" ? "Upcoming Events" : "All Events"}{" "}
          <span className="text-sm font-medium text-[#5A7299]">({regular.length})</span>
        </h2>

        {loading ? (
          <LoadingGrid count={6} />
        ) : regular.length === 0 ? (
          <EmptyState
            icon="Calendar"
            title="No events scheduled"
            description="We're planning our next events — check back soon or contact us if you have a topic request."
            action={
              <Button onClick={() => onNavigate("public-contact")} className="bg-[#0057B8] text-white hover:bg-[#0057B8]/90">
                <Icon name="Phone" className="size-4" /> Contact Us
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((event) => (
              <Card
                key={event.id}
                className="alo-card-hover group flex cursor-pointer flex-col rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => onNavigate("public-events", event.slug)}
              >
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-3 aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
                    <div className="flex h-full items-center justify-center">
                      <Icon name={EVENT_TYPE_ICONS[event.eventType] || "Calendar"} className="size-10 text-[#0057B8]/30" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-[#EAF3FF] text-[#0057B8]">
                      {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                    </Badge>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {event.isFree ? "Free" : event.price}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-base font-bold text-[#0B2447] group-hover:text-[#0057B8]">{event.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#5A7299]">{event.description}</p>
                  <div className="mt-auto flex flex-col gap-2 pt-4 text-xs text-[#5A7299]">
                    <span className="flex items-center gap-1.5">
                      <Icon name="Calendar" className="size-3.5 text-[#0057B8]" />
                      {fmtDate(event.eventDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="MapPin" className="size-3.5 text-[#0057B8]" />
                      {event.location}
                    </span>
                    {event.capacity && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="Users" className="size-3.5 text-[#0057B8]" />
                        {event.registeredCount} / {event.capacity} registered
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14">
          <PublicLeadForm
            sourceTag="Events page — bottom CTA"
            title="Want to host an event with ALO?"
            subtitle="We partner with universities and brands for joint webinars and events. Tell us about your idea."
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface ContentBlock {
  type: "p" | "h2" | "h3" | "quote" | "list";
  text?: string;
  items?: string[];
}

function EventDetail({ slug, onNavigate }: { slug: string; onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [registering, setRegistering] = React.useState(false);
  const [registered, setRegistered] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/events?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Event not found");
          throw new Error("HTTP " + res.status);
        }
        const data = await res.json();
        if (cancelled) return;
        setEvent(data.event);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load event");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  async function register() {
    if (!event) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: event.slug }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Registration failed", description: data.error, variant: "destructive" });
      } else {
        setRegistered(true);
        toast({
          title: "Registration confirmed!",
          description: data.message || "ALO will send your join link shortly.",
        });
      }
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
          <LoadingGrid count={4} />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Events", onClick: () => onNavigate("public-events") },
              { label: "Not found" },
            ]}
          />
          <EmptyState
            icon="CalendarX"
            title="Event not found"
            description={error || "We couldn't find that event."}
            action={
              <Button onClick={() => onNavigate("public-events")} className="bg-[#0057B8] text-white hover:bg-[#0057B8]/90">
                <Icon name="ArrowLeft" className="size-4" /> Back to Events
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const blocks: ContentBlock[] = (() => {
    try { return JSON.parse(event.content) as ContentBlock[]; } catch { return []; }
  })();

  const isPast = new Date(event.eventDate).getTime() < Date.now();

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0057B8]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Events", onClick: () => onNavigate("public-events") },
              { label: event.title },
            ]}
          />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#E8501A] text-white hover:bg-[#E8501A]">
                  <Icon name={EVENT_TYPE_ICONS[event.eventType] || "Calendar"} className="mr-1 size-3" />
                  {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                </Badge>
                {event.country && (
                  <Badge variant="outline" className="bg-white text-[#0B2447]">{event.country}</Badge>
                )}
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {event.isFree ? "Free to attend" : event.price}
                </span>
                {isPast && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">Completed</Badge>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#0B2447] sm:text-4xl">
                {event.title}
              </h1>
              {event.subtitle && (
                <p className="mt-3 text-base leading-relaxed text-[#5A7299] sm:text-lg">{event.subtitle}</p>
              )}
              <p className="mt-4 text-base leading-relaxed text-[#5A7299]">{event.description}</p>
            </div>
            {/* Register card */}
            <Card className="rounded-2xl border-2 border-[#0057B8]/15 bg-white alo-shadow">
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">Event details</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Icon name="Calendar" className="mt-0.5 size-4 text-[#0057B8]" />
                    <div>
                      <p className="font-semibold text-[#0B2447]">{fmtDate(event.eventDate)}</p>
                      <p className="text-xs text-[#5A7299]">{new Date(event.eventDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} (BST)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Icon name="MapPin" className="mt-0.5 size-4 text-[#0057B8]" />
                    <p className="font-medium text-[#0B2447]">{event.location}</p>
                  </div>
                  {event.capacity && (
                    <div className="flex items-start gap-2.5">
                      <Icon name="Users" className="mt-0.5 size-4 text-[#0057B8]" />
                      <p className="font-medium text-[#0B2447]">{event.registeredCount} / {event.capacity} registered</p>
                    </div>
                  )}
                </div>
                {!isPast && !registered && (
                  <Button onClick={register} disabled={registering} className="mt-5 h-12 w-full bg-[#E8501A] text-white hover:bg-[#c8451a]">
                    {registering ? (
                      <><Icon name="Loader2" className="size-4 animate-spin" /> Registering...</>
                    ) : (
                      <><Icon name="Ticket" className="size-4" /> Register Now</>
                    )}
                  </Button>
                )}
                {registered && (
                  <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center">
                    <Icon name="Check" className="mx-auto size-6 text-emerald-600" />
                    <p className="mt-2 text-sm font-bold text-emerald-900">Registration confirmed!</p>
                    <p className="mt-1 text-xs text-emerald-800">ALO will send your join link via WhatsApp/email shortly.</p>
                  </div>
                )}
                {isPast && (
                  <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-center">
                    <p className="text-sm font-bold text-slate-700">This event has ended</p>
                    <p className="mt-1 text-xs text-slate-600">Browse other upcoming events.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
        {blocks.length > 0 && (
          <div className="space-y-6">
            {blocks.map((block, idx) => {
              if (block.type === "h2") return <h2 key={idx} className="mt-8 text-2xl font-black text-[#0B2447]">{block.text}</h2>;
              if (block.type === "h3") return <h3 key={idx} className="mt-6 text-xl font-bold text-[#0B2447]">{block.text}</h3>;
              if (block.type === "quote") return (
                <blockquote key={idx} className="border-l-4 border-[#E8501A] bg-[#FFF3EA]/50 px-5 py-4 text-base italic text-[#0B2447]">
                  {block.text}
                </blockquote>
              );
              if (block.type === "list" && Array.isArray(block.items)) {
                return (
                  <ul key={idx} className="space-y-2">
                    {block.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-[#0B2447]">
                        <Icon name="ChevronRight" className="mt-1 size-4 shrink-0 text-[#0057B8]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return <p key={idx} className="text-[15px] leading-relaxed text-[#5A7299]">{block.text}</p>;
            })}
          </div>
        )}

        <div className="mt-10">
          <Disclaimer text="Event dates, speakers, and content may change. ALO will notify registered participants of any changes via WhatsApp and email." />
        </div>
      </div>
    </div>
  );
}
export default PublicEvents;
