"use client";

/**
 * ALO Card System — Unified Component Library (per master brief §7)
 * ============================================================
 * 13 card types sharing the same design language:
 *   01 BasicCard       — generic content card
 *   02 ImageCard       — image-led card
 *   03 UniversityCard  — university display
 *   04 CourseCard      — course display with match score
 *   05 ScholarshipCard — scholarship display
 *   06 CountryCard     — destination card
 *   07 LeadCard        — CRM lead card
 *   08 StudentCard     — student profile card
 *   09 EmployeeCard    — employee card
 *   10 ApplicationCard — application status card
 *   11 AIRecommendCard — AI recommendation panel
 *   12 AnalyticsCard   — metric/analytics card
 *   13 ActionCard      — action-oriented card
 *
 * All cards use the ALO micro-animation system (§8):
 *   Idle → Hover (translateY -4px, shadow, image scale 1.04, CTA reveal)
 *        → Focus (keyboard outline) → Press (scale 0.98) → Loading (shimmer)
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon, ACCENT_CLASSES, type AccentColor } from "./ui";

/* ═══ Shared card wrapper with micro-animation ═══ */
interface AloCardBaseProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  accent?: AccentColor | boolean;
}

function AloCardBase({ children, className, onClick, interactive = true, accent }: AloCardBaseProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]",
        interactive && "alo-card-anim cursor-pointer",
        accent && "alo-gradient-edge",
        className
      )}
    >
      {children}
    </Card>
  );
}

