import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { uid } from "../utils/id";
import { Cat, Sighting, Favorite, UserBadge, Activity, SightingLike, SightingComment, Follow, Quest } from "../types";
import { getMode } from "../services/mode";
import { LocalStorage, STORAGE_KEYS } from "../services/storage";
import { addXP } from "../utils/xp";
import { getActiveQuests, evaluateOneTimeQuests, evaluateDailyWeeklyQuests } from "../utils/quests";
import { CatCloud, SightingCloud, FavoriteCloud, BadgeCloud, CatMerge, ActivityCloud, FollowCloud, SightingLikeCloud, SightingCommentCloud } from "../services/catCloudService";
import { ALL_BADGES } from "../constants/badges";
import { isBadgeUnlocked, getStreakData, updateStreak } from "../utils/badges";

type CloudStatus = "local" | "cloud" | "offline";

function stripMock<T extends { id: string }>(items: T[]): T[] {
  return items.filter((i) => !i.id.startsWith("mock_"));
}

function dedupById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function useCats() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [sightingLikes, setSightingLikes] = useState<SightingLike[]>([]);
  const [sightingComments, setSightingComments] = useState<SightingComment[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");

  const mode = getMode();
  const isFirebase = mode === "firebase";

  const checkBadges = useCallback(
    async (userId: string, alreadyEarnedIds?: string[]) => {
      let allCats: Cat[] = [];
      let allSightings: Sighting[] = [];
      let allFavs: Favorite[] = [];

      try {
        if (isFirebase) {
          const [cloudCats, cloudFavs, cloudSights] = await Promise.all([
            CatCloud.getByUser(userId),
            FavoriteCloud.getAll(userId),
            SightingCloud.getByUser(userId),
          ]);
          allCats = cloudCats;
          allFavs = cloudFavs;
          allSightings = cloudSights;
          setCloudStatus("cloud");
        } else {
          const [localCats, localFavs, localSights] = await Promise.all([
            LocalStorage.getCats(),
            LocalStorage.getFavorites(),
            LocalStorage.getSightings(),
          ]);
          allCats = localCats;
          allFavs = localFavs;
          allSightings = localSights;
        }
      } catch {
        const [localCats, localFavs, localSights] = await Promise.all([
          LocalStorage.getCats(),
          LocalStorage.getFavorites(),
          LocalStorage.getSightings(),
        ]);
        allCats = localCats;
        allFavs = localFavs;
        allSightings = localSights;
        setCloudStatus("offline");
      }

      let existingBadges: UserBadge[];
      if (alreadyEarnedIds) {
        // On a juste les IDs, pas les objets complets
        existingBadges = alreadyEarnedIds.map((bid) => ({
          id: uid(),
          user_id: userId,
          badge_id: bid,
          earned_at: new Date().toISOString(),
        }));
      } else if (isFirebase) {
        existingBadges = await BadgeCloud.getAll(userId);
      } else {
        existingBadges = await LocalStorage.getUserBadges();
      }
      const earnedIds = existingBadges.map((b) => b.badge_id);
      const newBadges: UserBadge[] = [];
      const removedBadges: string[] = [];

      // Filtrer par user pour éviter les données d'autres comptes sur le même device
      const userCats = allCats.filter((c) => c.user_id === userId);
      const userSightings = allSightings.filter((s) => s.user_id === userId);
      const userFavs = allFavs.filter((f) => f.user_id === userId);

      const uniqueCities = new Set(userSightings.map((s) => s.location_label).filter((label): label is string => Boolean(label)));

      const { currentStreak } = await getStreakData(userId);

      // Vérifier les badges existants et supprimer ceux qui ne sont plus valides
      for (const badge of ALL_BADGES) {
        if (earnedIds.includes(badge.id)) {
          const unlocked = isBadgeUnlocked(
            badge.criteria,
            userCats,
            userSightings,
            userFavs.length,
            uniqueCities,
            currentStreak
          );
          if (!unlocked) {
            removedBadges.push(badge.id);
            const badgeObj = existingBadges.find((b) => b.badge_id === badge.id);
            if (badgeObj) {
              try {
                if (isFirebase) {
                  await BadgeCloud.deleteBadge(badgeObj.id);
                } else {
                  await LocalStorage.removeBadge(badge.id);
                }
              } catch (e) {
                console.warn("Failed to remove invalid badge:", badge.id, e);
              }
            }
          }
        }
      }

      // Vérifier les nouveaux badges
      for (const badge of ALL_BADGES) {
        if (earnedIds.includes(badge.id) || removedBadges.includes(badge.id)) continue;

        const unlocked = isBadgeUnlocked(
          badge.criteria,
          userCats,
          userSightings,
          userFavs.length,
          uniqueCities,
          currentStreak
        );

        if (unlocked) {
          const ub: UserBadge = {
            id: uid(),
            user_id: userId,
            badge_id: badge.id,
            earned_at: new Date().toISOString(),
          };
          newBadges.push(ub);

          try {
            if (isFirebase) {
              await BadgeCloud.saveBadge(ub);
            } else {
              await LocalStorage.earnBadge(ub);
            }
          } catch {
            await LocalStorage.earnBadge(ub);
          }
        }
      }

      if (newBadges.length > 0 || removedBadges.length > 0) {
        setUserBadges((prev) => {
          let updated = prev;
          if (removedBadges.length > 0) {
            updated = prev.filter((b) => !removedBadges.includes(b.badge_id));
          }
          if (newBadges.length > 0) {
            updated = [...updated, ...newBadges];
          }
          return updated;
        });
      }

      return { newBadges, removedBadges };
    },
    [isFirebase]
  );

  const handleQuestComplete = useCallback(
    async (quest: Quest, userId: string) => {
      await addXP(userId, quest.reward_xp);
      Alert.alert(
        "Quête accomplie !",
        `${quest.description}\n+${quest.reward_xp} XP gagnés !`
      );
    },
    []
  );

  const checkQuestProgress = useCallback(
    async (actionType: string, data?: { catColor?: string; userId?: string }) => {
      const userId = data?.userId || "mock_user";
      let activeQuests = await getActiveQuests();

      // Evaluate one_time quests based on current stats
      activeQuests = evaluateOneTimeQuests(
        activeQuests,
        { cats, sightings, comments: sightingComments },
        (quest) => handleQuestComplete(quest, userId)
      );

      // Evaluate daily/weekly quests for this action
      const { updatedQuests, completedQuests } = evaluateDailyWeeklyQuests(
        activeQuests,
        actionType,
        data
      );

      for (const quest of completedQuests) {
        await handleQuestComplete(quest, userId);
      }

      const finalQuests = completedQuests.length > 0
        ? updatedQuests.map((q) => {
            const completed = completedQuests.find((c) => c.id === q.id);
            return completed ? { ...q, ...completed } : q;
          })
        : updatedQuests;

      await LocalStorage.saveQuests(finalQuests);
      setQuests(finalQuests);
    },
    [cats, sightings, sightingComments, handleQuestComplete]
  );

  const loadData = useCallback(async () => {
    try {
      if (isFirebase) {
        try {
          const { auth } = await import("../services/firebase");
          const currentUser = auth?.currentUser;

          if (!currentUser) {
            throw new Error("Auth pas encore prêt");
          }

          const [cloudCats, cloudSights, cloudFavs, cloudBadges, cloudActivities, cloudFollows, cloudSightingLikes, cloudSightingComments, localCats, localSights, localFavs, localActivities, localSightingLikes, localSightingComments, localFollows] =
            await Promise.all([
              CatCloud.getByUser(currentUser.uid),
              SightingCloud.getAll(),
              FavoriteCloud.getAll(currentUser.uid),
              BadgeCloud.getAll(currentUser.uid),
              ActivityCloud.getAll(),
              FollowCloud.getAll(currentUser.uid),
              SightingLikeCloud.getAll(),
              SightingCommentCloud.getAll(),
              LocalStorage.getCats(),
              LocalStorage.getSightings(),
              LocalStorage.getFavorites(),
              LocalStorage.getActivities(),
              LocalStorage.getSightingLikes(),
              LocalStorage.getSightingComments(),
              LocalStorage.getFollows(),
            ]);

          const mergedCats = [...cloudCats];
          for (const lc of stripMock(localCats)) {
            if (!mergedCats.find((c) => c.id === lc.id)) {
              mergedCats.push(lc);
            }
          }
          const deletedIds = await LocalStorage.getDeletedCatIds();
          let filteredCats = dedupById(mergedCats).filter((c) => !deletedIds.includes(c.id));
          if (currentUser) {
            filteredCats = filteredCats.filter((c) => c.user_id === currentUser.uid);
          }
          const mergedSights = [...cloudSights];
          for (const ls of stripMock(localSights)) {
            if (!mergedSights.find((s) => s.id === ls.id)) {
              mergedSights.push(ls);
            }
          }
          const mergedFavs = [...cloudFavs];
          for (const lf of stripMock(localFavs)) {
            if (!mergedFavs.find((f) => f.id === lf.id)) {
              mergedFavs.push(lf);
            }
          }

          const mergedActivities = [...cloudActivities];
          for (const la of localActivities) {
            if (!mergedActivities.find((a) => a.id === la.id)) {
              mergedActivities.push(la);
            }
          }
          mergedActivities.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const mergedFollows = [...cloudFollows];
          for (const lf of localFollows) {
            if (!mergedFollows.find((f) => f.id === lf.id)) {
              mergedFollows.push(lf);
            }
          }
          const mergedSightingLikes = [...cloudSightingLikes];
          for (const ll of localSightingLikes) {
            if (!mergedSightingLikes.find((l) => l.id === ll.id)) {
              mergedSightingLikes.push(ll);
            }
          }
          const mergedSightingComments = [...cloudSightingComments];
          for (const lc of localSightingComments) {
            if (!mergedSightingComments.find((c) => c.id === lc.id)) {
              mergedSightingComments.push(lc);
            }
          }

          setCats(filteredCats);
          setSightings(dedupById(mergedSights));
          setFavorites(dedupById(mergedFavs));
          setActivities(dedupById(mergedActivities));
          setSightingLikes(dedupById(mergedSightingLikes));
          setSightingComments(dedupById(mergedSightingComments));
          setFollows(dedupById(mergedFollows));
          
          // Set initial badges from cloud, then let checkBadges clean up invalid ones and add new ones
          const uniqueCloudBadges = Array.from(
            new Map(cloudBadges.map((b) => [b.badge_id, b])).values()
          );
          setUserBadges(uniqueCloudBadges);
          await checkBadges(currentUser.uid);
          setCloudStatus("cloud");

          const loadedQuests = await getActiveQuests();
          const evaluatedQuests = evaluateOneTimeQuests(loadedQuests, {
            cats: filteredCats,
            sightings: dedupById(mergedSights),
            comments: dedupById(mergedSightingComments),
          });
          await LocalStorage.saveQuests(evaluatedQuests);
          setQuests(evaluatedQuests);

          await LocalStorage.setRaw(STORAGE_KEYS.CATS, filteredCats);
          await LocalStorage.setRaw(STORAGE_KEYS.SIGHTINGS, dedupById(mergedSights));
          await LocalStorage.setRaw(STORAGE_KEYS.FAVORITES, dedupById(mergedFavs));
          await LocalStorage.setRaw(STORAGE_KEYS.ACTIVITIES, dedupById(mergedActivities));
          await LocalStorage.setRaw(STORAGE_KEYS.SIGHTING_LIKES, dedupById(mergedSightingLikes));
          await LocalStorage.setRaw(STORAGE_KEYS.SIGHTING_COMMENTS, dedupById(mergedSightingComments));
          await LocalStorage.setRaw(STORAGE_KEYS.FOLLOWS, dedupById(mergedFollows));
        } catch {
           setCloudStatus("offline");
          const [localCats, localSights, localFavs, localBadges, localActivities, localSightingLikes, localSightingComments, localFollows] = await Promise.all([
            LocalStorage.getCats(),
            LocalStorage.getSightings(),
            LocalStorage.getFavorites(),
            LocalStorage.getUserBadges(),
            LocalStorage.getActivities(),
            LocalStorage.getSightingLikes(),
            LocalStorage.getSightingComments(),
            LocalStorage.getFollows(),
          ]);
          const deletedIds = await LocalStorage.getDeletedCatIds();
          setCats(dedupById(stripMock(localCats)).filter((c) => !deletedIds.includes(c.id)));
          setSightings(dedupById(stripMock(localSights)));
          setFavorites(dedupById(stripMock(localFavs)));
          setActivities(dedupById(localActivities));
          setSightingLikes(dedupById(localSightingLikes));
          setSightingComments(dedupById(localSightingComments));
          setFollows(dedupById(localFollows));

          const firebaseFallbackQuests = await getActiveQuests();
          const firebaseFallbackEvaluated = evaluateOneTimeQuests(firebaseFallbackQuests, {
            cats: dedupById(stripMock(localCats)).filter((c) => !deletedIds.includes(c.id)),
            sightings: dedupById(stripMock(localSights)),
            comments: dedupById(localSightingComments),
          });
          await LocalStorage.saveQuests(firebaseFallbackEvaluated);
          setQuests(firebaseFallbackEvaluated);
        }
      } else {
        let [localCats, localSightings, localFavs, localBadges, localActivities, localSightingLikes, localSightingComments, localFollows] =
          await Promise.all([
            LocalStorage.getCats(),
            LocalStorage.getSightings(),
            LocalStorage.getFavorites(),
            LocalStorage.getUserBadges(),
            LocalStorage.getActivities(),
            LocalStorage.getSightingLikes(),
            LocalStorage.getSightingComments(),
            LocalStorage.getFollows(),
          ]);

        const hadMock =
          localCats.some((c) => c.id.startsWith("mock_")) ||
          localSightings.some((s) => s.id.startsWith("mock_"));
        if (hadMock) {
          localCats = stripMock(localCats);
          localSightings = stripMock(localSightings);
          localFavs = stripMock(localFavs);
          await LocalStorage.setRaw(STORAGE_KEYS.CATS, localCats);
          await LocalStorage.setRaw(STORAGE_KEYS.SIGHTINGS, localSightings);
          await LocalStorage.setRaw(STORAGE_KEYS.FAVORITES, localFavs);
        }

         const deletedIds = await LocalStorage.getDeletedCatIds();
         setCats(dedupById(localCats).filter((c) => !deletedIds.includes(c.id)));
         setSightings(dedupById(localSightings));
         setFavorites(dedupById(localFavs));
         setActivities(dedupById(localActivities));
         setSightingLikes(dedupById(localSightingLikes));
         setSightingComments(dedupById(localSightingComments));
         setFollows(dedupById(localFollows));
         setUserBadges(Array.from(new Map(localBadges.map((b) => [b.badge_id, b])).values()));

         const localQuests = await getActiveQuests();
         const localEvaluated = evaluateOneTimeQuests(localQuests, {
           cats: dedupById(localCats).filter((c) => !deletedIds.includes(c.id)),
           sightings: dedupById(localSightings),
           comments: dedupById(localSightingComments),
         });
          await LocalStorage.saveQuests(localEvaluated);
          setQuests(localEvaluated);

          // checkBadges handles state updates internally (removes invalid, adds new)
          await checkBadges("mock_user");
       }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [isFirebase, checkBadges]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recordActivity = useCallback(
    async (type: Activity["type"], catId: string, catName: string, userId: string) => {
      const username = (await LocalStorage.getUsername()) || "CatExplorer";
      const activity: Activity = {
        id: uid(),
        user_id: userId,
        username,
        type,
        cat_id: catId,
        cat_name: catName,
        created_at: new Date().toISOString(),
      };

      try {
        if (isFirebase) {
          await ActivityCloud.add(activity);
        }
      } catch {
        // fallback: local only
      }
      await LocalStorage.addActivity(activity).catch(() => {});
      setActivities((prev) =>
        prev.find((a) => a.id === activity.id) ? prev : [activity, ...prev]
      );
    },
    [isFirebase]
  );

  const addCat = useCallback(
    async (cat: Omit<Cat, "id" | "created_at">) => {
      const newCat: Cat = {
        ...cat,
        id: uid(),
        created_at: new Date().toISOString(),
      };

      try {
        if (isFirebase) {
          const cloudCat = await CatCloud.create(newCat, cat.photo_url);
          await LocalStorage.saveCat(cloudCat).catch(() => {});
          setCats((prev) =>
            prev.find((c) => c.id === cloudCat.id) ? prev : [...prev, cloudCat]
          );
          await checkBadges(newCat.user_id);
          await updateStreak(newCat.user_id).catch(() => {});
          setCloudStatus("cloud");
          await checkQuestProgress("add_cat", { userId: newCat.user_id, catColor: cat.color }).catch(() => {});
          await recordActivity("discovered", cloudCat.id, cloudCat.name || "Chat inconnu", newCat.user_id);
          return cloudCat;
        } else {
          await LocalStorage.saveCat(newCat);
        }
      } catch (e) {
        console.error("addCat error, fallback local:", e);
        await LocalStorage.saveCat(newCat).catch(() => {});
        setCloudStatus("offline");
      }

      setCats((prev) =>
        prev.find((c) => c.id === newCat.id) ? prev : [...prev, newCat]
      );
      await checkBadges(newCat.user_id).catch(() => {});
      await updateStreak(newCat.user_id).catch(() => {});
      await checkQuestProgress("add_cat", { userId: newCat.user_id, catColor: cat.color }).catch(() => {});
      await recordActivity("discovered", newCat.id, newCat.name || "Chat inconnu", newCat.user_id);
      return newCat;
    },
    [isFirebase, checkBadges, recordActivity, checkQuestProgress]
  );

  const addSighting = useCallback(
    async (sighting: Omit<Sighting, "id">) => {
      const newSighting: Sighting = {
        ...sighting,
        id: uid(),
      };

      const addPhotoToCatState = (catId: string, photoUrl: string) => {
        if (!photoUrl) return;
        setCats((prev) =>
          prev.map((c) =>
            c.id === catId && !c.photos.includes(photoUrl)
              ? { ...c, photos: [...c.photos, photoUrl], photo_url: photoUrl }
              : c
          )
        );
      };

      try {
        if (isFirebase) {
          const cloudSighting = await SightingCloud.create(newSighting, sighting.photo_url);
          await LocalStorage.saveSighting(cloudSighting).catch(() => {});
          setSightings((prev) =>
            prev.find((s) => s.id === cloudSighting.id) ? prev : [...prev, cloudSighting]
          );

          if (cloudSighting.photo_url) {
            const uploaded = await CatCloud.addPhoto(
              cloudSighting.cat_id, cloudSighting.user_id, cloudSighting.photo_url
            ).catch(() => null);
            if (uploaded) {
              addPhotoToCatState(cloudSighting.cat_id, uploaded);
              await LocalStorage.updateCat(cloudSighting.cat_id, {
                photos: [...(cats.find((c) => c.id === cloudSighting.cat_id)?.photos || []), uploaded],
                photo_url: uploaded,
              }).catch(() => {});
            }
          }

          setCloudStatus("cloud");
          const sightedCat = cats.find((c) => c.id === cloudSighting.cat_id);
          if (sightedCat) {
            await recordActivity("spotted", sightedCat.id, sightedCat.name || "Chat inconnu", cloudSighting.user_id);
          }
          await checkBadges(cloudSighting.user_id);
          await updateStreak(cloudSighting.user_id).catch(() => {});
          await checkQuestProgress("add_sighting", {
            userId: cloudSighting.user_id,
            catColor: sightedCat?.color,
          }).catch(() => {});
          return cloudSighting;
        } else {
          await LocalStorage.saveSighting(newSighting);
          if (newSighting.photo_url) {
            addPhotoToCatState(newSighting.cat_id, newSighting.photo_url);
            const currentCat = cats.find((c) => c.id === newSighting.cat_id);
            if (currentCat) {
              await LocalStorage.updateCat(newSighting.cat_id, {
                photos: [...currentCat.photos, newSighting.photo_url],
                photo_url: newSighting.photo_url,
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error("addSighting error, fallback local:", e);
        await LocalStorage.saveSighting(newSighting).catch(() => {});
        setCloudStatus("offline");
        if (newSighting.photo_url) {
          addPhotoToCatState(newSighting.cat_id, newSighting.photo_url);
        }
      }

      setSightings((prev) =>
        prev.find((s) => s.id === newSighting.id) ? prev : [...prev, newSighting]
      );
      const sightedCat = cats.find((c) => c.id === newSighting.cat_id);
      if (sightedCat) {
        await recordActivity("spotted", sightedCat.id, sightedCat.name || "Chat inconnu", newSighting.user_id);
      }
      await checkBadges(newSighting.user_id).catch(() => {});
      await updateStreak(newSighting.user_id).catch(() => {});
      await checkQuestProgress("add_sighting", {
        userId: newSighting.user_id,
        catColor: sightedCat?.color,
      }).catch(() => {});
      return newSighting;
    },
    [isFirebase, cats, recordActivity, checkBadges, checkQuestProgress]
  );

  const toggleFavorite = useCallback(
    async (catId: string, userId: string) => {
      const existing = favorites.find((f) => f.cat_id === catId);

      if (existing) {
        try {
          if (isFirebase) {
            await FavoriteCloud.remove(catId, userId);
          }
          await LocalStorage.removeFavorite(catId);
        } catch {
          await LocalStorage.removeFavorite(catId);
        }
        setFavorites((prev) => prev.filter((f) => f.cat_id !== catId));
      } else {
        const newFav: Favorite = {
          id: uid(),
          user_id: userId,
          cat_id: catId,
          created_at: new Date().toISOString(),
        };

        try {
          if (isFirebase) {
            await FavoriteCloud.add(newFav);
          }
          await LocalStorage.addFavorite(newFav);
        } catch {
          await LocalStorage.addFavorite(newFav);
        }

        setFavorites((prev) =>
          prev.find((f) => f.id === newFav.id) ? prev : [...prev, newFav]
        );
        await checkBadges(userId);
        await updateStreak(userId).catch(() => {});
      }
    },
    [isFirebase, favorites, checkBadges]
  );

  const getCatWithDetails = useCallback(
    (catId: string) => {
      const cat = cats.find((c) => c.id === catId);
      if (!cat) return null;
      const catSightings = sightings.filter((s) => s.cat_id === catId);
      const isFav = favorites.some((f) => f.cat_id === catId);
      return { ...cat, sightings: catSightings, is_favorite: isFav };
    },
    [cats, sightings, favorites]
  );

  const mergeCats = useCallback(
    async (keepId: string, removeId: string) => {
      try {
        if (isFirebase) {
          await CatMerge.merge(keepId, removeId);
        }
        await LocalStorage.mergeCats(keepId, removeId);
      } catch (e) {
        console.error("mergeCats error:", e);
        await LocalStorage.mergeCats(keepId, removeId).catch(() => {});
      }

      await LocalStorage.addDeletedCatId(removeId);

      setCats((prev) => prev.filter((c) => c.id !== removeId));
      setSightings((prev) =>
        prev.map((s) => (s.cat_id === removeId ? { ...s, cat_id: keepId } : s))
      );
      setFavorites((prev) =>
        prev.map((f) => (f.cat_id === removeId ? { ...f, cat_id: keepId } : f))
      );
    },
    [isFirebase]
  );

  const toggleSightingLike = useCallback(
    async (sightingId: string, userId: string) => {
      const existing = sightingLikes.find(
        (l) => l.sighting_id === sightingId && l.user_id === userId
      );

      if (existing) {
        try {
          if (isFirebase) {
            await SightingLikeCloud.remove(sightingId, userId);
          }
        } catch {
          // fallback
        }
        await LocalStorage.removeSightingLike(sightingId, userId).catch(() => {});
        setSightingLikes((prev) =>
          prev.filter((l) => !(l.sighting_id === sightingId && l.user_id === userId))
        );
      } else {
        const newLike: SightingLike = {
          id: uid(),
          sighting_id: sightingId,
          user_id: userId,
          created_at: new Date().toISOString(),
        };
        try {
          if (isFirebase) {
            await SightingLikeCloud.add(newLike);
          }
        } catch {
          // fallback
        }
        await LocalStorage.saveSightingLike(newLike).catch(() => {});
        setSightingLikes((prev) =>
          prev.find((l) => l.id === newLike.id) ? prev : [...prev, newLike]
        );
      }
    },
    [isFirebase, sightingLikes]
  );

  const getSightingLikes = useCallback(
    (sightingId: string) => {
      return sightingLikes.filter((l) => l.sighting_id === sightingId);
    },
    [sightingLikes]
  );

  const addSightingComment = useCallback(
    async (sightingId: string, userId: string, username: string, text: string) => {
      const newComment: SightingComment = {
        id: uid(),
        sighting_id: sightingId,
        user_id: userId,
        username,
        text,
        created_at: new Date().toISOString(),
      };
      try {
        if (isFirebase) {
          await SightingCommentCloud.add(newComment);
        }
      } catch {
        // fallback
      }
      await LocalStorage.addSightingComment(newComment).catch(() => {});
      setSightingComments((prev) =>
        prev.find((c) => c.id === newComment.id) ? prev : [...prev, newComment]
      );
      await checkQuestProgress("add_comment", { userId }).catch(() => {});
      return newComment;
    },
    [isFirebase, checkQuestProgress]
  );

  const getSightingComments = useCallback(
    (sightingId: string) => {
      return sightingComments
        .filter((c) => c.sighting_id === sightingId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    [sightingComments]
  );

  const followUser = useCallback(
    async (followerId: string, followingId: string) => {
      const newFollow: Follow = {
        id: uid(),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      };
      try {
        if (isFirebase) {
          await FollowCloud.add(newFollow);
        }
      } catch {
        // fallback
      }
      await LocalStorage.addFollow(newFollow).catch(() => {});
      setFollows((prev) =>
        prev.find((f) => f.follower_id === followerId && f.following_id === followingId)
          ? prev
          : [...prev, newFollow]
      );
    },
    [isFirebase]
  );

  const unfollowUser = useCallback(
    async (followerId: string, followingId: string) => {
      try {
        if (isFirebase) {
          await FollowCloud.remove(followerId, followingId);
        }
      } catch {
        // fallback
      }
      await LocalStorage.removeFollow(followerId, followingId);
      setFollows((prev) =>
        prev.filter(
          (f) => !(f.follower_id === followerId && f.following_id === followingId)
        )
      );
    },
    [isFirebase]
  );

  const isFollowing = useCallback(
    (followerId: string, followingId: string) => {
      return follows.some(
        (f) => f.follower_id === followerId && f.following_id === followingId
      );
    },
    [follows]
  );

  const getFollowers = useCallback(
    (userId: string) => {
      return follows
        .filter((f) => f.following_id === userId)
        .map((f) => f.follower_id);
    },
    [follows]
  );

  const getFollowing = useCallback(
    (userId: string) => {
      return follows
        .filter((f) => f.follower_id === userId)
        .map((f) => f.following_id);
    },
    [follows]
  );

  return {
    cats,
    sightings,
    favorites,
    sightingLikes,
    sightingComments,
    userBadges,
    activities,
    follows,
    quests,
    loading,
    cloudStatus,
    addCat,
    addSighting,
    toggleFavorite,
    toggleSightingLike,
    getSightingLikes,
    addSightingComment,
    getSightingComments,
    getCatWithDetails,
    checkBadges,
    mergeCats,
    checkQuestProgress,
    refresh: loadData,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowers,
    getFollowing,
  };
}
