'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export default function DataSourcesRoute() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--alo-text)]">Official Data Sources Directory</h1>
      <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl text-xs space-y-2">
        <p className="font-semibold text-[var(--alo-body)]">Official University Sources & Content Hash Provenance</p>
        <p className="text-[var(--alo-text-muted)]">Every public university and course fact stores source_name, source_url, content_hash, and last_verified_at timestamp.</p>
      </Card>
    </div>
  );
}
