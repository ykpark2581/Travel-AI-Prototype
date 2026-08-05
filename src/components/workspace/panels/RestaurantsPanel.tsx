"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RestaurantCard } from "@/components/cards/RestaurantCard";
import { PanelSkeleton } from "@/components/workspace/panels/PanelSkeleton";
import { FilterBar } from "@/components/workspace/FilterBar";
import { CollectingScreen } from "@/components/workspace/CollectingScreen";
import { useExperimentStore } from "@/lib/store";
import { staggerContainer } from "@/lib/motion";
import { useSearchQueryLogger } from "@/lib/useSearchQueryLogger";
import type { RestaurantCategory } from "@/types";

// Identical for human-led and mixed-led — see ActivitiesPanel.tsx's comment
// for why (this is its restaurant-catalog mirror). AI-led never mounts this
// panel at all — PrototypeShell hides the whole workspace column for its
// activities/restaurants (see showWorkspace).
export function RestaurantsPanel({ loading }: { loading: boolean }) {
  const restaurants = useExperimentStore((s) => s.destinationBundle.restaurants);
  const recordFilterUsed = useExperimentStore((s) => s.recordFilterUsed);
  const collecting = useExperimentStore((s) => s.collecting);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RestaurantCategory | null>(null);

  const isCollecting = collecting.active && collecting.stage === "restaurants";

  useSearchQueryLogger("restaurants", search, true);

  const handleCategoryChange = (category: RestaurantCategory | null) => {
    setActiveCategory(category);
    if (category) recordFilterUsed("restaurants", category);
  };

  const categories = useMemo(() => Array.from(new Set(restaurants.map((r) => r.category))), [restaurants]);

  const filtered = useMemo(
    () =>
      restaurants.filter(
        (r) =>
          (!activeCategory || r.category === activeCategory) &&
          (search.trim() === "" || r.name.includes(search) || r.cuisine.includes(search))
      ),
    [restaurants, activeCategory, search]
  );

  if (isCollecting) {
    return <CollectingScreen />;
  }

  return (
    <div className="space-y-4">
      <FilterBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={(category) => handleCategoryChange(category as RestaurantCategory | null)}
        search={search}
        onSearchChange={setSearch}
        placeholder="식당 검색"
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
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
