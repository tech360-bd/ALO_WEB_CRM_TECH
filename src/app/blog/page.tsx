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
      <section className="bg-[#2563EB] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Blog & Insights</h1>
          <p className="text-lg md:text-xl text-blue-100">
            Your ultimate knowledge hub for studying abroad. Discover expert guides on visas, scholarships, universities, and test preparation.
          </p>
        </div>
      </section>

      {/* Blog Grid Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
            {categories.map((category) => (
              <button 
                key={category} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === 'All' 
                    ? 'bg-[#F97316] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MASTER_BLOGS_DATA.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
                <div className="relative h-56 overflow-hidden">
                  <Image 
                    src={blog.heroImage} 
                    alt={blog.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block bg-[#2563EB] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#F97316] transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3 text-sm">
                    {blog.excerpt}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[#2563EB] font-bold">
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
