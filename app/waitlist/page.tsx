import { Suspense } from "react";
import WaitlistClient from "./WaitlistClient";

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      }
    >
      <WaitlistClient />
    </Suspense>
  );
}
