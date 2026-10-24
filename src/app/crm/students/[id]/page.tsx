'use client';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const Student360 = dynamic(() => import('@/components/alo/views/counselor-student-360'), { ssr: false });

/**
 * Canonical CRM Student 360 for /crm/students/{studentId}.
 *
 * Any dashboard that shows a student name can link here; the id is forwarded to
 * the shared Student 360 view, which resolves it through
 * /api/counselor/students/{id} so assignment, masking and RBAC are still
 * enforced server-side. Access outside the caller's scope returns an error
 * state — it never falls back to a different student.
 */
export default function CrmStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const slug = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  return <Student360 slug={slug} />;
}
