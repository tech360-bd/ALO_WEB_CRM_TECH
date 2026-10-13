/**
 * LessonCard — server component rendering a single lesson in a course
 * syllabus list. Shows the lesson type icon, title, summary, duration,
 * free-preview badge, and a "Start lesson" / "Locked" CTA.
 */
import Link from "next/link";
import {
  Video,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  SpellCheck,
  Languages,
  ListChecks,
  Clock,
  Lock,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LESSON_TYPE_MAP } from "@/lib/english-learning/constants";
import type { Lesson } from "@/lib/english-learning/types";

const LESSON_ICONS: Record<string, typeof Video> = {
  video: Video,
  reading: BookOpen,
  listening: Headphones,
  speaking: Mic,
  writing: PenLine,
  grammar: SpellCheck,
  vocab: Languages,
  quiz: ListChecks,
};

interface LessonCardProps {
  lesson: Lesson;
  courseId?: string;
  courseSlug?: string;
  /** When false, the lesson is gated — show a Lock badge instead of Start. */
  isLocked?: boolean;
  className?: string;
}

export function LessonCard({
  lesson,
  courseId: _courseId,
  courseSlug: _courseSlug,
  isLocked = false,
  className,
}: LessonCardProps) {
  const lessonType = LESSON_TYPE_MAP[lesson.lessonType as string];
  const Icon = LESSON_ICONS[lesson.lessonType as string] ?? BookOpen;
  const label = lessonType?.label ?? "Lesson";
  const href = `/english-learning/lessons/${lesson.id}?sessionId=`;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft transition-all hover:border-blue-200 hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          lesson.isFreePreview
            ? "bg-emerald-50 text-emerald-700"
            : "bg-blue-50 text-blue-700",
        )}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-ink-200 bg-ink-50 text-[10px] font-bold uppercase tracking-wider text-ink-600"
          >
            {label}
          </Badge>
          {lesson.isFreePreview && (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
            >
              Free Preview
            </Badge>
          )}
          {lesson.durationMinutes != null && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-500">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {lesson.durationMinutes}m
            </span>
          )}
        </div>

        <h4 className="mt-1 font-display text-sm font-bold leading-snug text-ink-900">
          {lesson.title}
        </h4>
        {lesson.summary && (
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-600">
            {lesson.summary}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {isLocked && !lesson.isFreePreview ? (
          <span
            className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-[11px] font-semibold text-ink-500"
            title="Enroll to unlock this lesson"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Locked
          </span>
        ) : (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 gap-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Link href={href} aria-label={`Start lesson: ${lesson.title}`}>
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Start</span>
              <ArrowRight className="h-3 w-3 sm:hidden" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
