import { redirect } from "next/navigation";

/**
 * /contact → /work-with-me
 *
 * Contact and Work With Me have been merged into a single conversion-focused
 * page per the premium navigation simplification. The contact form, schedule
 * meeting, services and collaboration models all live on /work-with-me now.
 * This route redirects cleanly so existing bookmarks continue to work.
 */
export default function ContactRedirect() {
  redirect("/work-with-me");
}
