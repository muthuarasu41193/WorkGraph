import type { ReactNode } from "react";

/** The shell stays mounted. A fade that waits for exit blanks the next page. */
export function PageTransition({ children }: { children: ReactNode }) {
  return children;
}
