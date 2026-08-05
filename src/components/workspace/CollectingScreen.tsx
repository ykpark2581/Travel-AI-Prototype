"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { collectionSites } from "@/data/dialogue";
import { useExperimentStore } from "@/lib/store";
import { useCardRegistry } from "@/components/workspace/CardRegistryContext";
import { cn } from "@/lib/utils";

export function CollectingScreen() {
  const currentSite = useExperimentStore((s) => s.collecting.currentSite);
  const { register } = useCardRegistry();

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <motion.div
        animate={{ rotate: currentSite ? 360 : 0 }}
        transition={{ duration: 1.4, repeat: currentSite ? Infinity : 0, ease: "linear" }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Compass className="h-5 w-5" />
      </motion.div>

      {/* Each badge registers itself so the ghost cursor can "click" its way
          across the tabs — the speech bubble that follows it carries the
          status text now, instead of a static line pinned below. */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {collectionSites.map((site) => (
          <span
            key={site}
            ref={(el) => register(site, el)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              site === currentSite
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {site}
          </span>
        ))}
      </div>
    </div>
  );
}
