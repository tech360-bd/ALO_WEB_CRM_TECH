'use client';
import dynamic from 'next/dynamic';
const Comm = dynamic(() => import('@/components/alo/views/comm-command-center'), { ssr: false });
export default function Page() { return <Comm />; }
