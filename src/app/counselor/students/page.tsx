'use client';
import dynamic from 'next/dynamic';
const Student360 = dynamic(() => import('@/components/alo/views/counselor-student-360'), { ssr: false });
export default function Page() { return <Student360 />; }
