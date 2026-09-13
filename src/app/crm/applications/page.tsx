'use client';
import ApplicationTable from '@/components/application-manager/ApplicationTable';
export default function Page() {
  return <ApplicationTable title="CRM — All Applications" description="CRM alias — /crm/applications with same backend security" showB2B={true} />;
}
