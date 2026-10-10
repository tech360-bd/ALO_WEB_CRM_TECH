import { redirect } from "next/navigation";

/**
 * Backwards-compatible course catalogue entry point.
 * The searchable catalogue lives at /course-finder, while older sitemap and
 * campaign links use /courses. Keep both paths functional instead of serving
 * a framework 404.
 */
export default function CoursesIndexPage() {
  redirect("/course-finder");
}
