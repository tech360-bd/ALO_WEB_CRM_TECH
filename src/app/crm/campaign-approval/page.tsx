import { MarketingCommandCenterCompat } from '@/components/marketing/marketing-command-center-compat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaign Approval | ALO Education' };

export default function CampaignApprovalPage() {
  return <MarketingCommandCenterCompat view="approvals" />;
}
