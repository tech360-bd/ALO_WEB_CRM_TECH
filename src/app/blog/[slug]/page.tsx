import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MASTER_BLOGS_DATA, getBlogBySlug } from '@/lib/blogs-data';

export function generateStaticParams() {
  return MASTER_BLOGS_DATA.map((blog) => ({
    slug: blog.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);
  
  if (!blog) {
    return {
      title: 'Blog Not Found | ALO Education',
    };
  }
  
  return {
    title: blog.seoTitle,
    description: blog.seoDescription,
    alternates: {
      canonical: `/blog/${blog.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      
      {/* Hero Image Section */}
      <div className="w-full h-[40vh] md:h-[60vh] relative">
        <Image 
          src={post.heroImage} 
          alt={post.title} 
          fill 
          className="object-cover" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full">
          <div className="container mx-auto px-4 md:px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <span className="inline-block bg-[#E8501A] text-white text-sm font-semibold px-4 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-300 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0057B8] font-bold text-lg">
                    {post.author.charAt(0)}
                  </div>
                  <span className="font-medium text-white">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {post.readTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
          
          {/* Main Content */}
          <article className="lg:w-2/3 bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
              <Link href="/" className="hover:text-[#0057B8] transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[#0057B8] transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-md">{post.title}</span>
            </div>

            <div 
              className="prose prose-lg prose-blue max-w-none prose-headings:text-[#0057B8] prose-a:text-[#E8501A] prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
            
            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* FAQs */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {post.faqs.map((faq, index) => (
                    <details key={index} className="group bg-gray-50 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-gray-900">
                        {faq.question}
                        <span className="transition group-open:rotate-180">
                          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      <div className="p-6 pt-0 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:w-1/3">
            <div className="sticky top-32 space-y-8">
              {/* Table of Contents */}
              {post.tableOfContents && post.tableOfContents.length > 0 && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E8501A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    Table of Contents
                  </h3>
                  <ul className="space-y-4">
                    {post.tableOfContents.map((item, index) => (
                      <li key={index} className="text-gray-600 text-sm hover:text-[#0057B8] transition-colors cursor-pointer border-l-2 border-transparent hover:border-[#0057B8] pl-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Widget */}
              <div className="bg-gradient-to-br from-[#0057B8] to-blue-900 p-8 rounded-3xl text-white shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
                
                <h3 className="text-2xl font-bold mb-4 relative z-10">Ready to Study Abroad?</h3>
                <p className="text-blue-100 mb-8 text-sm relative z-10">
                  Get personalized guidance from our expert counselors to turn your dream into reality.
                </p>
                <Link href="/book-consultation" className="inline-block w-full bg-[#E8501A] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors relative z-10">
                  Book Free Consultation
                </Link>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}
