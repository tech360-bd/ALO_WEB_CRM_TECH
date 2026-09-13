'use client';
import ApplicationTable from '@/components/application-manager/ApplicationTable';
export default function Page() {
  return <ApplicationTable title="All Applications Master Pipeline" description="Central registry across Direct, Partner, B2B Inbound/Outbound, University Direct, Manual Import, Referral, Event, Course Finder" showB2B={true} />;
}
