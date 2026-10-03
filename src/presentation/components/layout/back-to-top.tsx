"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { HiOutlineArrowUp } from "react-icons/hi2";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Voltar ao topo"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          onClick={() => lenis?.scrollTo(0, { duration: 1.4 })}
          className="fixed bottom-6 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/30 transition-shadow hover:shadow-xl hover:shadow-brand-600/40 sm:bottom-8 sm:right-8"
        >
          <HiOutlineArrowUp className="size-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
