import { Quest } from "../types";
import { uid } from "../utils/id";

export interface QuestTemplate {
  description: string;
  target: number;
  reward_xp: number;
  category: Quest["category"];
  condition?: string;
}

export const DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    description: "Observer 3 chats",
    target: 3,
    reward_xp: 50,
    category: "observation",
    condition: "observations:3",
  },
  {
    description: "Observer 2 chats roux",
    target: 2,
    reward_xp: 100,
    category: "color",
    condition: "color:Roux",
  },
  {
    description: "Observer 1 chat noir",
    target: 1,
    reward_xp: 75,
    category: "color",
    condition: "color:Noir",
  },
  {
    description: "Commenter 1 observation",
    target: 1,
    reward_xp: 50,
    category: "social",
    condition: "comments:1",
  },
];

export const WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    description: "Voir 15 chats différents",
    target: 15,
    reward_xp: 300,
    category: "observation",
    condition: "observations:15",
  },
  {
    description: "Ajouter 5 nouveaux chats",
    target: 5,
    reward_xp: 400,
    category: "count",
    condition: "add_cat:5",
  },
  {
    description: "Faire 10 observations",
    target: 10,
    reward_xp: 250,
    category: "observation",
    condition: "observations:10",
  },
];

export const ONE_TIME_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    description: "Premier chat ajouté",
    target: 1,
    reward_xp: 50,
    category: "count",
    condition: "first_cat",
  },
  {
    description: "Premier commentaire",
    target: 1,
    reward_xp: 25,
    category: "social",
    condition: "first_comment",
  },
  {
    description: "Premier partage",
    target: 1,
    reward_xp: 50,
    category: "social",
    condition: "first_share",
  },
  {
    description: "10 chats découverts",
    target: 10,
    reward_xp: 200,
    category: "count",
    condition: "ten_cats",
  },
  {
    description: "Première ville",
    target: 1,
    reward_xp: 100,
    category: "exploration",
    condition: "first_city",
  },
];

export function getEndOfDay(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function getEndOfWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = 7 - day; // days until next Sunday
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function generateDailyQuest(): Quest {
  const template = DAILY_QUEST_TEMPLATES[Math.floor(Math.random() * DAILY_QUEST_TEMPLATES.length)];
  return {
    id: `daily_${uid()}`,
    title: "Mission du jour",
    description: template.description,
    type: "daily",
    category: template.category,
    target: template.target,
    condition: template.condition,
    reward_xp: template.reward_xp,
    completed: false,
    progress: 0,
    created_at: new Date().toISOString(),
    expires_at: getEndOfDay(),
  };
}

export function generateWeeklyQuests(): Quest[] {
  return WEEKLY_QUEST_TEMPLATES.map((template) => ({
    id: `weekly_${uid()}`,
    title: "Défi hebdomadaire",
    description: template.description,
    type: "weekly",
    category: template.category,
    target: template.target,
    condition: template.condition,
    reward_xp: template.reward_xp,
    completed: false,
    progress: 0,
    created_at: new Date().toISOString(),
    expires_at: getEndOfWeek(),
  }));
}

export function getOneTimeQuests(): Quest[] {
  return ONE_TIME_QUEST_TEMPLATES.map((template, i) => ({
    id: `on_${template.condition || i}`,
    title: "Succès",
    description: template.description,
    type: "one_time",
    category: template.category,
    target: template.target,
    condition: template.condition,
    reward_xp: template.reward_xp,
    completed: false,
    progress: 0,
    created_at: new Date().toISOString(),
  }));
}
