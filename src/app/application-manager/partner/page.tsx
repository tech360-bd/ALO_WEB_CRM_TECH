'use client';
import ApplicationTable from '@/components/application-manager/ApplicationTable';
export default function Page() {
  return <ApplicationTable initialSource="PARTNER_APPLICATION" title="Partner Applications" description="Partner channel — partner portal submissions" showB2B={false} />;
}
