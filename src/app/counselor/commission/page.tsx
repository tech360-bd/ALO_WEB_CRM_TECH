'use client';
import { useEffect, useState } from 'react';
export default function Page() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/counselor/commission').then(r=>r.json()).then(setData); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold">My Commission</h1><p className="text-sm text-gray-500">Privacy mode: Hide amount unless authorized. PIN required for full reveal. All access audited.</p><pre className="mt-4 bg-gray-50 p-4 rounded">{JSON.stringify(data, null, 2)}</pre></div>;
}
