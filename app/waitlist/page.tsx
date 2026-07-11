import { Suspense } from "react";
import WaitlistClient from "./WaitlistClient";

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F8F7F4]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C41E3A] border-t-transparent" />
        </div>
      }
    >
      <WaitlistClient />
    </Suspense>
  );
}
