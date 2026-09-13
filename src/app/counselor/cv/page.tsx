'use client';
import dynamic from 'next/dynamic';
const Cv = dynamic(() => import('@/components/alo/views/student-cv'), { ssr: false });
export default function Page() { return <Cv />; }
