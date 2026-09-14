import MasterPartnerAdminView from '@/components/partner/MasterPartnerAdminView';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function PartnerAdminDashboardPage() {
  return (
    <div className="space-y-4 p-4">
      <DashboardCommunicationWidget role="B2B_SUPER_ADMIN" unreadCount={5} slaOverdueCount={2} />
      <MasterPartnerAdminView currentPath="/partner-admin/dashboard" />
    </div>
  );
}
