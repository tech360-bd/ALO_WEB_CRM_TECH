'use client';
import { useEffect, useState } from 'react';
export default function Page() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/counselor/attendance').then(r=>r.json()).then(setData); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold">My Attendance (HR Self-Service)</h1><p className="text-sm text-gray-500">Privacy: Own records only. PIN/OTP reveal for sensitive data, audit logged.</p><pre className="mt-4 bg-gray-50 p-4 rounded">{JSON.stringify(data, null, 2)}</pre></div>;
}
