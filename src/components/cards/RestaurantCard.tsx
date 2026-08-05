"use client";

import { motion } from "framer-motion";
import { Heart, MapPin, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const liked = useExperimentStore((s) => s.likedRestaurantIds.includes(restaurant.id));
  const toggleLikeRestaurant = useExperimentStore((s) => s.toggleLikeRestaurant);
  const openDetail = useExperimentStore((s) => s.openDetail);
  const { onMouseEnter, onMouseLeave } = useHoverTracking("restaurants", restaurant.id, true);

  return (
    <motion.div variants={cardVariants}>
      <Card
        onClick={() => openDetail(restaurant.id)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          "relative cursor-pointer overflow-hidden p-0 transition-all hover:shadow-md",
          liked && "border-primary ring-1 ring-primary"
        )}
      >
        <div className="relative h-24 w-full">
          <MediaCover image={restaurant.image} alt={restaurant.name} />
          {recommendationReason && (
            <Badge className="absolute left-2 top-2 gap-1 bg-primary text-[10px] text-primary-foreground">
              <Sparkles className="h-3 w-3" /> AI 추천
            </Badge>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeRestaurant(restaurant.id);
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-sm"
          >
            <motion.span
              whileTap={{ scale: 0.8 }}
              animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={cn("h-4 w-4", liked ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
            </motion.span>
          </button>
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
        </div>
      </Card>
    </motion.div>
  );
}
