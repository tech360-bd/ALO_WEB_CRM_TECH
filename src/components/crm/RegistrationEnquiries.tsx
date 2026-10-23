'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Enquiry { id:string; leadId:string; fullName:string; source:string; status:string; counselorId:string|null; createdAt:string }
/** Separate Lead queue; never infer identities or merge with MarketingLead. */
export default function RegistrationEnquiries() {
  const [rows,setRows]=useState<Enquiry[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState('');
  const sequence=useRef(0);
  const load=useCallback(async()=>{
    const current=++sequence.current;
    setLoading(true);setError('');setRows([]);
    try {
      const response=await fetch(`/api/leads${status ? `?status=${encodeURIComponent(status)}` : ''}`,{credentials:'same-origin'});
      const data=await response.json();
      if(!response.ok || !Array.isArray(data.leads)) throw new Error(data.error || 'Enquiries unavailable.');
      if(current===sequence.current) setRows(data.leads);
    } catch(caught) { if(current===sequence.current) setError(caught instanceof Error ? caught.message : 'Enquiries unavailable.'); }
    finally { if(current===sequence.current) setLoading(false); }
  },[status]);
  useEffect(()=>{void load();return()=>{sequence.current++;};},[load]);
  return <section aria-label="Assigned registration enquiries" className="my-6 rounded-xl border bg-white p-4">
    <h2 className="text-lg font-semibold">Registration & website enquiries</h2>
    <p className="my-2 text-sm text-[var(--alo-body)]">Separate from manually created marketing leads. Verified User counselors see their own assigned enquiries; User administrators see all, including unassigned. Showing up to 200 latest records.</p>
    <div className="mb-3 flex gap-3"><label>Status <select aria-label="Enquiry status" className="rounded border p-2" value={status} onChange={e=>setStatus(e.target.value)}>{['','NEW','CONTACTED','QUALIFIED','CONVERTED','LOST','DUPLICATE'].map(s=><option key={s} value={s}>{s || 'All statuses'}</option>)}</select></label><Button variant="outline" onClick={()=>void load()} disabled={loading}>Refresh enquiries</Button></div>
    {error ? <p role="alert" className="text-red-700">{error}</p> : loading ? <p role="status">Loading enquiries…</p> : !rows.length ? <p>No enquiries visible in this scope.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Name','Source','Status','Assignment','Received'].map(label=><th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t"><td className="p-2">{row.fullName}</td><td className="p-2">{row.source}</td><td className="p-2">{row.status}</td><td className="p-2">{row.counselorId ? 'Assigned' : 'Awaiting assignment'}</td><td className="p-2">{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
  </section>;
}
