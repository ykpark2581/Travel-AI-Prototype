"use client";

import { Plane, Hotel as HotelIcon } from "lucide-react";
import { useExperimentStore } from "@/lib/store";
import { MediaCover } from "@/components/cards/MediaCover";

// Flights/hotels are result-only now (see store.ts) — this renders the
// current destinationBundle's already-decided flight/hotel as a compact card
// right in the chat, instead of a browsable workspace panel.
export function TripSummaryMessage() {
  const meta = useExperimentStore((s) => s.destinationBundle.meta);
  const flight = useExperimentStore((s) => s.destinationBundle.flight);
  const hotel = useExperimentStore((s) => s.destinationBundle.hotel);

  return (
    <div className="mt-1 space-y-2.5">
      <div className="rounded-xl border bg-background p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Plane className="h-3.5 w-3.5" /> 항공편
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">
          {flight.from} → {flight.to} · {flight.airline}
        </p>
        <p className="text-xs text-muted-foreground">
          {meta.startDate} {flight.departTime} 출발 ~ {meta.endDate} 귀국
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="h-24 w-full">
          <MediaCover image={hotel.image} alt={hotel.name} />
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <HotelIcon className="h-3.5 w-3.5" /> 숙소
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{hotel.name}</p>
          <p className="text-xs text-muted-foreground">{hotel.area}</p>
        </div>
      </div>
    </div>
  );
}
