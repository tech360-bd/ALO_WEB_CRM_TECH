'use client';
import dynamic from 'next/dynamic';
const Tasks = dynamic(() => import('@/components/alo/views/crm-tasks'), { ssr: false });
export default function Page() { return <Tasks />; }
