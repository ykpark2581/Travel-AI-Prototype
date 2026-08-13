"use client";

import { motion } from "framer-motion";
import { ItineraryDayCard } from "@/components/cards/ItineraryDayCard";
import { AiCommentSummary } from "@/components/workspace/panels/AiCommentSummary";
import { PanelSkeleton } from "@/components/workspace/panels/PanelSkeleton";
import { useExperimentStore } from "@/lib/store";
import { staggerContainer } from "@/lib/motion";

// Pure display, no "move on" action here — the workspace is browse/select
// only (see ActivityCard/RestaurantCard's own comments for the same rule
// on the explore stage). The final plan's own chat message carries the
// "확인했습니다" button instead (see components/chat/BookingConfirmMessage.tsx
// / lib/store.ts's confirmFinalPlan), which opens
// components/flow/ConditionCompleteDialog.tsx.
export function ItineraryPanel({ loading }: { loading: boolean }) {
  const destinationBundle = useExperimentStore((s) => s.destinationBundle);
  const itineraryDays = useExperimentStore((s) => s.itineraryDays);

  const { meta } = destinationBundle;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{meta.name} 일정</h2>
        <p className="text-sm text-muted-foreground">
          {meta.startDate} – {meta.endDate} · {meta.nights}박{meta.days}일
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <PanelSkeleton count={4} />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
          {itineraryDays.map((day) => (
            <ItineraryDayCard key={day.day} day={day} />
          ))}
          <AiCommentSummary />
        </motion.div>
      )}
    </div>
  );
}
