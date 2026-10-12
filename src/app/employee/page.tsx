'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeRootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('employee_token') : null;
    if (token) {
      router.replace('/employee/dashboard');
    } else {
      router.replace('/employee/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
    </div>
  );
}
