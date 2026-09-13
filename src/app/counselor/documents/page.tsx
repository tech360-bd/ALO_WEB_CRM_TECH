'use client';
import dynamic from 'next/dynamic';
const DocHub = dynamic(() => import('@/components/alo/views/document-hub'), { ssr: false });
export default function Page() { return <DocHub />; }
