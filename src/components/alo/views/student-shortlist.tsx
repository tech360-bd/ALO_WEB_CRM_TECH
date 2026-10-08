"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

type Course = {
  slug: string;
  name?: string;
  title?: string;
  university?: string;
  country?: string;
  studyLevel?: string;
  level?: string;
  duration?: string;
  tuitionFee?: number;
  currency?: string;
  intake?: string;
};

export function StudentShortlist() {
  const { toast } = useToast();
  const { studentId } = useStudentId();
  const [slugs, setSlugs] = React.useState<string[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/course-finder/shortlist?studentId=${studentId || ""}`)
      .then((r) => r.json())
      .then(async (d) => {
        const list: string[] = d.shortlisted || [];
        setSlugs(list);
        const details = await Promise.all(
          list.map((slug) =>
            fetch(`/api/courses/${slug}`)
              .then((r) => r.json())
              .then((cd) => cd.course as Course | null)
              .catch(() => null)
          )
        );
        setCourses(details.filter(Boolean) as Course[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (courseSlug: string) => {
    if (!studentId) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/course-finder/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId || "", courseSlug }),
      });
      if (res.ok) {
        toast({ title: "Removed from shortlist" });
        setSlugs((prev) => prev.filter((s) => s !== courseSlug));
        setCourses((prev) => prev.filter((c) => c.slug !== courseSlug));
      }
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="Shortlisted Courses"
          subtitle={`${slugs.length} course${slugs.length === 1 ? "" : "s"} saved`}
          icon="Bookmark"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your shortlisted courses."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Shortlisted Courses"
        subtitle={`${slugs.length} course${slugs.length === 1 ? "" : "s"} saved`}
        icon="Bookmark"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title="No shortlisted courses"
          description="Browse the course finder and bookmark courses to save them here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card
              key={c.slug}
              className="rounded-2xl border border-[#DCE8F5] bg-white transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#0B2447]">{c.name || c.title || "Course"}</h3>
                    <p className="text-sm text-[#5A7299]">{c.university || "—"}</p>
                  </div>
                  <Badge className={cn("bg-[#EAF3FF] text-[#2563EB]")}>{c.country || "—"}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#5A7299]">Level</p>
                    <p className="font-semibold text-[#0B2447]">
                      {c.studyLevel || c.level || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5A7299]">Duration</p>
                    <p className="font-semibold text-[#0B2447]">{c.duration || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#5A7299]">Tuition</p>
                    <p className="font-semibold text-[#0B2447]">
                      {c.tuitionFee ? `${c.tuitionFee.toLocaleString()} ${c.currency || ""}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5A7299]">Intake</p>
                    <p className="font-semibold text-[#0B2447]">{c.intake || "Sep 2026"}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#F97316] text-[#F97316] hover:bg-[#FFF3EA]"
                    onClick={() => handleRemove(c.slug)}
                  >
                    <Icon name="Trash2" className="mr-1 size-3.5" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentShortlist;
