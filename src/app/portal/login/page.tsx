'use client';

import PortalSelector from '@/components/portals/PortalSelector';

export default function PortalLoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      <main className="flex-1">
        <PortalSelector />
      </main>
    </div>
  );
}
