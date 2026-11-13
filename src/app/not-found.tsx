import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/state-panel";

/** Global empty / not-found state — same surface language as the CRM. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-alo-page p-4">
      <div className="w-full max-w-lg">
        <StatePanel
          tone="info"
          icon={<span className="font-heading text-2xl font-bold">404</span>}
          title="Page Not Found"
          description="The page you're looking for doesn't exist or has been moved."
          actions={
            <Button asChild className="bg-alo-brand text-white hover:bg-alo-brand-hover">
              <Link href="/">Back to Home</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
