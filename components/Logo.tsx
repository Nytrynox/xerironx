"use client";
import { motion } from "framer-motion";

export function Logo({ size = 32 }: { size?: number }) {
  const s = size;
  return (
    <div className="inline-block" aria-label="Xerironx logo">
      <svg viewBox="0 0 64 64" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.g
          initial={{ rotate: -12, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
          filter="url(#glow)"
        >
          <motion.path
            d="M8 48 L28 16 L36 28 L56 16 L36 48 L28 36 Z"
            fill="url(#g1)"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </motion.g>
      </svg>
  </div>
  );
}
