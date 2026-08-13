"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Circle, Clock, Sparkles, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/lib/store";
import { useHoverTracking } from "@/lib/useHoverTracking";
import { MediaCover } from "@/components/cards/MediaCover";
import type { Activity } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function ActivityCard({
  activity,
  recommendationReason,
}: {
  activity: Activity;
  recommendationReason?: string;
}) {
  const humanDayIndex = useExperimentStore((s) => s.humanDayIndex);
  const dayPlan = useExperimentStore((s) => s.dayPlan);
  const selectedForDay = dayPlan[humanDayIndex]?.activityIds.includes(activity.id) ?? false;
  const toggleDayItem = useExperimentStore((s) => s.toggleDayItem);
  const interest = useExperimentStore((s) => s.interestActivity[activity.id]);
  const setInterest = useExperimentStore((s) => s.setInterest);
  const openDetail = useExperimentStore((s) => s.openDetail);
  const condition = useExperimentStore((s) => s.condition);
  const autoplayFocusedItemId = useExperimentStore((s) => s.autoplayFocusedItemId);
  const { onMouseEnter, onMouseLeave } = useHoverTracking("activities", activity.id, true);
  // Human-led picks candidates day by day (see lib/store.ts's
  // toggleDayItem/humanDayIndex) — a checkbox reflecting whether this item
  // is assigned to whichever day is currently active. Mixed-led's cards
  // instead get an explicit 👍/👎 pair — its *only* signal (see
  // lib/browsingInference.ts) — never a select action. AI-led mounts this
  // card too now (see components/workspace/ExplorePanel.tsx), but strictly
  // read-only — see isAiAutoplay below.
  const showSelectButton = condition === "human";
  const showInterestButtons = condition === "mixed";
  const liked = condition === "human" ? selectedForDay : false;
  // AI-led — the participant only watches lib/store.ts's runAiAutoplay
  // move through the catalog itself, see that file's own comment for why.
  // No click, no hover tracking, no "자세히 보기" (nothing for the
  // participant to open — the dialog opens on its own for the steps that
  // call for it), just a highlight ring while this is the card currently
  // focused — never true during the skim beat (autoplayFocusedItemId stays
  // null then, see lib/store.ts's runAiAutoplay), only during the per-item
  // sweep. The cursor/speech-bubble itself is a single persistent overlay
  // now (see components/workspace/AutoplayCursor.tsx), not rendered per
  // card.
  const isAiAutoplay = condition === "ai";
  const autoplayFocused = isAiAutoplay && autoplayFocusedItemId === activity.id;
  // An item can only be on one day at a time (see toggleDayItem). Once it's
  // been placed on some OTHER day, it's locked here — dimmed, marked "선택
  // 완료", and non-interactive — instead of appearing as just another
  // pickable candidate (which was the actual cause behind "my full
  // itinerary only shows one day" reports: the grid looks identical day to
  // day, so a card that looked "unselected" from today's view got re-picked
  // and silently stolen from whatever day it was already on).
  const assignedElsewhereDay =
    condition === "human" && !selectedForDay
      ? Object.entries(dayPlan).find(
          ([day, a]) => Number(day) !== humanDayIndex && a.activityIds.includes(activity.id)
        )?.[0]
      : undefined;
  const locked = !!assignedElsewhereDay;

  return (
    <motion.div variants={cardVariants}>
      <Card
        id={`explore-card-${activity.id}`}
        onClick={() => {
          if (!locked && !isAiAutoplay) openDetail(activity.id);
        }}
        onMouseEnter={locked || isAiAutoplay ? undefined : onMouseEnter}
        onMouseLeave={locked || isAiAutoplay ? undefined : onMouseLeave}
        className={cn(
          "relative overflow-hidden p-0 transition-all",
          isAiAutoplay
            ? "cursor-default"
            : locked
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:shadow-md",
          liked && "border-primary ring-1 ring-primary",
          autoplayFocused && "border-primary shadow-lg ring-2 ring-primary"
        )}
      >
        <div className="relative h-24 w-full">
          <MediaCover image={activity.image} alt={activity.name} />
          {recommendationReason && (
            <Badge className="absolute left-2 top-2 gap-1 bg-primary text-[10px] text-primary-foreground">
              <Sparkles className="h-3 w-3" /> AI 추천
            </Badge>
          )}
          {assignedElsewhereDay && (
            <Badge variant="secondary" className="absolute left-2 top-2 gap-1 text-[10px]">
              <CheckCircle2 className="h-3 w-3" /> {assignedElsewhereDay}일차 선택 완료
            </Badge>
          )}
          {showSelectButton && (
            <button
              type="button"
              disabled={locked}
              onClick={(e) => {
                e.stopPropagation();
                if (locked) return;
                toggleDayItem("activity", activity.id);
              }}
              className={cn(
                "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm",
                locked ? "cursor-not-allowed bg-background/60" : "bg-background/90"
              )}
            >
              <motion.span
                whileTap={locked ? undefined : { scale: 0.8 }}
                animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                {liked || locked ? (
                  <CheckCircle2 className="h-4 w-4 fill-primary text-primary-foreground" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.span>
            </button>
          )}
          {showInterestButtons && (
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInterest("activities", activity.id, "interested");
                }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-colors",
                  interest === "interested" ? "bg-primary text-primary-foreground" : "bg-background/90 text-muted-foreground"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInterest("activities", activity.id, "not-interested");
                }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-colors",
                  interest === "not-interested"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-background/90 text-muted-foreground"
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight">{activity.name}</p>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {activity.category}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{activity.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {activity.duration}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {activity.rating}
            </span>
          </div>
          <p className="pt-1 text-base font-bold">{activity.price === 0 ? "무료" : `${activity.price.toLocaleString()}원`}</p>
          {recommendationReason && (
            <p className="flex items-start gap-1 rounded-md bg-primary/5 px-2 py-1.5 text-xs text-primary">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                <span className="font-medium">추천 이유</span> · {recommendationReason}
              </span>
            </p>
          )}
          {/* Explicit affordance for what was previously only an implicit
              whole-card click — participants couldn't tell the card was
              clickable at all. The whole-card click above still works too;
              this button just makes it unmistakable. Omitted entirely for
              AI-led (see isAiAutoplay) — there's nothing here for the
              participant to click at all. */}
          {!isAiAutoplay && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={locked}
                className="h-7 gap-1 px-2.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  if (locked) return;
                  openDetail(activity.id);
                }}
              >
                자세히 보기
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
