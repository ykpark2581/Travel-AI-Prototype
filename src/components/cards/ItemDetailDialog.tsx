"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  MousePointer2,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useExperimentStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  getActivityAiSummary,
  getActivityReviewSummary,
  getRestaurantAiSummary,
  getRestaurantReviewSummary,
} from "@/lib/detailSummary";
import { MediaCover } from "@/components/cards/MediaCover";
import type { ExplorationStage } from "@/types";

function SummarySection({ icon, title, bullets }: { icon: React.ReactNode; title: string; bullets: string[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <span className="select-none text-muted-foreground/60">•</span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ItemDetailDialog() {
  const destinationBundle = useExperimentStore((s) => s.destinationBundle);
  const activeDetailItemId = useExperimentStore((s) => s.activeDetailItemId);
  const closeDetail = useExperimentStore((s) => s.closeDetail);
  const recordDetailDuration = useExperimentStore((s) => s.recordDetailDuration);
  const humanDayIndex = useExperimentStore((s) => s.humanDayIndex);
  const dayPlan = useExperimentStore((s) => s.dayPlan);
  const toggleDayItem = useExperimentStore((s) => s.toggleDayItem);
  const interestActivity = useExperimentStore((s) => s.interestActivity);
  const interestRestaurant = useExperimentStore((s) => s.interestRestaurant);
  const setInterest = useExperimentStore((s) => s.setInterest);
  const condition = useExperimentStore((s) => s.condition);
  const detailReadOnly = useExperimentStore((s) => s.detailReadOnly);
  const autoplayDialogCursor = useExperimentStore((s) => s.autoplayDialogCursor);
  // See ActivityCard.tsx's comment for why — human-led's is a checkbox,
  // mixed-led gets the same 👍/👎 pair its cards show. Suppressed entirely
  // when opened from the final itinerary for review (see
  // lib/store.ts's openDetailReview) — the plan is already locked in by
  // then, so there's nothing left to select/rate here.
  const showSelectButton = condition === "human" && !detailReadOnly;
  const showInterestButtons = condition === "mixed" && !detailReadOnly;

  const itemId = activeDetailItemId;

  const activity = destinationBundle.activities.find((a) => a.id === itemId);
  const restaurant = destinationBundle.restaurants.find((r) => r.id === itemId);
  const item = activity ?? restaurant;
  const open = !!item;
  const dayAssignment = dayPlan[humanDayIndex];
  const liked = activity
    ? (dayAssignment?.activityIds.includes(activity.id) ?? false)
    : restaurant
      ? (dayAssignment?.restaurantIds.includes(restaurant.id) ?? false)
      : false;
  const interest = activity ? interestActivity[activity.id] : restaurant ? interestRestaurant[restaurant.id] : undefined;

  const trackedIdRef = useRef<{ id: string; stage: ExplorationStage; openedAt: number } | null>(null);
  useEffect(() => {
    // Read-only opens (final-itinerary review, see openDetailReview, and
    // now AI-led's own autoplay-driven opens, see lib/store.ts's
    // runAiAutoplay) aren't genuine participant browsing behavior — the
    // participant didn't choose to open these, so recording their
    // "duration" alongside real browsing signals would misrepresent what
    // actually happened for anyone reading the exported data later.
    if (!activeDetailItemId || detailReadOnly) return;
    const stage: ExplorationStage = destinationBundle.activities.some((a) => a.id === activeDetailItemId)
      ? "activities"
      : "restaurants";
    trackedIdRef.current = { id: activeDetailItemId, stage, openedAt: performance.now() };
    return () => {
      const tracked = trackedIdRef.current;
      if (!tracked) return;
      recordDetailDuration(tracked.stage, tracked.id, performance.now() - tracked.openedAt);
      trackedIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDetailItemId]);

  const aiSummary = activity ? getActivityAiSummary(activity) : restaurant ? getRestaurantAiSummary(restaurant) : [];
  const reviewSummary = activity
    ? getActivityReviewSummary(activity)
    : restaurant
      ? getRestaurantReviewSummary(restaurant)
      : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeDetail();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto p-0">
        {/* AI-led only — the same cursor visual as the card grid's own
            persistent AutoplayCursor (components/workspace/
            AutoplayCursor.tsx), standing in for the participant's mouse
            here too since they never actually opened this dialog
            themselves (see lib/store.ts's runAiAutoplay). "enter" pops in
            at center with a quick scale-bounce right as the dialog
            appears (a "clicked in here" beat); "exit" starts there too but
            animates out toward the corner where the real close button
            sits, right before lib/store.ts actually closes the dialog —
            "상세 페이지 들어갈 때, 취소할 때 모두" the mouse movement
            should be visible, not just the dialog itself popping open/
            shut with no visible cause. */}
        {condition === "ai" && autoplayDialogCursor && (
          <motion.div
            key={autoplayDialogCursor}
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
            initial={
              autoplayDialogCursor === "enter"
                ? { opacity: 0, scale: 0.5, x: 0, y: 0 }
                : { opacity: 1, scale: 1, x: 0, y: 0 }
            }
            animate={
              autoplayDialogCursor === "enter"
                ? { opacity: 1, scale: 1, x: 0, y: 0 }
                : { opacity: 1, scale: 1, x: 200, y: -220 }
            }
            transition={{ duration: autoplayDialogCursor === "enter" ? 0.3 : 0.7, ease: "easeInOut" }}
          >
            <MousePointer2 className="h-8 w-8 -rotate-12 fill-foreground text-foreground drop-shadow-md" />
          </motion.div>
        )}
        {item && (
          <>
            <div className="h-48 w-full overflow-hidden">
              <MediaCover image={item.image} alt={item.name} />
            </div>
            <div className="space-y-4 p-6">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{item.name}</DialogTitle>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {activity ? activity.category : restaurant?.cuisine}
                  </Badge>
                </div>
                <DialogDescription className="sr-only">{item.name} 상세 정보</DialogDescription>
              </DialogHeader>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {activity ? activity.description : restaurant?.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {item.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  {activity
                    ? activity.price === 0
                      ? "무료"
                      : `${activity.price.toLocaleString()}원`
                    : `${restaurant?.priceFrom.toLocaleString()}원~`}
                </span>
                <span className="flex items-center gap-1">
                  {activity ? (
                    <>
                      <Clock className="h-3.5 w-3.5" /> {activity.duration}
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="h-3.5 w-3.5" /> {restaurant?.cuisine}
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {activity ? activity.area : restaurant?.area}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Separator />

              <SummarySection icon={<Sparkles className="h-4 w-4 text-primary" />} title="AI 요약" bullets={aiSummary} />

              <SummarySection
                icon={<MessageSquare className="h-4 w-4 text-primary" />}
                title="방문자 리뷰 요약"
                bullets={reviewSummary}
              />

              {showSelectButton && (
                <>
                  <Separator />
                  <div className="flex items-center justify-end pt-1">
                    <Button
                      size="sm"
                      variant={liked ? "default" : "outline"}
                      className="gap-1.5"
                      onClick={() => {
                        // Reflect the selection first, then close — picking
                        // an item shouldn't leave the dialog sitting open
                        // waiting for a separate dismiss.
                        if (activity) toggleDayItem("activity", activity.id);
                        else if (restaurant) toggleDayItem("restaurant", restaurant.id);
                        closeDetail();
                      }}
                    >
                      <CheckCircle2 className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                      {liked ? "선택됨" : "선택하기"}
                    </Button>
                  </div>
                </>
              )}
              {showInterestButtons && (
                <>
                  <Separator />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={interest === "interested" ? "default" : "outline"}
                      className="gap-1.5"
                      onClick={() => {
                        // Same as the select-button branch above — reflect
                        // the interest first, then close, rather than
                        // leaving the dialog open waiting for a separate
                        // dismiss.
                        setInterest(activity ? "activities" : "restaurants", (activity ?? restaurant)!.id, "interested");
                        closeDetail();
                      }}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> 관심있음
                    </Button>
                    <Button
                      size="sm"
                      variant={interest === "not-interested" ? "destructive" : "outline"}
                      className="gap-1.5"
                      onClick={() => {
                        setInterest(activity ? "activities" : "restaurants", (activity ?? restaurant)!.id, "not-interested");
                        closeDetail();
                      }}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" /> 관심없음
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
