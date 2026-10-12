import { redirect } from 'next/navigation';

// Simulated mock-test sessions were removed. English tests are taken on the
// English Test Platform; the portal entry point is /student/mock-tests.
export default function RetiredMockTestRoute() {
  redirect('/student/mock-tests');
}
