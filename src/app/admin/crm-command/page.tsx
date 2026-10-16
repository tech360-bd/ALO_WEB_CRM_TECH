import { SuperAdminCrmCommandCenter } from "@/components/admin/SuperAdminCrmCommandCenter";

export const metadata = {
  title: "CRM Command Center — Super Admin",
  description: "Full operations for every CRM module. Perform any agent task as Super Admin — lead assignment, application pipeline, doc verification, visa case, finance, marketing, HR, partners, data, comms, reports. Audit logged, RBAC, mobile PWA ready.",
};

export default function CrmCommandPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <SuperAdminCrmCommandCenter />
      </div>
    </div>
  );
}
