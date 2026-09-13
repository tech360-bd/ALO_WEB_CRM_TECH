'use client';
import dynamic from 'next/dynamic';
const Mkt = dynamic(() => import('@/components/alo/views/marketing-dashboard'), { ssr: false });
export default function Page() { return <Mkt />; }
