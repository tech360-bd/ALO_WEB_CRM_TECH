'use client';
import dynamic from 'next/dynamic';
const Inbox = dynamic(() => import('@/components/alo/views/omnichannel-communication-center'), { ssr: false });
export default function Page() { return <Inbox />; }
