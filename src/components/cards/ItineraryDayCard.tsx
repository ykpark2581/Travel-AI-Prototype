"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ItineraryDay } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function ItineraryDayCard({ day }: { day: ItineraryDay }) {
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
              <ul className="flex-1 space-y-1.5">
                {slot.items.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    <p className="font-medium leading-tight">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
