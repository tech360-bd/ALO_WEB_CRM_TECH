"use client";

/**
 * MarkdownRenderer — client wrapper around `react-markdown`.
 *
 * `react-markdown` v10 is ESM-only and uses hooks internally, so it
 * must run on the client. Server Components pass the raw markdown
 * string as a prop; this client component renders the parsed HTML.
 *
 * Styling follows the Higher Study brand: Manrope display for headings,
 * Inter for body, blue link colour, list bullets in orange. Tailwind
 * typography is intentionally avoided in favour of explicit classes
 * so the visual style stays consistent with the rest of the platform.
 */
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export interface MarkdownRendererProps {
  /** The markdown source to render. */
  content?: string | null;
  /** Optional className for the wrapper. */
  className?: string;
}

/**
 * Render a markdown string to styled HTML.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null;
  return (
    <div
      className={cn(
        "space-y-4 text-sm leading-relaxed text-ink-700 sm:text-base [&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_a:hover]:text-blue-800 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-orange-300 [&_blockquote]:bg-orange-50/60 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:text-ink-700 [&_code]:rounded-md [&_code]:bg-ink-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-ink-900 [&_h1]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink-900 [&_h2]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink-900 [&_h3]:mt-4 [&_h4]:font-display [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-ink-900 [&_h4]:mt-3 [&_img]:rounded-xl [&_img]:border [&_img]:border-ink-200 [&_li]:ml-5 [&_li]:list-disc [&_li_marker]:text-orange-500 [&_ol>li]:list-decimal [&_ol]:ml-5 [&_p]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-ink-200 [&_pre]:bg-ink-50 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_strong]:text-ink-900 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_td]:border [&_td]:border-ink-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_th]:border [&_th]:border-ink-200 [&_th]:bg-ink-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink-900 [&_ul]:ml-5 [&_ul]:list-disc",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
