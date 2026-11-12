"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section";
  children: ReactNode;
};

/**
 * Subtle scroll reveal. Disabled automatically under prefers-reduced-motion.
 */
export function Reveal({
  as = "div",
  className,
  children,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      node.dataset.animate = "false";
      return;
    }

    node.dataset.animate = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = ["wg-reveal", className].filter(Boolean).join(" ");

  if (as === "section") {
    return (
      <section ref={ref} className={classes} {...props}>
        {children}
      </section>
    );
  }

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
}
