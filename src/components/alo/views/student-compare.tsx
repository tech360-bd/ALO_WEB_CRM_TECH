"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";

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
  ielts?: string;
  englishRequirement?: string;
  scholarshipAvailable?: boolean;
  ranking?: string;
};

export function StudentCompare() {
  const { studentId } = useStudentId();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/course-finder/compare?studentId=${studentId || ""}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (cancelled) return;
        const list: string[] = d.compared || [];
        const details = await Promise.all(
          list.map((slug) =>
            fetch(`/api/courses/${slug}`)
              .then((r) => r.json())
              .then((cd) => cd.course)
              .catch(() => null)
          )
        );
        if (cancelled) return;
        setCourses(details.filter(Boolean) as Course[]);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const rows: { label: string; get: (c: Course) => React.ReactNode; icon: string }[] = [
    { label: "University", get: (c) => c.university || "—", icon: "Building2" },
    { label: "Country", get: (c) => c.country || "—", icon: "Globe" },
    { label: "Level", get: (c) => c.studyLevel || c.level || "—", icon: "GraduationCap" },
    { label: "Duration", get: (c) => c.duration || "—", icon: "Clock" },
    {
      label: "Tuition Fee",
      get: (c) =>
        c.tuitionFee ? `${c.tuitionFee.toLocaleString()} ${c.currency || ""}` : "—",
      icon: "DollarSign",
    },
    { label: "Intake", get: (c) => c.intake || "Sep 2026", icon: "Calendar" },
    { label: "IELTS", get: (c) => c.ielts || c.englishRequirement || "6.5", icon: "Languages" },
    {
      label: "Scholarship",
      get: (c) => (c.scholarshipAvailable ? "Yes" : "Check with counselor"),
      icon: "Award",
    },
    { label: "Ranking", get: (c) => c.ranking || "Top 200", icon: "Trophy" },
  ];

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="Compare Courses"
          subtitle="Side-by-side comparison of up to 3 courses"
          icon="Columns3"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to compare courses."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Compare Courses"
        subtitle="Side-by-side comparison of up to 3 courses"
        icon="Columns3"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon="Columns3"
          title="No courses to compare"
          description="Add courses to the comparison list from the course finder."
        />
      ) : (
        <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#DCE8F5] bg-[#F7FAFE]">
                    <th className="w-48 px-5 py-4 text-left text-sm font-semibold text-[#5A7299]">
                      Attribute
                    </th>
                    {courses.map((c) => (
                      <th key={c.slug} className="min-w-[200px] px-5 py-4 text-left">
                        <div>
                          <p className="font-bold text-[#0B2447]">{c.name || c.title}</p>
                          <Badge className={cn("mt-1 bg-[#EAF3FF] text-[#0066CC]")}>
                            {c.country || "—"}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 0 ? "bg-white" : "bg-[#F7FAFE]"}
                    >
                      <td className="px-5 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Icon name={row.icon} className="size-4 text-[#5A7299]" />
                          <span className="font-medium text-[#5A7299]">{row.label}</span>
                        </div>
                      </td>
                      {courses.map((c) => (
                        <td key={c.slug} className="px-5 py-3 text-sm text-[#0B2447]">
                          {row.get(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StudentCompare;
