import Link from 'next/link';
import { Metadata } from 'next';
import { MASTER_BLOGS_DATA } from '@/lib/blogs-data';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Blog & Insights | ALO Education Study Abroad Knowledge Hub',
  description: 'Explore our latest blogs, insights, and guides for studying abroad. Get tips on visas, scholarships, applications, and test preparation.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogPage() {
  const categories = ['All', 'Visa & Immigration', 'Scholarships', 'Test Preparation', 'University Guide', 'SOP & Admission'];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="border-b border-[var(--alo-border)] bg-[var(--alo-brand-pale)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-secondary)] ring-1 ring-inset ring-[var(--alo-border)]">
            <span className="size-1.5 rounded-full bg-[var(--alo-brand)]" aria-hidden="true" />
            <span className="text-[var(--alo-brand)]">Editorial</span>
          </span>
          <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-[var(--alo-text)] sm:text-[36px] lg:text-[42px] mb-4">Blog & Insights</h1>
          <p className="max-w-[62ch] text-[15px] leading-7 text-[var(--alo-body)] md:text-base">
            Your ultimate knowledge hub for studying abroad. Discover expert guides on visas, scholarships, universities, and test preparation.
          </p>
        </div>
      </section>

      {/* Blog Grid Section */}
      <section className="py-16 md:py-24 bg-[var(--alo-page)]">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
            {categories.map((category) => (
              <button 
                key={category} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === 'All' 
                    ? 'bg-[var(--alo-cta)] text-white'
                    : 'bg-white text-[var(--alo-body)] hover:bg-[var(--alo-page)] border border-[var(--alo-border)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MASTER_BLOGS_DATA.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[var(--alo-border)]">
                <div className="relative h-56 overflow-hidden">
                  <Image 
                    src={blog.heroImage} 
                    alt={blog.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block bg-[var(--alo-brand)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-[var(--alo-text)] mb-3 group-hover:text-[var(--alo-cta)] transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-[var(--alo-body)] mb-6 line-clamp-3 text-sm">
                    {blog.excerpt}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-[var(--alo-border)] flex items-center justify-between text-xs text-[var(--alo-text-muted)]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--alo-page)] flex items-center justify-center text-[var(--alo-brand)] font-bold">
                        {blog.author.charAt(0)}
                      </div>
                      <span>{blog.author}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {blog.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
