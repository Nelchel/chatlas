import { Cat, Sighting } from "../types";

export interface CityStat {
  name: string;
  catCount: number;
  sightingCount: number;
  latitude: number;
  longitude: number;
}

export interface CountryStat {
  name: string;
  flag: string;
  cityCount: number;
  catCount: number;
  sightingCount: number;
}

const CITY_COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  "Paris": { name: "France", flag: "🇫🇷" },
  "Lyon": { name: "France", flag: "🇫🇷" },
  "Marseille": { name: "France", flag: "🇫🇷" },
  "Annecy": { name: "France", flag: "🇫🇷" },
  "Aix-les-Bains": { name: "France", flag: "🇫🇷" },
  "Nice": { name: "France", flag: "🇫🇷" },
  "Bordeaux": { name: "France", flag: "🇫🇷" },
  "Lille": { name: "France", flag: "🇫🇷" },
  "Strasbourg": { name: "France", flag: "🇫🇷" },
  "Toulouse": { name: "France", flag: "🇫🇷" },
  "Nantes": { name: "France", flag: "🇫🇷" },
  "Montpellier": { name: "France", flag: "🇫🇷" },
  "Rennes": { name: "France", flag: "🇫🇷" },
  "Grenoble": { name: "France", flag: "🇫🇷" },
  "Dijon": { name: "France", flag: "🇫🇷" },
  "Reims": { name: "France", flag: "🇫🇷" },
  "Le Havre": { name: "France", flag: "🇫🇷" },
  "Saint-Étienne": { name: "France", flag: "🇫🇷" },
  "Toulon": { name: "France", flag: "🇫🇷" },
  "Angers": { name: "France", flag: "🇫🇷" },
  "Nîmes": { name: "France", flag: "🇫🇷" },
  "Metz": { name: "France", flag: "🇫🇷" },
  "Caen": { name: "France", flag: "🇫🇷" },
  "Orléans": { name: "France", flag: "🇫🇷" },
  "Mulhouse": { name: "France", flag: "🇫🇷" },
  "Rouen": { name: "France", flag: "🇫🇷" },
  "Nancy": { name: "France", flag: "🇫🇷" },
  "Avignon": { name: "France", flag: "🇫🇷" },
  "Poitiers": { name: "France", flag: "🇫🇷" },
  "La Rochelle": { name: "France", flag: "🇫🇷" },
  "Cannes": { name: "France", flag: "🇫🇷" },
  "Antibes": { name: "France", flag: "🇫🇷" },
  "Chambéry": { name: "France", flag: "🇫🇷" },
  "Albertville": { name: "France", flag: "🇫🇷" },
  "Thonon-les-Bains": { name: "France", flag: "🇫🇷" },
  "Annemasse": { name: "France", flag: "🇫🇷" },
  "Annecy-le-Vieux": { name: "France", flag: "🇫🇷" },
  "Seynod": { name: "France", flag: "🇫🇷" },
  "Cran-Gevrier": { name: "France", flag: "🇫🇷" },
  "Metz-Tessy": { name: "France", flag: "🇫🇷" },
  "Pringy": { name: "France", flag: "🇫🇷" },
  "Clermont-Ferrand": { name: "France", flag: "🇫🇷" },
  "Brest": { name: "France", flag: "🇫🇷" },
  "Le Mans": { name: "France", flag: "🇫🇷" },
  "Amiens": { name: "France", flag: "🇫🇷" },
  "Tours": { name: "France", flag: "🇫🇷" },
  "Limoges": { name: "France", flag: "🇫🇷" },
  "Villeurbanne": { name: "France", flag: "🇫🇷" },
  "Besançon": { name: "France", flag: "🇫🇷" },
  "Perpignan": { name: "France", flag: "🇫🇷" },
  "Boulogne-Billancourt": { name: "France", flag: "🇫🇷" },
  "Argenteuil": { name: "France", flag: "🇫🇷" },
  "Montreuil": { name: "France", flag: "🇫🇷" },
  "Roubaix": { name: "France", flag: "🇫🇷" },
  "Dunkerque": { name: "France", flag: "🇫🇷" },
  "Saint-Nazaire": { name: "France", flag: "🇫🇷" },
  "Drancy": { name: "France", flag: "🇫🇷" },
  "Calais": { name: "France", flag: "🇫🇷" },
  "Aubervilliers": { name: "France", flag: "🇫🇷" },
  "Vitry-sur-Seine": { name: "France", flag: "🇫🇷" },
  "Pau": { name: "France", flag: "🇫🇷" },
  "Aix-en-Provence": { name: "France", flag: "🇫🇷" },
  "La Seyne-sur-Mer": { name: "France", flag: "🇫🇷" },
  "Genève": { name: "Suisse", flag: "🇨🇭" },
  "Lausanne": { name: "Suisse", flag: "🇨🇭" },
  "Zurich": { name: "Suisse", flag: "🇨🇭" },
  "Berne": { name: "Suisse", flag: "🇨🇭" },
  "Bâle": { name: "Suisse", flag: "🇨🇭" },
  "Lucerne": { name: "Suisse", flag: "🇨🇭" },
  "Saint-Gall": { name: "Suisse", flag: "🇨🇭" },
  "Neuchâtel": { name: "Suisse", flag: "🇨🇭" },
  "Fribourg": { name: "Suisse", flag: "🇨🇭" },
  "Sion": { name: "Suisse", flag: "🇨🇭" },
  "Montreux": { name: "Suisse", flag: "🇨🇭" },
  "Lugano": { name: "Suisse", flag: "🇨🇭" },
  "Vernier": { name: "Suisse", flag: "🇨🇭" },
  "Carouge": { name: "Suisse", flag: "🇨🇭" },
  "Lancy": { name: "Suisse", flag: "🇨🇭" },
  "Onex": { name: "Suisse", flag: "🇨🇭" },
  "Meyrin": { name: "Suisse", flag: "🇨🇭" },
  "Thônex": { name: "Suisse", flag: "🇨🇭" },
  "Versoix": { name: "Suisse", flag: "🇨🇭" },
  "Nyon": { name: "Suisse", flag: "🇨🇭" },
  "Bruxelles": { name: "Belgique", flag: "🇧🇪" },
  "Anvers": { name: "Belgique", flag: "🇧🇪" },
  "Gand": { name: "Belgique", flag: "🇧🇪" },
  "Charleroi": { name: "Belgique", flag: "🇧🇪" },
  "Liège": { name: "Belgique", flag: "🇧🇪" },
  "Bruges": { name: "Belgique", flag: "🇧🇪" },
  "Namur": { name: "Belgique", flag: "🇧🇪" },
  "Mons": { name: "Belgique", flag: "🇧🇪" },
  "Louvain": { name: "Belgique", flag: "🇧🇪" },
  "Montréal": { name: "Canada", flag: "🇨🇦" },
  "Québec": { name: "Canada", flag: "🇨🇦" },
  "Toronto": { name: "Canada", flag: "🇨🇦" },
  "Vancouver": { name: "Canada", flag: "🇨🇦" },
  "Ottawa": { name: "Canada", flag: "🇨🇦" },
  "Luxembourg": { name: "Luxembourg", flag: "🇱🇺" },
};

