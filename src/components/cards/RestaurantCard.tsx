"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Circle, MapPin, Sparkles, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/lib/store";
import { useHoverTracking } from "@/lib/useHoverTracking";
import { MediaCover } from "@/components/cards/MediaCover";
import type { Restaurant } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function RestaurantCard({
  restaurant,
  recommendationReason,
}: {
  restaurant: Restaurant;
  recommendationReason?: string;
}) {
  const humanDayIndex = useExperimentStore((s) => s.humanDayIndex);
  const dayPlan = useExperimentStore((s) => s.dayPlan);
  const selectedForDay = dayPlan[humanDayIndex]?.restaurantIds.includes(restaurant.id) ?? false;
  const toggleDayItem = useExperimentStore((s) => s.toggleDayItem);
  const interest = useExperimentStore((s) => s.interestRestaurant[restaurant.id]);
  const setInterest = useExperimentStore((s) => s.setInterest);
  const openDetail = useExperimentStore((s) => s.openDetail);
  const condition = useExperimentStore((s) => s.condition);
  const autoplayFocusedItemId = useExperimentStore((s) => s.autoplayFocusedItemId);
  const { onMouseEnter, onMouseLeave } = useHoverTracking("restaurants", restaurant.id, true);
  // See ActivityCard.tsx's comment for why — this is its restaurant mirror.
  const showSelectButton = condition === "human";
  const showInterestButtons = condition === "mixed";
  const liked = condition === "human" ? selectedForDay : false;
  // See ActivityCard.tsx's comment for why — this is its restaurant mirror.
  const isAiAutoplay = condition === "ai";
  const autoplayFocused = isAiAutoplay && autoplayFocusedItemId === restaurant.id;
  // See ActivityCard.tsx's comment for why this locks the card instead of
  // just marking it — this is its restaurant mirror.
  const assignedElsewhereDay =
    condition === "human" && !selectedForDay
      ? Object.entries(dayPlan).find(
          ([day, a]) => Number(day) !== humanDayIndex && a.restaurantIds.includes(restaurant.id)
        )?.[0]
      : undefined;
  const locked = !!assignedElsewhereDay;

  return (
    <motion.div variants={cardVariants}>
      <Card
        id={`explore-card-${restaurant.id}`}
        onClick={() => {
          if (!locked && !isAiAutoplay) openDetail(restaurant.id);
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
          <MediaCover image={restaurant.image} alt={restaurant.name} />
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
                toggleDayItem("restaurant", restaurant.id);
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
                  setInterest("restaurants", restaurant.id, "interested");
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
                  setInterest("restaurants", restaurant.id, "not-interested");
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
            <p className="text-sm font-semibold leading-tight">{restaurant.name}</p>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {restaurant.priceFrom.toLocaleString()}원~
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {restaurant.area} · {restaurant.cuisine}
          </p>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {restaurant.rating}
          </span>
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
                  openDetail(restaurant.id);
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
