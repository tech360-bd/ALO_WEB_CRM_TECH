'use client';
import { useEffect, useState } from 'react';
export default function Page() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/counselor/bonus').then(r=>r.json()).then(setData); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold">My Bonus</h1><pre className="mt-4 bg-[var(--alo-page)] p-4 rounded">{JSON.stringify(data, null, 2)}</pre></div>;
}