function guessCountryFromCoordinates(
  lat: number,
  lng: number
): { name: string; flag: string } | null {
  if (lat > 41 && lat < 52 && lng > -5 && lng < 8) return { name: "France", flag: "🇫🇷" };
  if (lat > 45.5 && lat < 48 && lng > 5 && lng < 11) return { name: "Suisse", flag: "🇨🇭" };
  if (lat > 49 && lat < 51.5 && lng > 2.5 && lng < 6.5) return { name: "Belgique", flag: "🇧🇪" };
  if (lat > 41 && lat < 84 && lng > -141 && lng < -52) return { name: "Canada", flag: "🇨🇦" };
  if (lat > 49 && lat < 51.2 && lng > 5.5 && lng < 6.6) return { name: "Luxembourg", flag: "🇱🇺" };
  return null;
}

export function getCountryFromCity(
  city: string,
  lat?: number,
  lng?: number
): { name: string; flag: string } | null {
  const normalized = city.trim();
  const direct = CITY_COUNTRY_MAP[normalized];
  if (direct) return direct;

  const lower = normalized.toLowerCase();
  for (const [key, value] of Object.entries(CITY_COUNTRY_MAP)) {
    if (key.toLowerCase() === lower || normalized.includes(key)) {
      return value;
    }
  }

  if (lat !== undefined && lng !== undefined) {
    return guessCountryFromCoordinates(lat, lng);
  }

  return null;
}

export function calculateGeoStats(sightings: Sighting[], cats: Cat[]) {
  const validSightings = sightings.filter(
    (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
  );

  const cityMap = new Map<
    string,
    {
      name: string;
      catIds: Set<string>;
      sightingCount: number;
      lats: number[];
      lngs: number[];
    }
  >();

  for (const s of validSightings) {
    const city = s.location_label?.trim();
    if (!city) continue;
    const existing = cityMap.get(city);
    if (!existing) {
      cityMap.set(city, {
        name: city,
        catIds: new Set([s.cat_id]),
        sightingCount: 1,
        lats: [s.latitude],
        lngs: [s.longitude],
      });
    } else {
      existing.catIds.add(s.cat_id);
      existing.sightingCount++;
      existing.lats.push(s.latitude);
      existing.lngs.push(s.longitude);
    }
  }

  const cityStats: CityStat[] = Array.from(cityMap.values())
    .map((c) => ({
      name: c.name,
      catCount: c.catIds.size,
      sightingCount: c.sightingCount,
      latitude: c.lats.reduce((a, b) => a + b, 0) / c.lats.length,
      longitude: c.lngs.reduce((a, b) => a + b, 0) / c.lngs.length,
    }))
    .sort((a, b) => b.catCount - a.catCount);

  const countryMap = new Map<string, CountryStat>();
  for (const city of cityStats) {
    const countryInfo = getCountryFromCity(city.name, city.latitude, city.longitude);
    if (countryInfo) {
      const existing = countryMap.get(countryInfo.name);
      if (!existing) {
        countryMap.set(countryInfo.name, {
          name: countryInfo.name,
          flag: countryInfo.flag,
          cityCount: 1,
          catCount: city.catCount,
          sightingCount: city.sightingCount,
        });
      } else {
        existing.cityCount++;
        existing.catCount += city.catCount;
        existing.sightingCount += city.sightingCount;
      }
    }
  }

  const countryStats = Array.from(countryMap.values()).sort((a, b) => b.catCount - a.catCount);

  const heatmapPoints = validSightings.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
    weight: 1,
  }));

  return {
    cityStats,
    countryStats,
    totalCities: cityStats.length,
    totalCountries: countryStats.length,
    heatmapPoints,
  };
}
