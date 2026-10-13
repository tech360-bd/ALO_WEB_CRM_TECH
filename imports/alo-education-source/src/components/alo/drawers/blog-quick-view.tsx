'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  X,
  Clock,
  Calendar,
  User,
  Bookmark,
  Share2,
  ArrowRight,
  Phone,
  BookOpen,
  Quote,
  CheckCircle2,
} from 'lucide-react';

// ─── TypeScript Interfaces ──────────────────────────────────────────────────

export interface BlogArticleContent {
  type: 'paragraph' | 'subheading' | 'bullets' | 'quote';
  text: string;
  items?: string[];
}

export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogArticleData {
  title: string;
  excerpt: string;
  category: string;
  image: string;
  readingTime: string;
  date: string;
  slug: string;
  author: BlogAuthor;
  content: BlogArticleContent[];
}

export interface BlogQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog: BlogArticleData | null;
  onSave?: () => void;
  onShare?: () => void;
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function BlogQuickView({
  open,
  onOpenChange,
  blog,
  onSave,
  onShare,
}: BlogQuickViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const savedSlugRef = useRef<string | null>(null);

  // Sync saved state when blog slug changes (avoid useEffect setState)
  const currentSlug = blog?.slug ?? null;
  if (currentSlug !== savedSlugRef.current) {
    savedSlugRef.current = currentSlug;
    setSaved(false);
  }

  // Track reading progress based on scroll position
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    if (scrollHeight > 0) {
      setReadingProgress((target.scrollTop / scrollHeight) * 100);
    }
  }, []);

  const handleSave = useCallback(() => {
    setSaved((prev) => !prev);
    if (!saved) {
      toast.success('Article bookmarked', {
        description: blog?.title,
      });
    } else {
      toast.info('Bookmark removed', {
        description: blog?.title,
      });
    }
    onSave?.();
  }, [saved, blog?.title, onSave]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.success('Share this article using your browser share option');
    }
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share && blog) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: window.location.href,
      }).catch(() => {
        // User cancelled or API unavailable — fall through to clipboard
        void copyToClipboard();
      });
    } else {
      void copyToClipboard();
    }
    onShare?.();
  }, [blog, onShare, copyToClipboard]);

  if (!blog) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-[520px] sm:max-w-[560px] p-0 gap-0 overflow-hidden lg:h-screen h-[90vh] rounded-none"
      >
        {/* Accessibility: hidden title + description for screen readers */}
        <SheetTitle className="sr-only">{blog.title}</SheetTitle>
        <SheetDescription className="sr-only">
          {blog.excerpt}
        </SheetDescription>

        <div className="flex h-full flex-col relative">
          {/* ── Reading Progress Bar (very top) ──────────────────────── */}
          <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-alo-gray-medium/20">
            <motion.div
              className="h-full bg-gradient-to-r from-alo-blue to-alo-orange"
              style={{ width: `${readingProgress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          {/* ── Scrollable Content ─────────────────────────────────────── */}
          <ScrollArea className="flex-1 alo-scrollbar" ref={scrollRef}>
            <AnimatePresence mode="wait">
              <motion.div
                key={blog.slug}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col"
                onScrollCapture={handleScroll}
              >
                {/* ── Hero Image with Category Badge ───────────────────── */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    sizes="560px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Close button overlay — top right */}
                  <button
                    type="button"
                    aria-label="Close drawer"
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 transition-colors hover:bg-black/60 hover:text-white focus-ring"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Category badge — bottom left */}
                  <div className="absolute bottom-3 left-4 z-10">
                    <Badge className="bg-alo-blue text-white border-0 text-xs font-semibold px-2.5 py-1">
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      {blog.category}
                    </Badge>
                  </div>
                </div>

                {/* ── Article Header ──────────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 pt-5 pb-3">
                  <h2 className="text-xl font-bold leading-tight text-foreground">
                    {blog.title}
                  </h2>

                  {/* Meta row: date, reading time */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {blog.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {blog.readingTime}
                    </span>
                  </div>

                  {/* Author info */}
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/30 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alo-blue-light text-alo-blue">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {blog.author.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {blog.author.role}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons: Share + Bookmark */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex items-center gap-1.5 rounded-lg border border-alo-gray-medium/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-alo-gray-light focus-ring"
                      aria-label="Share this article"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className={
                        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-ring ' +
                        (saved
                          ? 'border-alo-orange/40 bg-alo-orange/10 text-alo-orange'
                          : 'border-alo-gray-medium/60 text-foreground hover:bg-alo-gray-light')
                      }
                      aria-label={saved ? 'Remove bookmark' : 'Bookmark this article'}
                    >
                      <Bookmark className={saved ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5'} />
                      {saved ? 'Saved' : 'Bookmark'}
                    </button>
                  </div>
                </motion.div>

                {/* ── Article Content ──────────────────────────────────── */}
                <div className="px-5 pb-6">
                  <div className="space-y-4">
                    {blog.content.map((block, idx) => {
                      if (block.type === 'subheading') {
                        return (
                          <motion.h3
                            key={`sub-${idx}`}
                            variants={itemVariants}
                            className="pt-2 text-base font-bold text-foreground"
                          >
                            {block.text}
                          </motion.h3>
                        );
                      }

                      if (block.type === 'quote') {
                        return (
                          <motion.blockquote
                            key={`quote-${idx}`}
                            variants={itemVariants}
                            className="relative rounded-xl border-l-4 border-alo-orange bg-alo-orange/5 px-5 py-4"
                          >
                            <Quote className="absolute -left-2.5 -top-1 h-6 w-6 text-alo-orange/30" />
                            <p className="pl-2 text-sm italic leading-relaxed text-foreground/80">
                              {block.text}
                            </p>
                          </motion.blockquote>
                        );
                      }

                      if (block.type === 'bullets' && block.items) {
                        return (
                          <motion.ul
                            key={`bullets-${idx}`}
                            variants={itemVariants}
                            className="space-y-2 rounded-xl border border-alo-gray-medium/40 bg-alo-gray-light/20 p-4"
                          >
                            {block.items.map((item, itemIdx) => (
                              <li
                                key={itemIdx}
                                className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/80"
                              >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </motion.ul>
                        );
                      }

                      // paragraph (default)
                      return (
                        <motion.p
                          key={`p-${idx}`}
                          variants={itemVariants}
                          className="text-sm leading-relaxed text-foreground/80"
                        >
                          {block.text}
                        </motion.p>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom spacer so last content isn't hidden behind sticky bar */}
                <div className="h-4" />
              </motion.div>
            </AnimatePresence>
          </ScrollArea>

          {/* ── Sticky Bottom CTA Bar ─────────────────────────────────── */}
          <div className="shrink-0 border-t border-alo-gray-medium/60 bg-alo-white px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Button
                size="sm"
                className="h-10 flex-1 gap-2 bg-alo-blue text-sm font-bold text-white hover:bg-alo-blue-dark"
                aria-label="Talk to an ALO expert"
              >
                <Phone className="h-4 w-4" />
                Talk to Expert
              </Button>

              <Button
                size="sm"
                className="h-10 flex-1 gap-2 bg-alo-orange text-sm font-bold text-white hover:bg-alo-orange-dark"
                aria-label="Apply now"
              >
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
