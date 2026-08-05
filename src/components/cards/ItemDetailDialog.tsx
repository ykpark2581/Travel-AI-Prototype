"use client";

import { useEffect, useRef } from "react";
import { Clock, Heart, MapPin, MessageSquare, Sparkles, Star, UtensilsCrossed, Wallet } from "lucide-react";
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
  const likedActivityIds = useExperimentStore((s) => s.likedActivityIds);
  const likedRestaurantIds = useExperimentStore((s) => s.likedRestaurantIds);
  const toggleLikeActivity = useExperimentStore((s) => s.toggleLikeActivity);
  const toggleLikeRestaurant = useExperimentStore((s) => s.toggleLikeRestaurant);

  const itemId = activeDetailItemId;

  const activity = destinationBundle.activities.find((a) => a.id === itemId);
  const restaurant = destinationBundle.restaurants.find((r) => r.id === itemId);
  const item = activity ?? restaurant;
  const open = !!item;
  const liked = activity ? likedActivityIds.includes(activity.id) : restaurant ? likedRestaurantIds.includes(restaurant.id) : false;

  const trackedIdRef = useRef<{ id: string; stage: ExplorationStage; openedAt: number } | null>(null);
  useEffect(() => {
    if (!activeDetailItemId) return;
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

              <Separator />

              <div className="flex items-center justify-end pt-1">
                <Button
                  size="sm"
                  variant={liked ? "default" : "outline"}
                  className="gap-1.5"
                  onClick={() => (activity ? toggleLikeActivity(activity.id) : restaurant && toggleLikeRestaurant(restaurant.id))}
                >
                  <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                  {liked ? "찜한 장소" : "찜하기"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
