'use client';
import dynamic from 'next/dynamic';
const Social = dynamic(() => import('@/components/alo/views/social-dashboard'), { ssr: false });
export default function Page() { return <Social />; }
