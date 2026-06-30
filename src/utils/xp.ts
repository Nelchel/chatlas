import { Cat, Sighting, UserBadge, Activity } from "../types";
import { LocalStorage } from "../services/storage";

export interface LevelInfo {
  level: number;
  totalXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  xpNeeded: number;
  percentage: number;
}

const XP_NEW_CAT = 100;
const XP_SPOTTING = 20;
const XP_NEW_CITY = 200;
const XP_NEW_BADGE = 300;

const QUEST_XP_PREFIX = "@catquest_quest_xp";

function getQuestXPKey(userId: string): string {
  return `${QUEST_XP_PREFIX}_${userId}`;
}

/**
 * Calcule le niveau à partir du total d'XP
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  const level = Math.floor((1 + Math.sqrt(1 + (8 * totalXP) / 100)) / 2);

  const xpForCurrentLevel = 50 * level * (level - 1);
  const xpForNextLevel = 50 * (level + 1) * level;
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const percentage = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));

  return {
    level: Math.max(1, level),
    totalXP,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded,
    percentage,
  };
}

/**
 * Ajoute de l'XP bonus (quêtes, etc.)
 * Stockage per-user pour éviter le partage entre comptes
 */
export async function addXP(userId: string, amount: number): Promise<number> {
  const key = getQuestXPKey(userId);
  const raw = await LocalStorage.getRaw<number>(key);
  const current = raw || 0;
  const updated = current + amount;
  await LocalStorage.setRaw(key, updated);
  return updated;
}

export async function getBonusXP(userId?: string): Promise<number> {
  if (!userId) return 0;
  const key = getQuestXPKey(userId);
  const raw = await LocalStorage.getRaw<number>(key);
  return raw || 0;
}

export async function clearQuestXP(userId: string): Promise<void> {
  await LocalStorage.removeItem(getQuestXPKey(userId));
}

/**
 * Calcule le total d'XP pour un utilisateur à partir de ses données
 */
export function calculateTotalXP(
  cats: Cat[],
  sightings: Sighting[],
  userBadges: UserBadge[],
  userId?: string,
  bonusXP?: number
): number {
  // Filtrer par user si fourni
  const userCats = userId ? cats.filter((c) => c.user_id === userId) : cats;
  const userSightings = userId
    ? sightings.filter((s) => s.user_id === userId)
    : sightings;
  const userUserBadges = userId
    ? userBadges.filter((b) => b.user_id === userId)
    : userBadges;

  let total = 0;

  // Nouveau chat : +100 XP
  total += userCats.length * XP_NEW_CAT;

  // Revoir un chat : +20 XP par sighting (même le premier sighting d'un chat compte comme revu ?
  // Non : le premier sighting est la découverte, pas un revu.
  // Mais on a pas l'info. Prenons tous les sightings - 1 par cat ?
  // Non simplifions : chaque sighting = 20 XP. C'est subjectif.
  // Méthode plus juste : compter les sightings excédentaires.
  const catSightingCounts: Record<string, number> = {};
  for (const s of userSightings) {
    catSightingCounts[s.cat_id] = (catSightingCounts[s.cat_id] || 0) + 1;
  }
  let spottingCount = 0;
  for (const count of Object.values(catSightingCounts)) {
    if (count > 1) {
      spottingCount += count - 1; // seuls les sightings supplémentaires comptent comme "revoir"
    }
  }
  // Alternative : compter aussi le premier sighting comme 20 si le chat a été créé séparément
  // Mais pour l'instant, on dit que chaque sighting est un "revoir", c'est plus simple et généreux
  // en fait:
  total += userSightings.length * XP_SPOTTING;

  // Nouveau quartier : +200 XP par ville unique
  const uniqueCities = new Set(
    userSightings.map((s) => s.location_label).filter(Boolean)
  );
  total += uniqueCities.size * XP_NEW_CITY;

  // Nouveau badge : +300 XP
  total += userUserBadges.length * XP_NEW_BADGE;

  if (bonusXP) {
    total += bonusXP;
  }

  return total;
}

/**
 * Calcule le total d'XP pour un utilisateur à partir de ses activités
 * (utilisé pour le profil public où on a pas les données brutes)
 */
export function calculateTotalXPFromActivities(
  activities: Activity[],
  username: string
): number {
  const userActivities = activities.filter((a) => a.username === username);

  let total = 0;

  for (const a of userActivities) {
    if (a.type === "discovered") {
      total += XP_NEW_CAT + XP_SPOTTING;
    } else {
      total += XP_SPOTTING;
    }
  }

  // On n'a pas l'info badges ni villes depuis les activités seules...
  // On ajoute une estimation basée sur les villes uniques
  const userSightings = userActivities;
  const uniqueCities = new Set(
    userSightings.map((a) => {
      // On n'a pas location_label dans Activity... donc on peut pas calculer ça
      return null;
    }).filter(Boolean)
  );

  // Pour le profil public, on ne peut pas avoir les XP exacts sans les données brutes
  // On renvoie l'estimation basée sur les activités uniquement
  return total;
}

/**
 * Calcule le total d'XP incluant le bonus des quêtes
 */
export async function getTotalXPWithBonus(
  cats: Cat[],
  sightings: Sighting[],
  userBadges: UserBadge[],
  userId?: string
): Promise<number> {
  const base = calculateTotalXP(cats, sightings, userBadges, userId);
  const bonus = await getBonusXP(userId);
  return base + bonus;
}

/**
 * Formate un nombre XP en k/M si besoin
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}
