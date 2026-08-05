"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ItineraryDayCard } from "@/components/cards/ItineraryDayCard";
import { PanelSkeleton } from "@/components/workspace/panels/PanelSkeleton";
import { useExperimentStore } from "@/lib/store";
import { staggerContainer } from "@/lib/motion";
import { bookingConfirmedMessage, evaluateButtonLabel } from "@/data/dialogue";

export function ItineraryPanel({ loading }: { loading: boolean }) {
  const destinationBundle = useExperimentStore((s) => s.destinationBundle);
  const itineraryDays = useExperimentStore((s) => s.itineraryDays);
  const bookingConfirmed = useExperimentStore((s) => s.bookingConfirmed);
  const confirmBooking = useExperimentStore((s) => s.confirmBooking);

  const { meta } = destinationBundle;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{meta.name} 일정</h2>
        <p className="text-sm text-muted-foreground">
          {meta.startDate} – {meta.endDate} · {meta.nights}박{meta.days}일 · {meta.travelers}인
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <PanelSkeleton count={4} />
        </div>
      ) : (
        <>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
            {itineraryDays.map((day) => (
              <ItineraryDayCard key={day.day} day={day} />
            ))}
          </motion.div>

          {bookingConfirmed ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary"
            >
              {bookingConfirmedMessage}
            </motion.div>
          ) : (
            <div className="pt-2">
              <Button className="w-full" onClick={confirmBooking}>
                {evaluateButtonLabel}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
