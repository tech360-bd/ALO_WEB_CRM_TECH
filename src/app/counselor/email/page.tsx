'use client';
import dynamic from 'next/dynamic';
const Email = dynamic(() => import('@/components/alo/views/crm-email'), { ssr: false });
export default function Page() { return <Email />; }
