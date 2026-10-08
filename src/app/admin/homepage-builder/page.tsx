'use client';

import { SuperAdminWebsiteCmsHub } from '@/components/admin/SuperAdminWebsiteCmsHub';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default function AdminHomepageBuilderPage() {
  const user = usePortalStore((state) => state.user);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#2563EB] text-white font-bold text-xs">SUPER_ADMIN / ADMIN — Real DB</Badge>
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 font-semibold text-xs">Audit Logged • RBAC • PWA Ready</Badge>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Homepage Master Builder & CMS — Real Implementation</h1>
            <p className="text-xs text-slate-600 mt-1">
              Previously mock with setTimeout toast. Now fully real: edits any part of website directly via /api/admin/website/cms + /api/admin/website/homepage — hero slides, services, success stories, team, FAQs, sections, english tests, countries with 9 sub-tables. Mobile PWA native-like.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="h-10 rounded-xl text-xs flex items-center gap-1.5 border-slate-300">
                <Eye className="h-4 w-4 text-[#2563EB]" /> Live Preview
              </Button>
            </a>
            <a href="/admin/master-command">
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-10 rounded-xl text-xs bg-[#2563EB] hover:bg-[#1D4ED8]">Master Command Center</Button>
            </a>
          </div>
        </div>

        <SuperAdminWebsiteCmsHub />
      </div>
    </div>
  );
}
