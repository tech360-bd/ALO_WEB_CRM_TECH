import { MarketingCommandCenterCompat } from '@/components/marketing/marketing-command-center-compat';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content Calendar | ALO Education' };

export default function ContentCalendarPage() {
  return <MarketingCommandCenterCompat view="calendar" />;
}
