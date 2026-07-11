"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "wg-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const save = (value: "accepted" | "declined") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Cookie consent"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-xl sm:inset-x-6"
        >
          <p className="text-sm leading-relaxed text-[#4A4A4A]">
            We use cookies to improve your experience and analyze site traffic. By continuing, you
            agree to our use of cookies.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => save("declined")}
              className="rounded-full border border-[#E5E5E5] px-5 py-2.5 text-sm font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F2EF]"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => save("accepted")}
              className="rounded-full bg-[#C41E3A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A01830]"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
