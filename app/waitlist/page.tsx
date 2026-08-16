import { Suspense } from "react";
import WaitlistClient from "./WaitlistClient";

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <div className="mx-auto w-full max-w-md space-y-4 p-8">
            <div className="mx-auto h-8 w-48 rounded-lg wg-skeleton-shimmer" />
            <div className="h-40 w-full rounded-xl wg-skeleton-shimmer" />
            <div className="h-10 w-full rounded-lg wg-skeleton-shimmer" />
          </div>
        </div>
      }
    >
      <WaitlistClient />
    </Suspense>
  );
}
