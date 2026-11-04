"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

