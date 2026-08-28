"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Loader2, UtensilsCrossed } from "lucide-react";
import { ActivityCard } from "@/components/cards/ActivityCard";
import { RestaurantCard } from "@/components/cards/RestaurantCard";
import { PanelSkeleton } from "@/components/workspace/panels/PanelSkeleton";
import { FilterBar } from "@/components/workspace/FilterBar";
import { AutoplayCursor } from "@/components/workspace/AutoplayCursor";
import { useExperimentStore } from "@/lib/store";
import { staggerContainer } from "@/lib/motion";
import { useSearchQueryLogger } from "@/lib/useSearchQueryLogger";
import { cn } from "@/lib/utils";
import { animateScrollTop } from "@/lib/aiAutoplay";
import { AUTOPLAY_SKIM_STAGE_MS, AUTOPLAY_SKIM_STAGE_PAUSE_MS, AUTOPLAY_SKIM_RETURN_MS } from "@/lib/constants";
import * as dialogue from "@/data/dialogue";
import type { ExplorationStage } from "@/types";

// Human-led, Mixed-led, and AI-led's shared activities/restaurants
// catalog — replaces the old separate ActivitiesPanel/RestaurantsPanel
// entirely, and (as of AI-led's autoplay rework — see lib/store.ts's
// confirmStyleQuestion) also replaces AI-led's old chat-only "never shows a
// catalog at all" behavior. Split only by an in-panel tab, never a
// separate stage. Which tab is showing lives entirely in the store now
// (see exploreTab) — human-led/mixed-led switch it via a workspace click
// OR the chat's own "액티비티 완료" button (see lib/store.ts's
// confirmActivityStage), AI-led's autoplay drives it directly, no local
// tab state here at all anymore. Both human-led's and mixed-led's 식당 tab
// are also genuinely disabled (not just unclicked) until that button is
// pressed (see restaurantTabLocked below) — human-led re-checks this fresh
// every one of its 4 days, mixed-led only once. Condition differences
// otherwise live in the cards themselves (see ActivityCard/RestaurantCard's
// showSelectButton/showInterestButtons — human-led picks day by day,
// mixed-led marks 👍/👎) and whether the whole panel is interactive at
// all (isAiAutoplay below strips out FilterBar, tab clicks, and every card
// action for AI-led — see its own comment). The "move on" action
// (Mixed-led's "식당 완료", Human-led's day-by-day "식당 완료") always
// lives in chat instead (see components/chat/MixedExploreDoneMessage.tsx /
// DaySelectionMessage.tsx) — the workspace never carries a task-advancing
// button itself; AI-led has no such button at all, it advances on its own
// once runAiAutoplay finishes.
export function ExplorePanel({ loading }: { loading: boolean }) {
  const activities = useExperimentStore((s) => s.destinationBundle.activities);
  const restaurants = useExperimentStore((s) => s.destinationBundle.restaurants);
  const recordFilterUsed = useExperimentStore((s) => s.recordFilterUsed);
  const condition = useExperimentStore((s) => s.condition);
  const humanDayIndex = useExperimentStore((s) => s.humanDayIndex);
  const dayAssignment = useExperimentStore((s) => s.dayPlan[s.humanDayIndex]);
  const exploreTab = useExperimentStore((s) => s.exploreTab);
  const setExploreTab = useExperimentStore((s) => s.setExploreTab);
  const autoplayFocusedItemId = useExperimentStore((s) => s.autoplayFocusedItemId);
  const autoplayStatusText = useExperimentStore((s) => s.autoplayStatusText);
  const autoplaySkimming = useExperimentStore((s) => s.autoplaySkimming);
  const mixedRestaurantTabUnlocked = useExperimentStore((s) => s.mixedRestaurantTabUnlocked);
  // Human-led's own per-day equivalent of mixedRestaurantTabUnlocked — a
  // single persistent boolean like that one wouldn't work here, since
  // human-led re-runs this same 액티비티→식당 gate fresh on every one of
  // its 4 days (see confirmDaySelection), not just once. Reads straight off
  // the current day's chat prompt (see DaySelectionMessage.tsx, which
  // renders from this exact same field) rather than tracking a second copy
  // of it in a dedicated store field that would need its own reset every
  // time humanDayIndex advances.
  const humanActivityStageConfirmed = useExperimentStore(
    (s) => s.messages.find((m) => m.daySelection?.day === s.humanDayIndex)?.daySelection?.activityStageConfirmed ?? false
  );

  // AI-led only — the participant never drives this panel at all (see
  // runAiAutoplay); everything below that branches on this strips out
  // every click surface (tabs, search/filter, card actions) rather than
  // just visually de-emphasizing them, since "지켜만 볼 수 있음" means
  // exactly that.
  const isAiAutoplay = condition === "ai";
  // 식당 starts genuinely disabled (not just unclicked) for both human-led
  // and mixed-led until "액티비티 완료" is pressed — otherwise either
  // could jump straight to picking restaurants (or, for human-led, a later
  // day's restaurants) without ever having chosen an activity, which the
  // chat's own two-stage button was supposed to prevent but the workspace
  // tab click alone bypassed entirely.
  const restaurantTabLocked =
    (condition === "mixed" && !mixedRestaurantTabUnlocked) || (condition === "human" && !humanActivityStageConfirmed);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useSearchQueryLogger(exploreTab, search, !isAiAutoplay);

  // Keeps whichever card the autoplay just focused actually on screen —
  // without this, a 40-item catalog would leave most sweep steps focusing
  // a card the participant can't even see without scrolling themselves,
  // which they can't do meaningfully here anyway (see isAiAutoplay).
  useEffect(() => {
    if (!isAiAutoplay || !autoplayFocusedItemId) return;
    document.getElementById(`explore-card-${autoplayFocusedItemId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [isAiAutoplay, autoplayFocusedItemId]);

  // Each category's opening skim beat (see lib/store.ts's runAiAutoplay,
  // which flips autoplaySkimming true/false on a fixed AUTOPLAY_SKIM_MS
  // timer — the sum of exactly the stage/pause/return durations used
  // below, so the two stay in lockstep) — visibly scrolls the whole panel
  // down in three discrete stages (1/3, 2/3, all the way, pausing at each)
  // rather than one continuous sweep, then back up to the top in a single
  // motion. Reads as "generally looking around this list" — pausing to
  // actually look partway down, not just scrolling through — before any
  // one card gets singled out. Uses animateScrollTop's rAF tween rather
  // than native `scrollTo({behavior:"smooth"})` for each stage — the
  // native version has no fixed duration, so consecutive stages could
  // easily drift out of sync with the pauses/timer driving them.
  useEffect(() => {
    if (!isAiAutoplay || !autoplaySkimming) return;
    const container = document.getElementById("explore-scroll-container");
    if (!container) return;
    let cancelled = false;
    (async () => {
      const bottom = container.scrollHeight - container.clientHeight;
      if (bottom <= 0) return;
      for (const fraction of [1 / 3, 2 / 3, 1]) {
        await animateScrollTop(container, bottom * fraction, AUTOPLAY_SKIM_STAGE_MS);
        if (cancelled) return;
        await new Promise((resolve) => setTimeout(resolve, AUTOPLAY_SKIM_STAGE_PAUSE_MS));
        if (cancelled) return;
      }
      await animateScrollTop(container, 0, AUTOPLAY_SKIM_RETURN_MS);
    })();
    return () => {
      cancelled = true;
    };
    // exploreTab (which category's grid is under the container right now)
    // isn't in the dep list, but doesn't need to be — store.ts sets
    // exploreTab and autoplaySkimming together in one `set()` call, so by
    // the time this effect re-fires on the next false→true skim
    // transition, React has already committed the new category's cards
    // underneath.
  }, [isAiAutoplay, autoplaySkimming]);

  // Human-led only — this panel stays mounted across every day (only
  // `humanDayIndex` changes, see confirmDaySelection, which also resets
  // exploreTab back to "activities" itself). search/activeCategory are
  // still local UI-only state though, so they need their own reset here —
  // without it, a leftover filter from the previous day would silently
  // hide cards on the new one. Adjusting state during render (React's
  // documented pattern for "reset state when a prop changes") rather than
  // a useEffect — avoids an extra render pass and the lint warning against
  // calling setState synchronously inside an effect body.
  const [prevHumanDayIndex, setPrevHumanDayIndex] = useState(humanDayIndex);
  if (condition === "human" && humanDayIndex !== prevHumanDayIndex) {
    setPrevHumanDayIndex(humanDayIndex);
    setSearch("");
    setActiveCategory(null);
  }

  // Search/category reset whenever the tab switches — a stray filter left
  // over from the other tab would otherwise silently hide everything.
  const handleTabChange = (next: ExplorationStage) => {
    setExploreTab(next);
    setSearch("");
    setActiveCategory(null);
  };

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    if (category) recordFilterUsed(exploreTab, category);
  };

  const activityCategories = useMemo(() => Array.from(new Set(activities.map((a) => a.category))), [activities]);
  const restaurantCategories = useMemo(() => Array.from(new Set(restaurants.map((r) => r.category))), [restaurants]);

  const filteredActivities = useMemo(
    () =>
      activities.filter(
        (a) =>
          (!activeCategory || a.category === activeCategory) &&
          (search.trim() === "" || a.name.includes(search) || a.description.includes(search))
      ),
    [activities, activeCategory, search]
  );
  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter(
        (r) =>
          (!activeCategory || r.category === activeCategory) &&
          (search.trim() === "" || r.name.includes(search) || r.cuisine.includes(search))
      ),
    [restaurants, activeCategory, search]
  );

  return (
    <div className="space-y-4">
      {/* position: fixed overlay — gates on condition === "ai" internally,
          safe to always mount here regardless of which condition this
          panel is currently rendering for. */}
      <AutoplayCursor />

      {condition === "human" && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          {humanDayIndex}일차 선택 중 · 액티비티 {dayAssignment?.activityIds.length ?? 0}/2 · 식당{" "}
          {dayAssignment?.restaurantIds.length ?? 0}/2 선택됨
        </div>
      )}

      {/* Active tab gets a solid primary fill (not just a faint white-on-
          gray pill) so which catalog is showing is unmistakable at a
          glance — participants were losing track of whether they were
          still looking at activities or had already moved to restaurants.
          AI-led's tabs still show which one is active the same way, they
          just don't respond to clicks — the sequence itself switches them
          (see exploreTab above). */}
      <div className="flex gap-1.5 rounded-full bg-muted p-1">
        <button
          type="button"
          disabled={isAiAutoplay}
          onClick={() => handleTabChange("activities")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all",
            exploreTab === "activities"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            isAiAutoplay && "cursor-default hover:text-muted-foreground"
          )}
        >
          <Compass className="h-4 w-4" />
          {dialogue.exploreActivitiesTabLabel}
        </button>
        <button
          type="button"
          disabled={isAiAutoplay || restaurantTabLocked}
          onClick={() => handleTabChange("restaurants")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all",
            exploreTab === "restaurants"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            isAiAutoplay && "cursor-default hover:text-muted-foreground",
            // Locked (pre-"액티비티 완료") reads as clearly unavailable but
            // not alarming — a lighter/washed-out label rather than a
            // stronger warning treatment, since this isn't an
            // error state, just "not yet."
            restaurantTabLocked && "cursor-not-allowed text-muted-foreground/40 hover:text-muted-foreground/40"
          )}
        >
          <UtensilsCrossed className="h-4 w-4" />
          {dialogue.exploreRestaurantsTabLabel}
        </button>
      </div>

      {/* AI-led's narration — but only during the skim beat (see
          autoplaySkimming), which has no specific card to attach the
          status to. Once the per-item sweep starts, the status instead
          rides along with the persistent cursor overlay (see
          AutoplayCursor, mounted below) — showing it in both places at once
          would just repeat the same line twice. Sits where FilterBar would
          for human/mixed, since AI-led has no search/filter at all (see
          isAiAutoplay). */}
      {isAiAutoplay ? (
        autoplaySkimming &&
        autoplayStatusText && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-foreground">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
            <span>{autoplayStatusText}</span>
          </div>
        )
      ) : (
        <FilterBar
          categories={exploreTab === "activities" ? activityCategories : restaurantCategories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          search={search}
          onSearchChange={setSearch}
          placeholder={exploreTab === "activities" ? "액티비티 검색" : "식당 검색"}
        />
      )}

      {loading ? (
        <PanelSkeleton count={6} />
      ) : (
        <motion.div
          key={exploreTab}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @xl:grid-cols-3"
        >
          {exploreTab === "activities"
            ? filteredActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
            : filteredRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
        </motion.div>
      )}
    </div>
  );
}
