'use client';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

type Keyword = {id:string;keyword:string;country:string|null;searchVolume:number;difficulty:number;priority:string;intent:string};
type Health = {verification:string;sitemap:{moduleImportable:boolean};robots:{moduleImportable:boolean};ga4:{configured:boolean};searchConsole:{configured:boolean}};
/** Existing SEO API workbench. Stored/manual data is never represented as a live rank or crawl. */
export default function SeoEvidencePanel({mode}:{mode:'keywords'|'technical'}) {
 const [query,setQuery]=useState('');const [rows,setRows]=useState<Keyword[]>([]);const [health,setHealth]=useState<Health|null>(null);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [loaded,setLoaded]=useState(false);
 const [keyword,setKeyword]=useState('');const [metrics,setMetrics]=useState('');const [notice,setNotice]=useState('');const [revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setBusy(true);setError('');setLoaded(false);setRows([]);setHealth(null);
  void(async()=>{
   try {
    const response=await fetch(mode==='keywords'?`/api/seo/keywords?q=${encodeURIComponent(query)}&limit=50`:'/api/seo/health',{credentials:'same-origin',signal:controller.signal});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'SEO data unavailable.');
    if(mode==='keywords'){if(!Array.isArray(data.items))throw new Error('Invalid keyword response.');setRows(data.items);}
    else {if(data.verification!=='configuration_only_not_authenticated_or_operational')throw new Error('Unrecognized health evidence.');setHealth(data);}
    setLoaded(true);
   }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'SEO data unavailable.');}
   finally{if(!controller.signal.aborted)setBusy(false);}
  })();return()=>controller.abort();
 },[mode,query,revision]);
 async function submit(path:string,body:unknown){
  setBusy(true);setError('');setNotice('');
  try{const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'SEO request failed.');setNotice(mode==='keywords'?'Keyword saved without inventing measurements.':`Supplied-metric analysis created ${data.opportunitiesCreated} opportunities; ${data.skipped} rows skipped. Not a live Search Console fetch.`);if(mode==='keywords'){setKeyword('');setRevision(v=>v+1);}}
  catch(cause){setError(cause instanceof Error?cause.message:'SEO request failed.');}finally{setBusy(false);}
 }
 return <section aria-label={mode==='keywords'?'SEO stored keywords':'SEO configuration and supplied metrics'} className="space-y-4 rounded-xl border bg-white p-6">
  <h1 className="text-2xl font-bold">{mode==='keywords'?'SEO Keyword Research & Tracking':'SEO Technical Evidence'}</h1>
  <p className="text-sm text-[var(--alo-body)]">{mode==='keywords'?'Stored records only. Volume and difficulty may be manually supplied or legacy defaults. Live rankings, competitor analysis and provider authentication are not verified.':'Configuration checks only—not a site crawl, health score, indexation report or measured Core Web Vitals. No fabricated score is displayed.'}</p>
  <Button variant="outline" disabled={busy} onClick={()=>setRevision(v=>v+1)}>Refresh SEO evidence</Button>
  {mode==='keywords'&&<label className="block">Search stored keywords<Input aria-label="Search stored keywords" maxLength={191} value={query} onChange={e=>setQuery(e.target.value)}/></label>}
  {error&&<p role="alert" className="text-crm-danger-text">{error}</p>}{busy&&<p role="status">Loading SEO evidence…</p>}{notice&&<p role="status">{notice}</p>}
  {mode==='keywords'&&loaded&&!busy&&(rows.length?<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Keyword','Country','Stored volume','Stored difficulty','Intent','Priority'].map(v=><th key={v} className="p-2">{v}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td className="p-2">{row.keyword}</td><td>{row.country||'Unspecified'}</td><td>{row.searchVolume}</td><td>{row.difficulty}</td><td>{row.intent}</td><td>{row.priority}</td></tr>)}</tbody></table></div>:<p>No stored keywords match this search.</p>)}
  {mode==='technical'&&health&&<ul className="space-y-2 text-sm"><li>Sitemap module: {health.sitemap.moduleImportable?'importable':'unavailable'}; public response not checked.</li><li>Robots module: {health.robots.moduleImportable?'importable':'unavailable'}; directives not checked.</li><li>GA4: {health.ga4.configured?'configured':'not configured'}; event collection not verified.</li><li>Search Console: {health.searchConsole.configured?'configured':'not configured'}; OAuth grant, property access and live metrics not verified.</li></ul>}
  {mode==='keywords'?<form className="space-y-2 border-t pt-4" onSubmit={e=>{e.preventDefault();void submit('/api/seo/keywords',{keyword:keyword.trim()});}}><label>Add keyword<Input aria-label="New stored keyword" required maxLength={191} value={keyword} onChange={e=>setKeyword(e.target.value)}/></label><Button disabled={busy||!keyword.trim()}>Save keyword</Button><p className="text-xs">This saves a research record, not a measured ranking. Existing metrics are preserved.</p></form>:<form className="space-y-2 border-t pt-4" onSubmit={e=>{e.preventDefault();try{const parsed=JSON.parse(metrics);void submit('/api/seo/opportunities',{metrics:parsed});}catch{setError('Supply a valid JSON array of metric rows.');}}}><label className="block">Analyze supplied Search Console metrics<textarea aria-label="Supplied SEO metrics JSON" className="block min-h-32 w-full rounded border p-2 font-mono text-xs" maxLength={200000} required value={metrics} onChange={e=>setMetrics(e.target.value)} placeholder={'[{"query":"your verified query","impressions":100,"clicks":5,"position":8}]'}/></label><Button disabled={busy||!metrics.trim()}>Analyze supplied metrics</Button><p className="text-xs">Use authorized data only. Analysis saves opportunities; it does not fetch or authenticate Search Console.</p></form>}
 </section>;
}
