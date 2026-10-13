/**
 * /english-learning/tutors/[slug]
 * --------------------------------------------------------------------
 * Tutor profile page — bio, specialties, qualifications, hourly rate,
 * rating, booking CTA (creates referral to ALO Education).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  DollarSign,
  Clock,
  Award,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ArrowLeftRight,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { ReferralCta } from "@/components/english-learning/referral-cta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await db.englishLearningTutor.findFirst({
    where: { slug, isPublished: true },
    select: { name: true, bio: true },
  });
  if (!tutor) {
    return buildEnglishLearningMetadata({
      title: "Tutor not found",
      description: "This English Learning tutor could not be found.",
      path: `/english-learning/tutors/${slug}`,
      noindex: true,
    });
  }
  return buildEnglishLearningMetadata({
    title: `${tutor.name} — English Tutor`,
    description:
      tutor.bio?.slice(0, 160) ||
      `Book a 1:1 session with ${tutor.name}, a verified English Learning tutor.`,
    path: `/english-learning/tutors/${slug}`,
  });
}

export default async function TutorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tutor = await db.englishLearningTutor.findFirst({
    where: { slug, isPublished: true },
  });

  if (!tutor) notFound();

  const specialties = parseJsonArray(tutor.specialties).map(String);
  const qualifications = parseJsonArray(tutor.qualifications).map(String);
  const rate = tutor.hourlyRateUsd
    ? formatPrice(tutor.hourlyRateUsd, tutor.currency)
    : null;

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb
            items={[
              { label: "Tutors", href: "/english-learning/tutors" },
              { label: tutor.name },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-ink-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-white shadow-soft">
                {tutor.avatarUrl ? (
                  <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
                ) : null}
                <AvatarFallback className="bg-emerald-50 font-display text-xl font-bold text-emerald-700">
                  {initials(tutor.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                    {tutor.name}
                  </h1>
                  {tutor.isAvailable ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-[11px] font-bold uppercase tracking-wider text-emerald-700"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                      Available
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-ink-200 bg-ink-50 text-[11px] font-bold uppercase tracking-wider text-ink-500"
                    >
                      Booked
                    </Badge>
                  )}
                </div>
                {tutor.yearsExperience != null && (
                  <p className="mt-1 text-sm text-ink-600">
                    {tutor.yearsExperience}+ years teaching English
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="font-bold text-ink-900">
                    {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                  </span>
                  {tutor.reviewCount > 0 && (
                    <span className="text-ink-500">
                      ({tutor.reviewCount} review{tutor.reviewCount === 1 ? "" : "s"})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky booking CTA */}
            <Card className="p-5 shadow-soft lg:sticky lg:top-6">
              <h3 className="font-display text-base font-bold text-ink-900">
                Book this tutor
              </h3>
              {rate && (
                <p className="mt-1 text-sm text-ink-700">
                  From{" "}
                  <span className="font-bold text-emerald-700">{rate}/hour</span>
                </p>
              )}
              <ReferralCta
                referralType="tutor-booking"
                tutorSlug={tutor.slug}
                sourceEntityId={tutor.id}
                sourceEntityType="tutor"
                label="Book a Session"
                size="lg"
                className="mt-4 w-full rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
              />
              <Button
                asChild
                variant="outline"
                className="mt-2 w-full gap-1.5 rounded-xl border-ink-200 text-ink-700"
              >
                <Link href="/english-learning/book-tutor">
                  Browse all tutors
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              {tutor.officialProfileUrl && (
                <a
                  href={tutor.officialProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  View official profile
                </a>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              {tutor.bio && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    About {tutor.name.split(" ")[0]}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                    {tutor.bio}
                  </p>
                </div>
              )}

              {specialties.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Specialties
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {specialties.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700"
                      >
                        <Award className="mr-1 h-3 w-3" aria-hidden="true" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {qualifications.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Qualifications
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-ink-700">
                    {qualifications.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ShieldCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <Card className="p-5">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-700">
                  Snapshot
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  {rate && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1 text-ink-500">
                        <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                        Hourly rate
                      </dt>
                      <dd className="font-bold text-emerald-700">{rate}</dd>
                    </div>
                  )}
                  {tutor.yearsExperience != null && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1 text-ink-500">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        Experience
                      </dt>
                      <dd className="font-bold text-ink-900">
                        {tutor.yearsExperience}y
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-ink-500">
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      Rating
                    </dt>
                    <dd className="font-bold text-ink-900">
                      {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                    </dd>
                  </div>
                </dl>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5">
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-700"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
                  Related
                </Badge>
                <h3 className="mt-2 font-display text-base font-bold text-ink-900">
                  Need academic help too?
                </h3>
                <p className="mt-1 text-xs text-ink-600">
                  Pair English tutoring with university applications, scholarships
                  and PhD opportunities on the Higher Study platform.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-3 w-full gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Link href="/higher-study">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    Explore Higher Study
                  </Link>
                </Button>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function formatPrice(rate: number, currency: string): string {
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

function parseJsonArray(value: unknown): unknown[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
