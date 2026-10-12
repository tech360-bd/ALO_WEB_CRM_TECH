import ArticlePage, { generateMetadata as articleMetadata } from '../../[slug]/[article]/page';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return articleMetadata({ params: Promise.resolve({ slug: 'blogs', article: slug }) });
}
export default async function BlogPage({ params }: Props) {
  const { slug } = await params;
  return ArticlePage({ params: Promise.resolve({ slug: 'blogs', article: slug }) });
}
