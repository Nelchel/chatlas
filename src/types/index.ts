export interface Cat {
  id: string;
  user_id: string;
  name?: string;
  photo_url: string;
  photos: string[];
  breed?: string;
  color?: string;
  sex?: "male" | "female" | "unknown";
  estimated_age?: "chaton" | "adulte" | "senior";
  sociability?: string;
  behaviors?: {
    sociable?: boolean;
    aggressive?: boolean;
    gourmand?: boolean;
    sleepy?: boolean;
  };
  note?: string;
  created_at: string;
}

export interface Sighting {
  id: string;
  cat_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  notes?: string;
  sighted_at: string;
  location_label?: string;
}

export interface SightingLike {
  id: string;
  sighting_id: string;
  user_id: string;
  created_at: string;
}

export interface SightingComment {
  id: string;
  sighting_id: string;
  user_id: string;
  username: string;
  text: string;
  created_at: string;
}

export interface SightingWithLikes extends Sighting {
  like_count?: number;
  is_liked?: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  cat_id: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  tier?: "bronze" | "silver" | "gold" | "platinum" | "secret";
  hidden?: boolean;
  progressTarget?: number;
  criteriaType?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress?: number;
}

export interface Activity {
  id: string;
  user_id: string;
  username: string;
  type: "discovered" | "spotted";
  cat_id: string;
  cat_name: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  cat_id: string;
  reason: string;
  description?: string;
  created_at: string;
}

export type QuestType = "daily" | "weekly" | "one_time";
export type QuestCategory = "color" | "count" | "observation" | "social" | "exploration";

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  category?: QuestCategory;
  target?: number;
  condition?: string;
  reward_xp: number;
  completed: boolean;
  progress: number;
  created_at: string;
  expires_at?: string;
}

export type AuthProvider = "google" | "apple" | "email" | "anonymous";

export interface UserProfile {
  id: string;
  username: string;
  email?: string | null;
  avatar_url?: string | null;
  auth_provider: AuthProvider;
  is_admin?: boolean;
  total_cats: number;
  total_sightings: number;
  total_favorites: number;
  badges: Badge[];
  created_at: string;
}

export interface CatWithSightings extends Cat {
  sightings: Sighting[];
  is_favorite?: boolean;
}

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  CatDetail: { catId: string };
  CaptureCat: { latitude: number; longitude: number };
  Leaderboard: undefined;
  BugReport: undefined;
  Badges: undefined;
  Quests: undefined;
  Stats: undefined;
  PublicProfile: { username: string; rank: number };
};

export type TabParamList = {
  HomeMap: undefined;
  Capture: undefined;
  Activity: undefined;
  Collection: undefined;
  Quests: undefined;
  Profile: undefined;
};

export type MockMode = "firebase" | "local";
