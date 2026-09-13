'use client';
import ApplicationTable from '@/components/application-manager/ApplicationTable';
export default function Page() {
  return <ApplicationTable initialSource="DIRECT_ALO_APPLICATION" title="Direct ALO Applications" description="Direct channel — ALO Education self-sourced leads" showB2B={false} />;
}
