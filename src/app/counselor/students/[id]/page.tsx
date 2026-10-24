'use client';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const Student360 = dynamic(() => import('@/components/alo/views/counselor-student-360'), { ssr: false });

/**
 * Canonical counselor Student 360 page for /counselor/students/{id}.
 *
 * The previous version rendered `<Student360 />` without the route id, so the
 * component always fell back to the first student in the counselor's list —
 * clicking a student name could open a different student's record. The id is
 * read with `useParams()` (the page is a client component) and forwarded as the
 * `slug` prop the view already supports.
 */
export default function Page() {
  const params = useParams<{ id: string }>();
  const slug = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  return <Student360 slug={slug} />;
}
