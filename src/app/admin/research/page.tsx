import type { Metadata } from 'next';
import ResearchCenter from '@/components/admin/ResearchCenter';

export const metadata: Metadata = {
  title: 'Research Center | ALO Education Admin',
  description: 'Monitor official university sources, resolve data conflicts and review course intelligence updates.',
};

export default function AdminResearchPage() {
  return <ResearchCenter />;
}
