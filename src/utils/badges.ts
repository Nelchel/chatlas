import { uid } from "./id";
import { LocalStorage, STORAGE_KEYS } from "../services/storage";
import { Badge } from "../types";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "secret";

export interface BadgeWithProgress extends Badge {
  tier: BadgeTier;
  hidden?: boolean;
  progressTarget?: number;
  criteriaType?: string;
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  percentage: number;
}

const ALL_COLORS = ["roux", "noir", "blanc", "gris", "tigré", "tricolore", "siamois"];

/**
 * Récupère le compteur pour un critère donné
 */
export function getCriteriaCount(
  criteria: string,
  cats: { color?: string; created_at?: string; breed?: string; sociability?: string }[],
  sightings: { location_label?: string; photo_url?: string; sighted_at?: string }[],
  favoritesCount: number,
  uniqueCities: Set<string>,
  streakDays: number
): { current: number; target?: number } {
  const totalCats = cats.length;
  const totalSightings = sightings.length;

  // Collection
  if (criteria === "first_cat") return { current: totalCats, target: 1 };
  if (criteria === "five_cats") return { current: totalCats, target: 5 };
  if (criteria === "ten_cats") return { current: totalCats, target: 10 };
  if (criteria === "twentyfive_cats") return { current: totalCats, target: 25 };
  if (criteria === "fifty_cats") return { current: totalCats, target: 50 };
  if (criteria === "hundred_cats") return { current: totalCats, target: 100 };

  // Favoris
  if (criteria === "first_favorite") return { current: favoritesCount, target: 1 };
  if (criteria === "five_favorites") return { current: favoritesCount, target: 5 };
  if (criteria === "ten_favorites") return { current: favoritesCount, target: 10 };
  if (criteria === "twentyfive_favorites") return { current: favoritesCount, target: 25 };
  if (criteria === "fifty_favorites") return { current: favoritesCount, target: 50 };

  // Observations
  if (criteria === "first_sighting") return { current: totalSightings, target: 1 };
  if (criteria === "ten_sightings") return { current: totalSightings, target: 10 };
  if (criteria === "twentyfive_sightings") return { current: totalSightings, target: 25 };
  if (criteria === "fifty_sightings") return { current: totalSightings, target: 50 };
  if (criteria === "hundred_sightings") return { current: totalSightings, target: 100 };
  if (criteria === "fivehundred_sightings") return { current: totalSightings, target: 500 };

  // Photos
  if (criteria === "first_photo") {
    const photoCount = sightings.filter((s) => s.photo_url).length;
    return { current: photoCount, target: 1 };
  }
  if (criteria === "ten_photos") {
    const photoCount = sightings.filter((s) => s.photo_url).length;
    return { current: photoCount, target: 10 };
  }
  if (criteria === "fifty_photos") {
    const photoCount = sightings.filter((s) => s.photo_url).length;
    return { current: photoCount, target: 50 };
  }

  // Couleurs de chats
  if (criteria.startsWith("cat_color_")) {
    const color = criteria.replace("cat_color_", "");
    const count = cats.filter((c) =>
      c.color?.toLowerCase().includes(color)
    ).length;
    return { current: count, target: 1 };
  }

  // Villes visitées
  if (criteria === "first_city") return { current: uniqueCities.size, target: 1 };
  if (criteria === "five_cities") return { current: uniqueCities.size, target: 5 };
  if (criteria === "ten_cities") return { current: uniqueCities.size, target: 10 };
  if (criteria === "twentyfive_cities") return { current: uniqueCities.size, target: 25 };

  // Streaks
  if (criteria === "streak_3") return { current: streakDays, target: 3 };
  if (criteria === "streak_7") return { current: streakDays, target: 7 };
  if (criteria === "streak_14") return { current: streakDays, target: 14 };
  if (criteria === "streak_30") return { current: streakDays, target: 30 };
  if (criteria === "streak_100") return { current: streakDays, target: 100 };
  if (criteria === "sighting_streak_3") return { current: streakDays, target: 3 };

  // Races
  if (criteria === "first_breed") {
    const breeds = new Set(cats.map((c) => c.breed).filter(Boolean));
    return { current: breeds.size, target: 1 };
  }
  if (criteria === "five_breeds") {
    const breeds = new Set(cats.map((c) => c.breed).filter(Boolean));
    return { current: breeds.size, target: 5 };
  }
  if (criteria === "ten_breeds") {
    const breeds = new Set(cats.map((c) => c.breed).filter(Boolean));
    return { current: breeds.size, target: 10 };
  }

  // Sociabilité
  if (criteria === "social_cat") {
    const count = cats.filter((c) =>
      c.sociability?.toLowerCase().includes("sociable")
    ).length;
    return { current: count, target: 1 };
  }
  if (criteria === "shy_cat") {
    const count = cats.filter((c) =>
      c.sociability?.toLowerCase().includes("craintif") ||
      c.sociability?.toLowerCase().includes("timide")
    ).length;
    return { current: count, target: 1 };
  }

  // Hidden / Special
  if (criteria === "lucky_seven") {
    return { current: totalCats, target: 7 };
  }

  if (criteria === "midnight_cat") {
    const hasMidnight = sightings.some((s) => {
      if (!s.sighted_at) return false;
      const h = new Date(s.sighted_at).getHours();
      return h >= 0 && h < 5;
    });
    return { current: hasMidnight ? 1 : 0, target: 1 };
  }

  if (criteria === "night_owl") {
    const hasLate = cats.some((c) => {
      if (!c.created_at) return false;
      const h = new Date(c.created_at).getHours();
      return h >= 22;
    });
    return { current: hasLate ? 1 : 0, target: 1 };
  }

  if (criteria === "early_bird") {
    const hasEarly = cats.some((c) => {
      if (!c.created_at) return false;
      const h = new Date(c.created_at).getHours();
      return h < 7;
    });
    return { current: hasEarly ? 1 : 0, target: 1 };
  }

  if (criteria === "weekend_warrior") {
    const hasWeekend = cats.some((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at).getDay();
      return d === 0 || d === 6; // Sunday = 0, Saturday = 6
    });
    return { current: hasWeekend ? 1 : 0, target: 1 };
  }

  if (criteria === "speed_runner") {
    // 5+ chats créés dans la même heure
    const hours = cats.reduce<Record<string, number>>((acc, c) => {
      if (!c.created_at) return acc;
      const key = c.created_at.substring(0, 13); // YYYY-MM-DDTHH
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const maxInHour = Math.max(0, ...Object.values(hours));
    return { current: maxInHour >= 5 ? 1 : 0, target: 1 };
  }

  if (criteria === "all_colors") {
    const foundColors = new Set<string>();
    for (const cat of cats) {
      if (!cat.color) continue;
      const col = cat.color.toLowerCase();
      for (const c of ALL_COLORS) {
        if (col.includes(c)) foundColors.add(c);
      }
    }
    const hasAll = ALL_COLORS.every((c) => foundColors.has(c));
    return { current: hasAll ? 1 : 0, target: 1 };
  }

  if (criteria === "ghost_cat" || criteria === "rain_photo") {
    // Non implémentable sans données météo/détection
    return { current: 0, target: 1 };
  }

  return { current: 0 };
}

/**
 * Vérifie si un badge est débloqué
 */
export function isBadgeUnlocked(
  criteria: string,
  cats: { color?: string; created_at?: string; breed?: string; sociability?: string }[],
  sightings: { location_label?: string; photo_url?: string; sighted_at?: string }[],
  favoritesCount: number,
  uniqueCities: Set<string>,
  streakDays: number
): boolean {
  const { current, target } = getCriteriaCount(
    criteria,
    cats,
    sightings,
    favoritesCount,
    uniqueCities,
    streakDays
  );
  return target !== undefined && current >= target;
}

/**
 * Calcule la progression d'un badge
 */
export function getBadgeProgress(
  badge: BadgeWithProgress,
  cats: { color?: string; created_at?: string; breed?: string; sociability?: string }[],
  sightings: { location_label?: string; photo_url?: string; sighted_at?: string }[],
  favoritesCount: number,
  uniqueCities: Set<string>,
  streakDays: number
): BadgeProgress {
  const { current, target } = getCriteriaCount(
    badge.criteria,
    cats,
    sightings,
    favoritesCount,
    uniqueCities,
    streakDays
  );
  const t = target ?? badge.progressTarget ?? 1;
  const percentage = Math.min(100, Math.round((current / t) * 100));
  return {
    badgeId: badge.id,
    current,
    target: t,
    percentage,
  };
}

/**
 * Détermine la couleur associée à un tier
 */
export function getTierColor(tier: BadgeTier): string {
  switch (tier) {
    case "bronze":
      return "#CD7F32";
    case "silver":
      return "#C0C0C0";
    case "gold":
      return "#FFD700";
    case "platinum":
      return "#E5E4E2";
    case "secret":
      return "#7B2D8E";
    default:
      return "#6B6B6B";
  }
}

/**
 * Badge du jour
 */
const DAILY_BADGE_KEY = "@catquest_daily_badge";

export interface DailyBadge {
  badgeId: string;
  date: string;
}

export async function getDailyBadge(availableBadgeIds: string[]): Promise<DailyBadge | null> {
  try {
    const raw = await LocalStorage.getRaw<DailyBadge>(DAILY_BADGE_KEY);
    const today = new Date().toISOString().split("T")[0];

    if (raw && raw.date === today && availableBadgeIds.includes(raw.badgeId)) {
      return raw;
    }

    if (availableBadgeIds.length === 0) return null;

    const randomId = availableBadgeIds[Math.floor(Math.random() * availableBadgeIds.length)];
    const daily: DailyBadge = { badgeId: randomId, date: today };
    await LocalStorage.setRaw(DAILY_BADGE_KEY, daily);
    return daily;
  } catch {
    return null;
  }
}

/**
 * Streak service
 */
const STREAK_KEY = "@catquest_streak";

function getStreakKey(userId: string): string {
  return `${STREAK_KEY}_${userId}`;
}

interface StreakData {
  lastActiveDate: string;
  currentStreak: number;
  longestStreak: number;
  activityDates: string[];
}

export async function updateStreak(userId: string): Promise<void> {
  const streakKey = getStreakKey(userId);
  const today = new Date().toISOString().split("T")[0];
  
  let data: StreakData;
  try {
    const raw = await LocalStorage.getRaw<StreakData>(streakKey);
    if (raw) {
      data = raw;
    } else {
      data = { lastActiveDate: today, currentStreak: 1, longestStreak: 1, activityDates: [today] };
    }
  } catch {
    data = { lastActiveDate: today, currentStreak: 1, longestStreak: 1, activityDates: [today] };
  }

  // Si activité déjà enregistrée aujourd'hui, on ne change rien
  if (data.lastActiveDate === today) return;

  const lastDate = new Date(data.lastActiveDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    data.currentStreak += 1;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  } else if (diffDays > 1) {
    data.currentStreak = 1;
  }

  data.lastActiveDate = today;
  if (!data.activityDates.includes(today)) {
    data.activityDates.push(today);
  }

  await LocalStorage.setRaw(streakKey, data);
}

export async function getStreakData(userId?: string): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const streakKey = userId ? getStreakKey(userId) : STREAK_KEY;
    const data = await LocalStorage.getRaw<StreakData>(streakKey);
    if (!data) return { currentStreak: 0, longestStreak: 0 };
    
    const today = new Date().toISOString().split("T")[0];
    const lastDate = new Date(data.lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Si streak cassée
    if (diffDays > 1) {
      return { currentStreak: 0, longestStreak: data.longestStreak };
    }
    
    return { currentStreak: data.currentStreak, longestStreak: data.longestStreak };
  } catch {
    return { currentStreak: 0, longestStreak: 0 };
  }
}
