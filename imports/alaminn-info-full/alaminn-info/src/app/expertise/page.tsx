import { redirect } from "next/navigation";

/**
 * /expertise → /about
 *
 * About and Expertise have been merged into a single "About & Expertise"
 * page per the premium navigation simplification. This route redirects
 * cleanly so existing bookmarks and links continue to work.
 */
export default function ExpertiseRedirect() {
  redirect("/about");
}
