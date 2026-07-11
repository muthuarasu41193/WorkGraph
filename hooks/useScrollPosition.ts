"use client";

import { useEffect, useState } from "react";

type UseScrollPositionOptions = {
  threshold?: number;
};

export function useScrollPosition({ threshold = 10 }: UseScrollPositionOptions = {}) {
  const [scrollY, setScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { scrollY, scrolled };
}
