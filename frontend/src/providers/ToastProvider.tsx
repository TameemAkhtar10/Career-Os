"use client";

import React from "react";
import { Toaster } from "sonner";

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          "!bg-cream !text-body !border !border-border !shadow-emerald-md !rounded-ui !font-sans !p-4",
        duration: 4000,
        style: {
          background: "#FFF8EC",
          color: "#2D3748",
          borderColor: "#E8D3AA",
        },
      }}
      richColors
    />
  );
};

