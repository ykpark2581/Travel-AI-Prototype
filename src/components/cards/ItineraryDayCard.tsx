"use client";

import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MediaCover } from "@/components/cards/MediaCover";
import { useExperimentStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ItineraryDay } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function ItineraryDayCard({ day }: { day: ItineraryDay }) {
  const openDetailReview = useExperimentStore((s) => s.openDetailReview);

  return (
    <motion.div variants={cardVariants}>
      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">
          {day.day}일차 <span className="font-normal text-muted-foreground">· {day.date}</span>
        </p>
        <Separator className="mb-3" />
        <div className="space-y-3">
          {day.slots.map((slot) => (
            <div key={slot.period} className="flex gap-3">
              <span className="w-12 shrink-0 text-xs font-semibold text-primary">{slot.period}</span>
              <ul className="flex-1 space-y-2.5">
                {slot.items.map((item, idx) => {
                  // Only actual activity/restaurant picks carry an id (see
                  // lib/itinerary.ts's activityItem/mealItem) — flights and
                  // hotels (출국/도착/체크인/체크아웃/귀국/조식) stay static,
                  // there's no detail dialog content for them anyway.
                  const clickable = !!item.id;
                  return (
                    <li key={idx} className="text-sm">
                      {item.image ? (
                        <div
                          role={clickable ? "button" : undefined}
                          tabIndex={clickable ? 0 : undefined}
                          onClick={clickable ? () => openDetailReview(item.id!) : undefined}
                          onKeyDown={
                            clickable
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") openDetailReview(item.id!);
                                }
                              : undefined
                          }
                          className={cn(
                            "flex gap-2.5 rounded-lg border bg-muted/30 p-2 transition-colors",
                            clickable && "cursor-pointer hover:border-primary/40 hover:bg-muted/60"
                          )}
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md">
                            <MediaCover image={item.image} alt={item.label} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium leading-tight">{item.label}</p>
                              {clickable && <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.detail}</p>
                            {item.aiComment && (
                              <p className="flex items-start gap-1 text-xs text-primary">
                                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{item.aiComment}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium leading-tight">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
