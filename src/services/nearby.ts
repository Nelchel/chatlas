import { Cat, Sighting } from "../types";
import { haversineDistance } from "../utils/distance";

export interface NearbyCatResult {
  cat: Cat;
  distance: number;
  sightingCount: number;
}

export function getNearbyCats(
  cats: Cat[],
  sightings: Sighting[],
  latitude: number,
  longitude: number,
  radiusMeters: number = 100
): NearbyCatResult[] {
  const catDistanceMap = new Map<string, number[]>();

  for (const s of sightings) {
    const cat = cats.find((c) => c.id === s.cat_id);
    if (!cat) continue;

    const dist = haversineDistance(latitude, longitude, s.latitude, s.longitude);
    if (dist > radiusMeters) continue;

    const existing = catDistanceMap.get(s.cat_id);
    if (existing) {
      existing.push(dist);
    } else {
      catDistanceMap.set(s.cat_id, [dist]);
    }
  }

  const totalSightingCount = (catId: string): number => {
    return sightings.filter((s) => s.cat_id === catId).length;
  };

  return Array.from(catDistanceMap.entries())
    .map(([catId, distances]) => {
      const cat = cats.find((c) => c.id === catId)!;
      return {
        cat,
        distance: Math.min(...distances),
        sightingCount: totalSightingCount(catId),
      };
    })
    .sort((a, b) => a.distance - b.distance);
}
