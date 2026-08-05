"use client";

import { useExperimentStore } from "@/lib/store";
import { MediaCover } from "@/components/cards/MediaCover";
import {
  buildActivitySelectionCopy,
  buildRestaurantSelectionCopy,
  type StyleSelectionCopy,
} from "@/lib/styleSelectionReason";
import type { SelectionResultsPayload } from "@/types";

function SelectionCard({ name, image, copy }: { name: string; image: string; copy: StyleSelectionCopy }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="h-20 w-full">
        <MediaCover image={image} alt={name} />
      </div>
      <div className="space-y-1 p-2.5">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{copy.recommendationReason}</p>
        <p className="text-xs text-muted-foreground">{copy.styleFit}</p>
        <p className="text-xs font-medium text-primary">{copy.placementNote}</p>
      </div>
    </div>
  );
}

// AI-led only — renders the items the AI auto-selected for a stage as
// compact cards right in the chat (see store.ts's startAiLedSelection).
export function SelectionResultsMessage({ payload }: { payload: SelectionResultsPayload }) {
  const destinationBundle = useExperimentStore((s) => s.destinationBundle);
  const selectedActivityTags = useExperimentStore((s) => s.selectedActivityTags);
  const selectedRestaurantTags = useExperimentStore((s) => s.selectedRestaurantTags);

  const isActivities = payload.stage === "activities";
  const selectedTags = isActivities ? selectedActivityTags : selectedRestaurantTags;

  return (
    <div className="mt-1 space-y-2.5">
      {payload.itemIds.map((id, index) => {
        if (isActivities) {
          const activity = destinationBundle.activities.find((a) => a.id === id);
          if (!activity) return null;
          const copy = buildActivitySelectionCopy(activity, index, selectedTags);
          return <SelectionCard key={id} name={activity.name} image={activity.image} copy={copy} />;
        }
        const restaurant = destinationBundle.restaurants.find((r) => r.id === id);
        if (!restaurant) return null;
        const copy = buildRestaurantSelectionCopy(restaurant, index, selectedTags, destinationBundle.hotel.area);
        return <SelectionCard key={id} name={restaurant.name} image={restaurant.image} copy={copy} />;
      })}
    </div>
  );
}
