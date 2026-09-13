'use client';
import dynamic from 'next/dynamic';
const Visa = dynamic(() => import('@/components/alo/views/student-360'), { ssr: false });
export default function Page() { return <Visa />; }
