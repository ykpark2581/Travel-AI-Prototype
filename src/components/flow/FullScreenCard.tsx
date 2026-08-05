"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FullScreenCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-y-auto bg-muted/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "w-full max-w-xl rounded-2xl border bg-background p-8 shadow-sm sm:p-10",
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}
