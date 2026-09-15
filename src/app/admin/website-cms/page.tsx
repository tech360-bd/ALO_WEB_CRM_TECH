import { SuperAdminWebsiteCmsHub } from "@/components/admin/SuperAdminWebsiteCmsHub";

export const metadata = {
  title: "Website CMS Hub — Super Admin",
  description: "Edit any part of website directly — hero slides, services, success stories, team, FAQs, sections, english tests, countries with sub-data. Real DB, audit logged, mobile PWA ready.",
};

export default function WebsiteCmsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <SuperAdminWebsiteCmsHub />
      </div>
    </div>
  );
}
