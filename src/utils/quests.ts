import { Quest, Cat, Sighting, SightingComment } from "../types";
import { LocalStorage } from "../services/storage";
import {
  generateDailyQuest,
  generateWeeklyQuests,
  getOneTimeQuests,
} from "../constants/quests";

const DAILY_QUEST_DATE_KEY = "@catquest_daily_quest_date";

export async function getActiveQuests(): Promise<Quest[]> {
  const stored = await LocalStorage.getQuests();
  const oneTime = getOneTimeQuests();

  // Merge stored one_time quests to preserve completion state
  const storedOneTime = stored.filter((q) => q.type === "one_time");
  const oneTimeMap = new Map(storedOneTime.map((q) => [q.id, q]));
  const mergedOneTime = oneTime.map((quest) => {
    const stored = oneTimeMap.get(quest.id);
    return stored ? { ...quest, ...stored } : quest;
  });

  // Check daily quest
  const today = new Date().toISOString().split("T")[0];
  const storedDailyDate = await LocalStorage.getRaw<string>(DAILY_QUEST_DATE_KEY);
  let dailyQuest: Quest;
  const existingDaily = stored.find((q) => q.type === "daily");

  if (storedDailyDate === today && existingDaily) {
    dailyQuest = existingDaily;
  } else {
    dailyQuest = generateDailyQuest();
    await LocalStorage.setRaw(DAILY_QUEST_DATE_KEY, today);
  }

  // Check weekly quests
  const weekStart = getWeekStart();
  const existingWeekly = stored.filter((q) => q.type === "weekly");
  const currentWeekStart = existingWeekly[0]?.created_at
    ? getWeekStart(new Date(existingWeekly[0].created_at))
    : null;

  let weeklyQuests: Quest[];
  if (currentWeekStart === weekStart && existingWeekly.length > 0) {
    weeklyQuests = existingWeekly;
  } else {
    weeklyQuests = generateWeeklyQuests();
  }

  return [...mergedOneTime, dailyQuest, ...weeklyQuests];
}

function getWeekStart(d = new Date()): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split("T")[0];
}

interface QuestStats {
  cats: Cat[];
  sightings: Sighting[];
  comments: SightingComment[];
}

export function evaluateOneTimeQuests(
  quests: Quest[],
  stats: QuestStats,
  onComplete?: (quest: Quest) => void
): Quest[] {
  return quests.map((quest) => {
    if (quest.type !== "one_time" || quest.completed) return quest;

    let progress = 0;

    switch (quest.condition) {
      case "first_cat":
      case "ten_cats":
        progress = stats.cats.length;
        break;
      case "first_comment":
        progress = stats.comments.length;
        break;
      case "first_city":
        progress = new Set(
          stats.sightings.map((s) => s.location_label).filter(Boolean)
        ).size;
        break;
      case "first_share":
        progress = quest.progress;
        break;
      default:
        progress = quest.progress;
    }

    const completed = progress >= (quest.target || 1);
    const wasCompleted = quest.completed;

    if (completed && !wasCompleted && onComplete) {
      onComplete({ ...quest, progress, completed: true });
    }

    return { ...quest, progress, completed };
  });
}

export function evaluateDailyWeeklyQuests(
  quests: Quest[],
  actionType: string,
  data?: { catColor?: string }
): { updatedQuests: Quest[]; completedQuests: Quest[] } {
  const completedQuests: Quest[] = [];

  const updated = quests.map((quest) => {
    if (quest.type === "one_time" || quest.completed) return quest;

    const shouldIncrement = matchesAction(quest, actionType, data);
    if (!shouldIncrement) return quest;

    const progress = (quest.progress || 0) + 1;
    const completed = progress >= (quest.target || 1);

    if (completed) {
      completedQuests.push({ ...quest, progress, completed: true });
    }

    return { ...quest, progress, completed };
  });

  return { updatedQuests: updated, completedQuests };
}

function matchesAction(
  quest: Quest,
  actionType: string,
  data?: { catColor?: string }
): boolean {
  switch (actionType) {
    case "add_sighting": {
      if (quest.category === "observation") return true;
      if (
        quest.category === "color" &&
        quest.condition?.startsWith("color:")
      ) {
        const targetColor = quest.condition.split(":")[1].toLowerCase();
        const catColor = data?.catColor?.toLowerCase() || "";
        return catColor.includes(targetColor);
      }
      return false;
    }
    case "add_cat": {
      if (quest.category === "count") return true;
      if (quest.category === "color" && quest.condition?.startsWith("color:")) {
        const targetColor = quest.condition.split(":")[1].toLowerCase();
        const catColor = data?.catColor?.toLowerCase() || "";
        return catColor.includes(targetColor);
      }
      return false;
    }
    case "add_comment": {
      if (quest.category === "social") return true;
      return false;
    }
    default:
      return false;
  }
}

export function formatTimeRemaining(expiresAt?: string): string {
  if (!expiresAt) return "";
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return "Expiré";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}
