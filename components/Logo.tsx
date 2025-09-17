"use client";
import { motion } from "framer-motion";
import React from "react";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="inline-flex items-center justify-center shrink-0" aria-label="Xerironx logo">
      <motion.div
        initial={{ rotate: -12, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Lottie company logo */}
         <dotlottie-wc
           src="https://lottie.host/6f6a6621-ebbd-4b2a-af59-e61878e004a4/2fF2WRaDUZ.lottie"
           className="lottie-logo"
           speed="1"
           autoplay
           loop
         />
      </motion.div>
    </div>
  );
}
