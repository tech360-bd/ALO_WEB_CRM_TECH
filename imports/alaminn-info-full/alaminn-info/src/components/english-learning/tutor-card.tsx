/**
 * TutorCard — server component rendering an English Learning tutor.
 */
import Link from "next/link";
import {
  Star,
  Clock,
  DollarSign,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Tutor } from "@/lib/english-learning/types";

interface TutorCardProps {
  tutor: Tutor;
  className?: string;
  showActions?: boolean;
}

function formatHourlyRate(
  rate: number | null | undefined,
  currency: string,
): string | null {
  if (rate == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(rate);
  } catch {
    return `${currency} ${rate}`;
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function TutorCard({
  tutor,
  className,
  showActions = true,
}: TutorCardProps) {
  const detailHref = `/english-learning/tutors/${tutor.slug}`;
  const rate = formatHourlyRate(tutor.hourlyRateUsd, tutor.currency);
  const specialties = Array.isArray(tutor.specialties)
    ? (tutor.specialties as string[]).slice(0, 3)
    : [];

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 focus-within:border-blue-300 focus-within:shadow-lg",
        className,
      )}
    >
      {/* Soft hover glow blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/0 blur-2xl transition-all duration-500 group-hover:bg-emerald-200/40"
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        <Avatar className="h-12 w-12 border border-ink-200 transition-transform duration-300 group-hover:scale-105">
          {tutor.avatarUrl ? (
            <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
          ) : null}
          <AvatarFallback className="bg-blue-50 font-bold text-blue-700">
            {initials(tutor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-snug text-ink-900 transition-colors group-hover:text-blue-700">
            <Link href={detailHref} className="hover-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:rounded">
              {tutor.name}
            </Link>
          </h3>
          {tutor.yearsExperience != null && (
            <p className="mt-0.5 text-xs text-ink-600">
              {tutor.yearsExperience}+ years teaching
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-semibold text-ink-900 tabular-nums">
              {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
            </span>
            {tutor.reviewCount > 0 && (
              <span className="text-ink-500 tabular-nums">({tutor.reviewCount})</span>
            )}
          </div>
        </div>
        {tutor.isAvailable ? (
          <Badge
            variant="outline"
            className="shrink-0 border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-100"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
            Available
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="shrink-0 border-ink-200 bg-ink-50 text-[10px] font-bold uppercase tracking-wider text-ink-500"
          >
            Booked
          </Badge>
        )}
      </div>

      {tutor.bio && (
        <p className="relative line-clamp-2 text-xs text-ink-600">{tutor.bio}</p>
      )}

      {specialties.length > 0 && (
        <div className="relative flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700 transition-colors group-hover:border-blue-300"
            >
              <Award className="mr-1 h-3 w-3" aria-hidden="true" />
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="relative grid grid-cols-2 gap-2 text-xs">
        {rate && (
          <MetaCell icon={<DollarSign className="h-3 w-3" />} label="Rate">
            <span className="font-semibold text-emerald-700">{rate}/hr</span>
          </MetaCell>
        )}
        {tutor.yearsExperience != null && (
          <MetaCell icon={<Clock className="h-3 w-3" />} label="Experience">
            {tutor.yearsExperience}y
          </MetaCell>
        )}
      </div>

      {showActions && (
        <div className="relative mt-1 grid grid-cols-2 gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 rounded-xl border-blue-200 text-blue-700 transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            <Link href={detailHref}>
              Profile
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange transition-all duration-300 hover:bg-orange-700 hover:shadow-md hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            <Link href={`/english-learning/book-tutor?tutor=${tutor.slug}`}>
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Book
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
}

function MetaCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-2.5 py-1.5 transition-colors duration-300 group-hover:border-blue-100 group-hover:bg-blue-50/40">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <span className="text-ink-400" aria-hidden="true">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-0.5 text-xs text-ink-800">{children}</div>
    </div>
  );
}
