'use client';
import dynamic from 'next/dynamic';
const Apps = dynamic(() => import('@/components/alo/views/applications'), { ssr: false });
export default function Page() { return <Apps />; }
