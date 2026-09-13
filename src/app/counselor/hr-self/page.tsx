'use client';
import dynamic from 'next/dynamic';
const HR = dynamic(() => import('@/components/alo/views/enterprise-hr-dashboard'), { ssr: false });
export default function Page() { return <div><div className="p-4 bg-yellow-50 border-b">Privacy Mode ON: Salary/commission/bonus/increment hidden unless authorized. Passport/refusal blur + PIN/OTP reveal + audit.</div><HR /></div>; }
