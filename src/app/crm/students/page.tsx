'use client';
import dynamic from 'next/dynamic';

const Student360 = dynamic(() => import('@/components/alo/views/counselor-student-360'), { ssr: false });

/**
 * CRM student directory.
 *
 * This is the entry point behind the "Students" links that previously pointed
 * at a non-existent /crm/students route. It renders the same Student 360 list
 * used by the counselor workspace, so both surfaces share one component and
 * one API contract rather than diverging.
 */
export default function CrmStudentsPage() {
  return <Student360 />;
}
