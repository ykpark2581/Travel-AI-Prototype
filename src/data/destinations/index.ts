import type { DestinationBundle, DestinationId } from "@/types";
import { vietnamBundle } from "@/data/destinations/vietnam";
import { bangkokBundle } from "@/data/destinations/bangkok";
import { taiwanBundle } from "@/data/destinations/taiwan";

export const DESTINATIONS: Record<DestinationId, DestinationBundle> = {
  vietnam: vietnamBundle,
  bangkok: bangkokBundle,
  taiwan: taiwanBundle,
};

export function getDestinationBundle(id: DestinationId): DestinationBundle {
  return DESTINATIONS[id];
}
