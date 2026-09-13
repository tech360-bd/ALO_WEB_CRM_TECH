'use client';
import dynamic from 'next/dynamic';
const Sop = dynamic(() => import('@/components/alo/views/sop-studio'), { ssr: false });
export default function Page() { return <Sop />; }
