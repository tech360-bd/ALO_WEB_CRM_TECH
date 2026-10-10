import CategoryPage, { generateMetadata as categoryMetadata } from '../[slug]/page';
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return categoryMetadata({ params: Promise.resolve({ slug: 'blogs' }) });
}
export default function BlogsPage() {
  return CategoryPage({ params: Promise.resolve({ slug: 'blogs' }) });
}
