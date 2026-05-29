"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { supertokensEnabled } from "../../lib/auth/config";

type Props = {
  children: ReactNode;
};

export default function WorkGraphProviders({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (!supertokensEnabled()) return;
    void import("../../lib/supertokens/frontend").then(({ initSuperTokensFrontend }) => {
      initSuperTokensFrontend();
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
