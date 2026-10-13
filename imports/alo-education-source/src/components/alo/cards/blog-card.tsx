'use client'

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import Image from 'next/image';

// ─── TypeScript Interface ───────────────────────────────────────────────────

export interface BlogCardData {
  title: string;
  excerpt: string;
  category: string;
  image: string;
  readingTime: string;
  date: string;
  slug: string;
}

export interface BlogCardProps {
  blog: BlogCardData;
  onClick?: () => void;
  onQuickView?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BlogCard({ blog, onClick, onQuickView }: BlogCardProps) {
  const handleClick = () => {
    onQuickView?.();
    onClick?.();
  };

  return (
    <motion.article
      role="article"
      aria-label={blog.title}
      tabIndex={0}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-alo-gray-medium/60 bg-alo-white shadow-sm card-lift focus-ring cursor-pointer'
      )}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* ── Image Section ─────────────────────────────────────────────── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl">
        <Image
          src={blog.image}
          alt={blog.title}
          fill
          className="img-zoom object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Category badge — top left on image */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <Badge className="bg-alo-blue text-white border-0 text-[11px] font-semibold rounded-full px-3">
            <BookOpen className="h-3 w-3 mr-1" />
            {blog.category}
          </Badge>
        </div>

        {/* Progressive reveal: Read Guide slides up on hover */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/50 to-transparent pb-4 pt-10"
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            Read Guide
            <ArrowRight className="h-4 w-4" />
          </span>
        </motion.div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm sm:text-base font-bold leading-snug text-foreground group-hover:text-alo-blue transition-colors">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {blog.excerpt}
        </p>

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Meta Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {blog.readingTime}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {blog.date}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