/* ═══ 01. BasicCard ═══ */
export function BasicCard({ title, description, icon, children, className, onClick }: {
  title?: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <AloCardBase onClick={onClick} className={className}>
      <CardContent className="p-5">
        {icon && (
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-blue-soft)] text-[var(--alo-blue)]">
            <Icon name={icon} className="size-5" />
          </div>
        )}
        {title && <h3 className="mt-3 text-base font-bold text-[var(--alo-text)]">{title}</h3>}
        {description && <p className="mt-1 text-sm text-[var(--alo-muted)]">{description}</p>}
        {children}
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 02. ImageCard ═══ */
export function ImageCard({ image, imageAlt, title, description, ctaLabel, onCta, onClick, className }: {
  image: string;
  imageAlt: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onClick} className={className}>
      {/* Master §09 image card: the photograph keeps its own contrast — the
          title sits underneath in the white information area, never on top of
          a dark scrim. */}
      <div className="relative h-48 overflow-hidden bg-[var(--alo-gray-light)]">
        <img src={image} alt={imageAlt} className="alo-card-img size-full object-cover" loading="lazy" />
      </div>
      <CardContent className="p-5">
        <h3 className="text-lg font-bold text-[var(--alo-text)]">{title}</h3>
        {description && <p className="mt-1 text-sm text-[var(--alo-text-secondary)]">{description}</p>}
        {ctaLabel && (
          <Button variant="alo" size="sm" className="alo-card-cta mt-3 w-full" onClick={onCta}>
            {ctaLabel}
            <Icon name="ArrowRight" className="size-3.5" />
          </Button>
        )}
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 03. UniversityCard (enhanced per §12) ═══ */
export function UniversityCard({ name, country, flag, city, logo, ranking, coursesCount, tuitionFrom, matchScore, onView, className }: {
  name: string;
  country: string;
  flag?: string;
  city?: string;
  logo?: string;
  ranking?: number | string;
  coursesCount?: number;
  tuitionFrom?: string;
  matchScore?: number;
  onView?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onView} accent className={className}>
      <div className="relative h-20 bg-alo-gradient overflow-hidden">
        <div className="absolute -bottom-4 left-4">
          {logo ? (
            <img src={logo} alt={name} className="size-10 rounded-lg border-2 border-white bg-white object-contain shadow-sm" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-lg border-2 border-white bg-[var(--alo-surface)] font-bold text-[var(--alo-blue)] shadow-sm">
              {name.charAt(0)}
            </div>
          )}
        </div>
        {matchScore !== undefined && (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[var(--alo-blue)]">
            {matchScore}% Match
          </div>
        )}
      </div>
      <CardContent className="pt-6">
        <h3 className="text-sm font-bold text-[var(--alo-text)]">{name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--alo-muted)]">
          {flag && <span>{flag}</span>}
          <Icon name="MapPin" className="size-3" />
          {city ? `${city}, ` : ""}{country}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {ranking && (
            <div><span className="text-[var(--alo-muted)]">Rank:</span> <span className="font-semibold text-[var(--alo-text)]">#{ranking}</span></div>
          )}
          {coursesCount !== undefined && (
            <div><span className="text-[var(--alo-muted)]">Courses:</span> <span className="font-semibold text-[var(--alo-text)]">{coursesCount}</span></div>
          )}
          {tuitionFrom && (
            <div className="col-span-2"><span className="text-[var(--alo-muted)]">From:</span> <span className="font-semibold text-[var(--alo-text)]">{tuitionFrom}</span></div>
          )}
        </div>
        <Button variant="outline" size="sm" className="alo-card-cta mt-3 w-full" onClick={onView}>
          View University
          <Icon name="ArrowRight" className="size-3.5" />
        </Button>
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 04. CourseCard (enhanced per §8) ═══ */
export function CourseCard({ title, university, level, duration, tuition, intake, ielts, scholarship, matchScore, onView, onCompare, onSave, saved, className }: {
  title: string;
  university: string;
  level?: string;
  duration?: string;
  tuition?: string;
  intake?: string;
  ielts?: string;
  scholarship?: boolean;
  matchScore?: number;
  onView?: () => void;
  onCompare?: () => void;
  onSave?: () => void;
  saved?: boolean;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onView} accent className={className}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {level && <Badge variant="blue" className="mb-2">{level}</Badge>}
            <h3 className="text-sm font-bold text-[var(--alo-text)] line-clamp-2">{title}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--alo-muted)]">
              <Icon name="Building2" className="size-3" />
              {university}
            </p>
          </div>
          {matchScore !== undefined && (
            <div className="shrink-0 text-right">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--alo-blue-soft)] text-xs font-bold text-[var(--alo-blue)]">
                {matchScore}%
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--alo-muted)]">AI Match</p>
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1.5 text-xs">
          {duration && <div className="flex items-center gap-2"><Icon name="Clock" className="size-3 text-[var(--alo-muted)]" /><span className="text-[var(--alo-text-secondary)]">{duration}</span></div>}
          {tuition && <div className="flex items-center gap-2"><Icon name="Wallet" className="size-3 text-[var(--alo-muted)]" /><span className="text-[var(--alo-text-secondary)]">{tuition}</span></div>}
          {intake && <div className="flex items-center gap-2"><Icon name="Calendar" className="size-3 text-[var(--alo-muted)]" /><span className="text-[var(--alo-text-secondary)]">{intake}</span></div>}
          {ielts && <div className="flex items-center gap-2"><Icon name="BookOpen" className="size-3 text-[var(--alo-muted)]" /><span className="text-[var(--alo-text-secondary)]">IELTS {ielts}</span></div>}
        </div>
        {scholarship && (
          <Badge variant="success" className="mt-2 gap-1">
            <Icon name="Award" className="size-3" />
            Scholarship Available
          </Badge>
        )}
        <div className="alo-card-cta mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={onCompare} className="flex-1">
            <Icon name="Columns3" className="size-3.5" />Compare
          </Button>
          <Button variant={saved ? "cta" : "outline"} size="sm" onClick={onSave}>
            <Icon name={saved ? "BookmarkCheck" : "Bookmark"} className="size-3.5" />
          </Button>
          <Button variant="alo" size="sm" onClick={onView} className="flex-1">
            View
          </Button>
        </div>
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 05. ScholarshipCard ═══ */
export function ScholarshipCard({ name, provider, amount, deadline, level, onApply, onView, className }: {
  name: string;
  provider: string;
  amount: string;
  deadline?: string;
  level?: string;
  onApply?: () => void;
  onView?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onView} accent className={className}>
      <div className="relative h-16 bg-gradient-to-br from-[var(--alo-orange)] to-[var(--alo-orange-strong)] p-4">
        <Icon name="Award" className="absolute right-3 top-3 size-8 text-white/30" />
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Scholarship</p>
        <p className="text-lg font-bold text-white">{amount}</p>
      </div>
      <CardContent className="pt-4">
        <h3 className="text-sm font-bold text-[var(--alo-text)] line-clamp-2">{name}</h3>
        <p className="mt-0.5 text-xs text-[var(--alo-muted)]">{provider}</p>
        <div className="mt-3 space-y-1 text-xs">
          {level && <div className="flex items-center gap-2"><Icon name="GraduationCap" className="size-3 text-[var(--alo-blue)]" /><span className="text-[var(--alo-text-secondary)]">{level}</span></div>}
          {deadline && <div className="flex items-center gap-2"><Icon name="CalendarClock" className="size-3 text-[var(--alo-danger)]" /><span className="font-medium text-[var(--alo-danger-strong)]">Deadline: {deadline}</span></div>}
        </div>
        <Button variant="cta" size="sm" className="alo-card-cta mt-4 w-full" onClick={onApply}>
          Apply Now
        </Button>
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 06. CountryCard ═══ */
export function CountryCard({ name, flag, image, universityCount, courseCount, popularIntake, tuitionRange, scholarshipIndicator, onView, className }: {
  name: string;
  flag?: string;
  image?: string;
  universityCount?: number | string;
  courseCount?: number | string;
  popularIntake?: string;
  tuitionRange?: string;
  scholarshipIndicator?: boolean;
  onView?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onView} accent className={className}>
      {/* Master §09 image card: photograph on top, name + metadata in the
          white information area. No dark scrim, no text over photography. */}
      <div className="relative h-40 overflow-hidden bg-[var(--alo-gray-light)]">
        {image ? (
          <img src={image} alt={`${name} — study abroad destination`} className="alo-card-img size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--alo-brand-pale)]">
            <Icon name="Globe" className="size-10 text-[var(--alo-brand)]" />
          </div>
        )}
        {flag && (
          <span className="absolute left-3 top-3 rounded-lg border border-[var(--alo-border)] bg-white/95 px-2 py-0.5 text-base leading-none">
            {flag}
          </span>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-base font-bold text-[var(--alo-text)]">{name}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {universityCount !== undefined && (
            <div className="rounded-lg bg-[var(--alo-gray-light)] p-2">
              <p className="caption-text">Universities</p>
              <p className="font-bold text-[var(--alo-text)]">{universityCount}</p>
            </div>
          )}
          {courseCount !== undefined && (
            <div className="rounded-lg bg-[var(--alo-gray-light)] p-2">
              <p className="caption-text">Courses</p>
              <p className="font-bold text-[var(--alo-text)]">{courseCount}</p>
            </div>
          )}
          {popularIntake && (
            <div className="rounded-lg bg-[var(--alo-gray-light)] p-2">
              <p className="caption-text">Intake</p>
              <p className="font-bold text-[var(--alo-text)]">{popularIntake}</p>
            </div>
          )}
          {tuitionRange && (
            <div className="rounded-lg bg-[var(--alo-gray-light)] p-2">
              <p className="caption-text">Tuition</p>
              <p className="font-bold text-[var(--alo-text)]">{tuitionRange}</p>
            </div>
          )}
        </div>
        {scholarshipIndicator && (
          <Badge variant="orange" className="mt-2 gap-1">
            <Icon name="Award" className="size-3" />Scholarships Available
          </Badge>
        )}
        <Button variant="outline" size="sm" className="alo-card-cta mt-3 w-full" onClick={onView}>
          Explore {name}
          <Icon name="ArrowRight" className="size-3.5" />
        </Button>
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 07. LeadCard (per §15) ═══ */
export function LeadCard({ leadId, name, destination, course, intake, aiMatch, leadScore, isHot, nextAction, onOpen, onWhatsApp, onAssign, className }: {
  leadId: string;
  name: string;
  destination?: string;
  course?: string;
  intake?: string;
  aiMatch?: number;
  leadScore?: number;
  isHot?: boolean;
  nextAction?: string;
  onOpen?: () => void;
  onWhatsApp?: () => void;
  onAssign?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onOpen} accent={isHot} className={cn(isHot && "border-l-4 border-l-[var(--alo-orange)]", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--alo-muted)]">{leadId}</span>
              {isHot && (
                <Badge variant="orange" className="gap-1 text-[11px]">
                  <Icon name="Flame" className="size-2.5" />HOT
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm font-bold text-[var(--alo-text)]">{name}</p>
            <p className="mt-0.5 text-xs text-[var(--alo-muted)]">
              {destination ?? "—"} • {course ?? "—"} • {intake ?? "—"}
            </p>
          </div>
        </div>
        {(aiMatch !== undefined || leadScore !== undefined) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {aiMatch !== undefined && (
              <div className="rounded-lg bg-[var(--alo-blue-soft)] p-2 text-center">
                <p className="caption-text text-[var(--alo-blue)]">AI MATCH</p>
                <p className="text-lg font-bold text-[var(--alo-blue)]">{aiMatch}%</p>
              </div>
            )}
            {leadScore !== undefined && (
              <div className="rounded-lg bg-[var(--alo-orange-soft)] p-2 text-center">
                <p className="caption-text text-[var(--alo-orange)]">LEAD SCORE</p>
                <p className="text-lg font-bold text-[var(--alo-orange)]">{leadScore}</p>
              </div>
            )}
          </div>
        )}
        {nextAction && (
          <div className="mt-3 rounded-lg border border-[var(--alo-sunshine)]/30 bg-[var(--alo-sunshine-soft)] p-2">
            <p className="text-xs font-semibold text-[var(--alo-text)]">Next Best Action</p>
            <p className="text-xs text-[var(--alo-text-secondary)]">→ {nextAction}</p>
          </div>
        )}
        <div className="alo-card-cta mt-3 flex gap-1.5">
          <Button size="sm" variant="outline" onClick={onOpen} className="flex-1 ">Open</Button>
          <Button size="icon" variant="ghost" onClick={onWhatsApp} className="size-8 text-[var(--alo-success)]" aria-label="WhatsApp"><Icon name="MessageCircle" className="size-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onAssign} className="size-8 text-[var(--alo-blue)]" aria-label="Assign"><Icon name="UserPlus" className="size-4" /></Button>
        </div>
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 08. StudentCard ═══ */
export function StudentCard({ name, studentId, avatar, destination, course, stage, profileCompletion, onOpen, className }: {
  name: string;
  studentId: string;
  avatar?: string;
  destination?: string;
  course?: string;
  stage?: string;
  profileCompletion?: number;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onOpen} className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-[var(--alo-blue-soft)] text-xs font-bold text-[var(--alo-blue)]">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--alo-text)] truncate">{name}</p>
            <p className="font-mono text-xs text-[var(--alo-muted)]">{studentId}</p>
          </div>
          {stage && <Badge variant="blue" className="text-[11px]">{stage}</Badge>}
        </div>
        <div className="mt-3 space-y-1 text-xs">
          {destination && <div className="flex items-center gap-1.5"><Icon name="Globe" className="size-3 text-[var(--alo-muted)]" /><span className="text-[var(--alo-text-secondary)]">{destination}</span></div>}
          {course && <div className="flex items-center gap-1.5"><Icon name="BookOpen" className="size-3 text-[var(--alo-muted)]" /><span className="text-[var(--alo-text-secondary)]">{course}</span></div>}
        </div>
        {profileCompletion !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--alo-muted)]">Profile</span>
              <span className="font-bold text-[var(--alo-text)]">{profileCompletion}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--alo-gray-light)]">
              <div className="h-full rounded-full bg-alo-gradient" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        )}
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 09. EmployeeCard ═══ */
export function EmployeeCard({ name, role, avatar, email, status, activeLeads, todayTasks, onOpen, className }: {
  name: string;
  role: string;
  avatar?: string;
  email?: string;
  status?: "ACTIVE" | "IDLE" | "OFFLINE";
  activeLeads?: number;
  todayTasks?: number;
  onOpen?: () => void;
  className?: string;
}) {
  const statusColor = status === "ACTIVE" ? "bg-[var(--alo-success)]" : status === "IDLE" ? "bg-[var(--alo-warning)]" : "bg-[var(--alo-muted)]";
  return (
    <AloCardBase onClick={onOpen} className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="size-10">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-[var(--alo-orange-soft)] text-xs font-bold text-[var(--alo-orange)]">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-[var(--alo-surface)]", statusColor, status === "ACTIVE" && "pulse-dot")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--alo-text)] truncate">{name}</p>
            <p className="text-xs text-[var(--alo-muted)]">{role}</p>
          </div>
        </div>
        {email && <p className="mt-2 truncate text-xs text-[var(--alo-muted)]">{email}</p>}
        {(activeLeads !== undefined || todayTasks !== undefined) && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {activeLeads !== undefined && (
              <div className="rounded-lg bg-[var(--alo-gray-light)] p-2 text-center">
                <p className="caption-text">Leads</p>
                <p className="font-bold text-[var(--alo-text)]">{activeLeads}</p>
              </div>
            )}
            {todayTasks !== undefined && (
              <div className="rounded-lg bg-[var(--alo-gray-light)] p-2 text-center">
                <p className="caption-text">Today</p>
                <p className="font-bold text-[var(--alo-text)]">{todayTasks}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 10. ApplicationCard ═══ */
export function ApplicationCard({ applicationId, university, course, stage, status, deadline, onOpen, className }: {
  applicationId: string;
  university: string;
  course: string;
  stage?: string;
  status?: string;
  deadline?: string;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <AloCardBase onClick={onOpen} accent className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-[var(--alo-muted)]">{applicationId}</span>
          {status && <Badge variant={status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "info"} className="text-[11px]">{status}</Badge>}
        </div>
        <p className="mt-1 text-sm font-bold text-[var(--alo-text)]">{university}</p>
        <p className="text-xs text-[var(--alo-muted)]">{course}</p>
        {stage && (
          <div className="mt-3">
            <p className="caption-text mb-1">Stage</p>
            <div className="flex items-center gap-1">
              <Icon name="GitBranch" className="size-3 text-[var(--alo-blue)]" />
              <span className="text-xs font-semibold text-[var(--alo-text)]">{stage}</span>
            </div>
          </div>
        )}
        {deadline && (
          <p className="mt-2 text-xs text-[var(--alo-danger)]">
            <Icon name="CalendarClock" className="mr-1 inline size-3" />
            Deadline: {deadline}
          </p>
        )}
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ 11. AIRecommendCard ═══ */
export function AIRecommendCard({ title, recommendation, confidence, reasoning, onApply, onDismiss, className }: {
  title: string;
  recommendation: string;
  confidence?: number;
  reasoning?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden rounded-2xl border-[var(--alo-blue)]/20 bg-gradient-to-br from-[var(--alo-blue-soft)]/60 to-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]", className)}>
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[var(--alo-blue)]/8 blur-2xl" />
      <CardContent className="relative pt-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-alo-gradient text-white shadow-[var(--alo-shadow-blue)]">
            <Icon name="Sparkles" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="caption-text text-[var(--alo-blue-strong)]">AI Recommendation</p>
            <h4 className="text-sm font-bold text-[var(--alo-text)]">{title}</h4>
          </div>
          {confidence !== undefined && (
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-muted)]">Confidence</p>
              <p className={cn("text-sm font-bold", confidence >= 80 ? "text-[var(--alo-success)]" : confidence >= 50 ? "text-[var(--alo-warning)]" : "text-[var(--alo-danger)]")}>{confidence}%</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-[var(--alo-text)]">{recommendation}</p>
        {reasoning && (
          <p className="mt-1 flex items-start gap-1 text-xs text-[var(--alo-text-secondary)]">
            <Icon name="Brain" className="mt-0.5 size-3 shrink-0 text-[var(--alo-blue)]" />
            {reasoning}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          {onDismiss && <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>}
          {onApply && <Button variant="alo" size="sm" onClick={onApply} className="ml-auto">
            <Icon name="Check" className="size-3.5" />Apply
          </Button>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══ 12. AnalyticsCard ═══ */
export function AnalyticsCard({ label, value, icon, accent, trend, sparkline, className }: {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent?: AccentColor;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  sparkline?: number[];
  className?: string;
}) {
  const a = ACCENT_CLASSES[accent || "blue"];
  const maxSpark = sparkline ? Math.max(...sparkline) : 1;
  return (
    <Card className={cn("rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:shadow-[var(--alo-shadow-md)]", className)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="caption-text">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--alo-text)]">{value}</p>
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", a.bg, a.text)}>
            <Icon name={icon} className="size-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <Icon name={trend.direction === "up" ? "TrendingUp" : trend.direction === "down" ? "TrendingDown" : "Minus"} className={cn("size-3", trend.direction === "up" && "text-[var(--alo-success)]", trend.direction === "down" && "text-[var(--alo-danger)]", trend.direction === "flat" && "text-[var(--alo-muted)]")} />
            <span className={cn("font-medium", trend.direction === "up" && "text-[var(--alo-success)]", trend.direction === "down" && "text-[var(--alo-danger)]", trend.direction === "flat" && "text-[var(--alo-muted)]")}>{trend.value}</span>
          </div>
        )}
        {sparkline && sparkline.length > 1 && (
          <div className="mt-3 flex h-6 items-end gap-0.5">
            {sparkline.map((v, i) => (
              <div key={i} className={cn("flex-1 rounded-sm", a.dot)} style={{ height: `${(v / maxSpark) * 100}%`, opacity: 0.3 + (i / sparkline.length) * 0.7 }} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══ 13. ActionCard ═══ */
export function ActionCard({ title, description, icon, ctaLabel, onCta, accent, className }: {
  title: string;
  description?: string;
  icon: string;
  ctaLabel: string;
  onCta: () => void;
  accent?: AccentColor;
  className?: string;
}) {
  const a = ACCENT_COLORS[accent || "blue"];
  return (
    <AloCardBase onClick={onCta} accent className={className}>
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className={cn("flex size-14 items-center justify-center rounded-2xl", a.bg, a.text)}>
          <Icon name={icon} className="size-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-[var(--alo-text)]">{title}</h3>
        {description && <p className="mt-1 text-sm text-[var(--alo-muted)]">{description}</p>}
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant={accent === "orange" ? "cta" : "alo"} size="sm" className="alo-card-cta mt-4">
          {ctaLabel}
          <Icon name="ArrowRight" className="size-3.5" />
        </Button>
      </CardContent>
    </AloCardBase>
  );
}

/* ═══ Helper: Accent color map for ActionCard ═══ */
const ACCENT_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-[var(--alo-blue-soft)]", text: "text-[var(--alo-blue)]" },
  orange: { bg: "bg-[var(--alo-orange-soft)]", text: "text-[var(--alo-orange)]" },
  sunshine: { bg: "bg-[var(--alo-sunshine-soft)]", text: "text-[var(--alo-sunshine)]" },
};

/* ═══ Re-export IconButton for convenience ═══ */
export { IconButton } from "./ui";
