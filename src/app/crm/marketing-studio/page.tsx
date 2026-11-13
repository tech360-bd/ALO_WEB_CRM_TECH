import { MarketingCommandCenterCompat } from '@/components/marketing/marketing-command-center-compat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketing Studio | ALO Education' };

export default function MarketingStudioPage() {
  return <MarketingCommandCenterCompat view="studio" />;
}
