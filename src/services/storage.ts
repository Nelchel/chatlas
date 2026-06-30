import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cat, Sighting, Favorite, Badge, UserBadge, Activity, SightingLike, SightingComment, Follow, Quest } from "../types";

export const STORAGE_KEYS = {
  CATS: "@catquest_cats",
  SIGHTINGS: "@catquest_sightings",
  FAVORITES: "@catquest_favorites",
  BADGES: "@catquest_badges",
  USER_BADGES: "@catquest_user_badges",
  USERNAME: "@catquest_username",
  DELETED_CAT_IDS: "@catquest_deleted_cat_ids",
  ACTIVITIES: "@catquest_activities",
  SIGHTING_LIKES: "@catquest_sighting_likes",
  SIGHTING_COMMENTS: "@catquest_sighting_comments",
  FOLLOWS: "@catquest_follows",
  QUESTS: "@catquest_quests",
};

async function getItem<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setItem<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export const LocalStorage = {
  async getRaw<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },

  async setRaw<T>(key: string, data: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async getCats(): Promise<Cat[]> {
    return getItem<Cat>(STORAGE_KEYS.CATS);
  },

  async saveCat(cat: Cat): Promise<void> {
    const cats = await this.getCats();
    cats.push(cat);
    await setItem(STORAGE_KEYS.CATS, cats);
  },

  async updateCat(catId: string, updates: Partial<Cat>): Promise<void> {
    const cats = await this.getCats();
    const index = cats.findIndex((c) => c.id === catId);
    if (index !== -1) {
      cats[index] = { ...cats[index], ...updates };
      await setItem(STORAGE_KEYS.CATS, cats);
    }
  },

  async getSightings(): Promise<Sighting[]> {
    return getItem<Sighting>(STORAGE_KEYS.SIGHTINGS);
  },

  async getSightingLikes(): Promise<SightingLike[]> {
    return getItem<SightingLike>(STORAGE_KEYS.SIGHTING_LIKES);
  },

  async saveSightingLike(like: SightingLike): Promise<void> {
    const likes = await this.getSightingLikes();
    likes.push(like);
    await setItem(STORAGE_KEYS.SIGHTING_LIKES, likes);
  },

  async removeSightingLike(sightingId: string, userId: string): Promise<void> {
    const likes = await this.getSightingLikes();
    const filtered = likes.filter((l) => !(l.sighting_id === sightingId && l.user_id === userId));
    await setItem(STORAGE_KEYS.SIGHTING_LIKES, filtered);
  },

  async getSightingComments(): Promise<SightingComment[]> {
    return getItem<SightingComment>(STORAGE_KEYS.SIGHTING_COMMENTS);
  },

  async addSightingComment(comment: SightingComment): Promise<void> {
    const comments = await this.getSightingComments();
    comments.push(comment);
    await setItem(STORAGE_KEYS.SIGHTING_COMMENTS, comments);
  },

  async saveSighting(sighting: Sighting): Promise<void> {
    const sightings = await this.getSightings();
    sightings.push(sighting);
    await setItem(STORAGE_KEYS.SIGHTINGS, sightings);
  },

  async getFavorites(): Promise<Favorite[]> {
    return getItem<Favorite>(STORAGE_KEYS.FAVORITES);
  },

  async addFavorite(favorite: Favorite): Promise<void> {
    const favorites = await this.getFavorites();
    favorites.push(favorite);
    await setItem(STORAGE_KEYS.FAVORITES, favorites);
  },

  async removeFavorite(catId: string): Promise<void> {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter((f) => f.cat_id !== catId);
    await setItem(STORAGE_KEYS.FAVORITES, filtered);
  },

  async isFavorite(catId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some((f) => f.cat_id === catId);
  },

  async getBadges(): Promise<Badge[]> {
    return getItem<Badge>(STORAGE_KEYS.BADGES);
  },

  async saveBadge(badge: Badge): Promise<void> {
    const badges = await this.getBadges();
    badges.push(badge);
    await setItem(STORAGE_KEYS.BADGES, badges);
  },

  async getUserBadges(): Promise<UserBadge[]> {
    return getItem<UserBadge>(STORAGE_KEYS.USER_BADGES);
  },

  async earnBadge(userBadge: UserBadge): Promise<void> {
    const badges = await this.getUserBadges();
    badges.push(userBadge);
    await setItem(STORAGE_KEYS.USER_BADGES, badges);
  },

  async getUsername(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.USERNAME);
  },

  async setUsername(name: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, name);
  },

  async addDeletedCatId(catId: string): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_CAT_IDS);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(catId)) {
      ids.push(catId);
      await AsyncStorage.setItem(STORAGE_KEYS.DELETED_CAT_IDS, JSON.stringify(ids));
    }
  },

  async getDeletedCatIds(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_CAT_IDS);
    return raw ? JSON.parse(raw) : [];
  },

  async getActivities(): Promise<Activity[]> {
    return getItem<Activity>(STORAGE_KEYS.ACTIVITIES);
  },

  async addActivity(activity: Activity): Promise<void> {
    const activities = await this.getActivities();
    activities.unshift(activity);
    await setItem(STORAGE_KEYS.ACTIVITIES, activities);
  },

  async getFollows(): Promise<Follow[]> {
    return getItem<Follow>(STORAGE_KEYS.FOLLOWS);
  },

  async addFollow(follow: Follow): Promise<void> {
    const follows = await this.getFollows();
    const exists = follows.some(
      (f) => f.follower_id === follow.follower_id && f.following_id === follow.following_id
    );
    if (!exists) {
      follows.push(follow);
      await setItem(STORAGE_KEYS.FOLLOWS, follows);
    }
  },

  async removeFollow(followerId: string, followingId: string): Promise<void> {
    const follows = await this.getFollows();
    const filtered = follows.filter(
      (f) => !(f.follower_id === followerId && f.following_id === followingId)
    );
    await setItem(STORAGE_KEYS.FOLLOWS, filtered);
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follows = await this.getFollows();
    return follows.some(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
  },

  async mergeCats(keepId: string, removeId: string): Promise<void> {
    const [cats, sightings, favs] = await Promise.all([
      this.getCats(),
      this.getSightings(),
      this.getFavorites(),
    ]);

    const mergedSightings = sightings.map((s) =>
      s.cat_id === removeId ? { ...s, cat_id: keepId } : s
    );
    const mergedFavs = favs.map((f) =>
      f.cat_id === removeId ? { ...f, cat_id: keepId } : f
    );
    const mergedCats = cats.filter((c) => c.id !== removeId);

    await Promise.all([
      setItem(STORAGE_KEYS.CATS, mergedCats),
      setItem(STORAGE_KEYS.SIGHTINGS, mergedSightings),
      setItem(STORAGE_KEYS.FAVORITES, mergedFavs),
    ]);
  },

  async getQuests(): Promise<Quest[]> {
    return getItem<Quest>(STORAGE_KEYS.QUESTS);
  },

  async saveQuests(quests: Quest[]): Promise<void> {
    await setItem(STORAGE_KEYS.QUESTS, quests);
  },

  async updateQuestProgress(questId: string, progress: number): Promise<void> {
    const quests = await this.getQuests();
    const index = quests.findIndex((q) => q.id === questId);
    if (index !== -1) {
      quests[index] = { ...quests[index], progress };
      await setItem(STORAGE_KEYS.QUESTS, quests);
    }
  },

  async clearUserData(): Promise<void> {
    const keysToRemove = [
      STORAGE_KEYS.CATS,
      STORAGE_KEYS.SIGHTINGS,
      STORAGE_KEYS.FAVORITES,
      STORAGE_KEYS.BADGES,
      STORAGE_KEYS.USER_BADGES,
      STORAGE_KEYS.DELETED_CAT_IDS,
      STORAGE_KEYS.ACTIVITIES,
      STORAGE_KEYS.SIGHTING_LIKES,
      STORAGE_KEYS.SIGHTING_COMMENTS,
      STORAGE_KEYS.FOLLOWS,
      STORAGE_KEYS.QUESTS,
    ];
    await AsyncStorage.multiRemove(keysToRemove);
  },
};
