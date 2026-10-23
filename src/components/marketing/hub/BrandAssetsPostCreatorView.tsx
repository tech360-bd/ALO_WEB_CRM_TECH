'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Palette, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingKitPanel from '@/components/marketing/MarketingKitPanel';

type Asset = { id: string; name: string; assetType: string };
/** Live asset inventory + working local creative library, not simulated posts,
 * likes, approvals, scheduling, AI generation or fabricated contact details.
 */
export default function BrandAssetsPostCreatorView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const load = async (signal?: AbortSignal) => {
    setStatus('loading'); setError('');
    try {
      const response = await fetch('/api/marketing/brand-assets', { signal });
      if (!response.ok) throw new Error(response.status === 403 ? 'You do not have permission to view stored brand assets.' : 'Stored brand assets could not be loaded.');
      const json = await response.json();
      if (!Array.isArray(json.assets)) throw new Error('Invalid brand asset response.');
      setAssets(json.assets.filter((asset: Asset) => typeof asset?.id === 'string' && typeof asset.name === 'string' && typeof asset.assetType === 'string'));
      setStatus('ready');
    } catch (cause) {
      if (signal?.aborted) return;
      setAssets([]); setStatus('error'); setError(cause instanceof Error ? cause.message : 'Asset inventory unavailable.');
    }
  };
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);
  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Palette aria-hidden="true" className="h-7 w-7 text-[var(--alo-cta-active)]" />Brand Assets & Post Creator</h1>
      <p className="mt-2 text-sm text-[var(--alo-body)]">Create original ALO campaign drafts and download real visual assets. No automatic AI, approval, scheduling or publishing is performed here.</p>
    </header>
    <section aria-labelledby="brand-assets-title" aria-busy={status === 'loading'} className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="brand-assets-title" className="font-semibold">Stored brand asset inventory</h2>
        <Button type="button" size="sm" variant="outline" disabled={status === 'loading'} onClick={() => void load()}><RefreshCw aria-hidden="true" className="h-4 w-4" />Refresh assets</Button>
      </div>
      {status === 'loading' ? <p role="status" className="mt-3 text-sm text-[var(--alo-text-muted)]">Loading stored assets…</p>
        : status === 'error' ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>
          : assets.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{assets.map((asset) => <li key={asset.id} className="rounded-lg border p-3 text-sm"><span className="font-medium">{asset.name}</span><span className="ml-2 text-xs text-[var(--alo-text-muted)]">{asset.assetType}</span></li>)}</ul>
            : <p className="mt-3 text-sm text-[var(--alo-text-muted)]">No active brand assets are stored yet. Draft layouts use ALO typography and colors, not an invented logo or phone number.</p>}
      <p className="mt-3 text-xs text-[var(--alo-text-muted)]">Stored assets are not automatically imprinted into these local templates. Verify logos, contact details and destination links before publishing.</p>
      <Link href="/admin/marketing-automation" className="mt-2 inline-block text-sm font-medium text-[var(--alo-brand)] underline focus-visible:outline-2">Manage brand settings and provider readiness</Link>
    </section>
    <Link href="/crm/diagram-studio" className="inline-block text-sm font-medium text-[var(--alo-brand)] underline">Open Diagram Studio — five types, SVG, PNG and clipboard</Link>
    <MarketingKitPanel />
  </div>;
}
