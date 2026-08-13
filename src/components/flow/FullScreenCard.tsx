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
    // min-h-dvh (not h-dvh) + `my-auto` on the child (not `items-center`
    // here) — centering via items-center on a scrollable flex container
    // clips the top of any child taller than the viewport (the child gets
    // centered first, then only the bottom half's overflow is reachable by
    // scrolling). Long survey content needs the top to stay reachable, so
    // we center via auto margins instead, which degrade gracefully to
    // normal top-to-bottom scrolling once content overflows.
    <div className="flex min-h-dvh w-full justify-center overflow-y-auto bg-muted/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "my-auto w-full max-w-xl rounded-2xl border bg-background p-8 shadow-sm sm:p-10",
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}
