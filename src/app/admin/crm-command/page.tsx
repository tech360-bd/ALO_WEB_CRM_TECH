import { SuperAdminCrmCommandCenter } from "@/components/admin/SuperAdminCrmCommandCenter";

export const metadata = {
  title: "CRM Command Center — Super Admin",
  description: "Live CRM overview with supported quick actions and links to the existing permission-checked module workspaces.",
};

export default function CrmCommandPage() {
  return (
    <div className="min-h-screen bg-[var(--alo-page)] p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <SuperAdminCrmCommandCenter />
      </div>
    </div>
  );
}
