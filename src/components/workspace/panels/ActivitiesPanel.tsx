"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ActivityCard } from "@/components/cards/ActivityCard";
import { PanelSkeleton } from "@/components/workspace/panels/PanelSkeleton";
import { FilterBar } from "@/components/workspace/FilterBar";
import { CollectingScreen } from "@/components/workspace/CollectingScreen";
import { useExperimentStore } from "@/lib/store";
import { staggerContainer } from "@/lib/motion";
import { useSearchQueryLogger } from "@/lib/useSearchQueryLogger";
import type { ActivityCategory } from "@/types";

// Identical for human-led and mixed-led — candidates appear the same way
// (after the site-visiting collection screen, see CollectingScreen), no
// upfront question, no AI-recommendation badges during browsing. What each
// condition does with the resulting likes/browsing signals differs
// entirely in store.ts (manual "다음으로" button vs. an automatic analysis
// timer), not in what this catalog looks like. AI-led never mounts this
// panel at all — PrototypeShell hides the whole workspace column for its
// activities/restaurants (see showWorkspace), since it never has a
// browsable catalog to show.
export function ActivitiesPanel({ loading }: { loading: boolean }) {
  const activities = useExperimentStore((s) => s.destinationBundle.activities);
  const recordFilterUsed = useExperimentStore((s) => s.recordFilterUsed);
  const collecting = useExperimentStore((s) => s.collecting);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | null>(null);

  const isCollecting = collecting.active && collecting.stage === "activities";

  useSearchQueryLogger("activities", search, true);

  const handleCategoryChange = (category: ActivityCategory | null) => {
    setActiveCategory(category);
    if (category) recordFilterUsed("activities", category);
  };

  const categories = useMemo(() => Array.from(new Set(activities.map((a) => a.category))), [activities]);

  const filtered = useMemo(
    () =>
      activities.filter(
        (a) =>
          (!activeCategory || a.category === activeCategory) &&
          (search.trim() === "" || a.name.includes(search) || a.description.includes(search))
      ),
    [activities, activeCategory, search]
  );

  if (isCollecting) {
    return <CollectingScreen />;
  }

  return (
    <div className="space-y-4">
      <FilterBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={(category) => handleCategoryChange(category as ActivityCategory | null)}
        search={search}
        onSearchChange={setSearch}
        placeholder="액티비티 검색"
      />
      {loading ? (
        <PanelSkeleton count={6} />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
