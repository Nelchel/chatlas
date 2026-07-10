import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Award,
  ChevronLeft,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  Trophy,
} from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../types";
import { colors, spacing } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FeedFilter = "all" | "observations" | "interactions" | "challenges";

type ExtendedActivity = {
  id: string;
  type: string;
  username: string;
  user_id?: string;
  cat_id?: string;
  cat_name?: string;
  created_at: string;

  title?: string;
  icon?: string;
  image_url?: string | null;
  cat_photo_url?: string | null;
  thumbnail_url?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  location?: string | null;
  reward_xp?: number | null;
};

const FILTERS: Array<{
  key: FeedFilter;
  label: string;
}> = [
  { key: "all", label: "Tout" },
  { key: "observations", label: "Observations" },
  { key: "interactions", label: "Interactions" },
  { key: "challenges", label: "Défis" },
];

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} j`;

  return date.toLocaleDateString("fr-FR");
}

function getActivityThumbnail(activity: ExtendedActivity) {
  return (
      activity.cat_photo_url ||
      activity.image_url ||
      activity.thumbnail_url ||
      null
  );
}

function isObservation(type: string) {
  return type === "discovered" || type === "spotted";
}

function isChallenge(type: string) {
  return type === "badge_earned" || type === "quest_completed";
}

function isInteraction(type: string) {
  return (
      type.includes("like") ||
      type.includes("comment") ||
      type.includes("follow") ||
      type.includes("favorite")
  );
}

function getActivityContent(activity: ExtendedActivity) {
  const location = activity.city || activity.location;

  switch (activity.type) {
    case "discovered":
      return {
        eyebrow: "Vous avez observé",
        title: activity.cat_name,
        meta: [timeAgo(new Date(activity.created_at)), location]
            .filter(Boolean)
            .join(" · "),
        icon: "paw",
        reward: activity.reward_xp ?? 120,
      };

    case "spotted":
      return {
        eyebrow: `${activity.username} a revu`,
        title: activity.cat_name,
        meta: [timeAgo(new Date(activity.created_at)), location]
            .filter(Boolean)
            .join(" · "),
        icon: "map",
        reward: null,
      };

    case "badge_earned":
      return {
        eyebrow: "Vous avez débloqué",
        title: activity.title || activity.cat_name || "Un nouveau badge",
        meta: timeAgo(new Date(activity.created_at)),
        icon: activity.icon ?? "badge",
        reward: activity.reward_xp ?? 120,
      };

    case "quest_completed":
      return {
        eyebrow: "Vous avez terminé le défi",
        title: activity.title || activity.cat_name || "Défi accompli",
        meta: timeAgo(new Date(activity.created_at)),
        icon: activity.icon ?? "trophy",
        reward: activity.reward_xp ?? 300,
      };

    default:
      if (activity.type.includes("like")) {
        return {
          eyebrow: `${activity.username} a aimé`,
          title: activity.cat_name,
          meta: timeAgo(new Date(activity.created_at)),
          icon: "heart",
          reward: null,
        };
      }

      if (activity.type.includes("comment")) {
        return {
          eyebrow: `${activity.username} a commenté`,
          title: activity.cat_name,
          meta: timeAgo(new Date(activity.created_at)),
          icon: "comment",
          reward: null,
        };
      }

      return {
        eyebrow: activity.username,
        title: activity.cat_name || "Nouvelle activité",
        meta: timeAgo(new Date(activity.created_at)),
        icon: "paw",
        reward: null,
      };
  }
}

function ActivityIllustration({
                                type,
                              }: {
  type: ReturnType<typeof getActivityContent>["icon"];
}) {
  const iconProps = {
    size: 27,
    strokeWidth: 1.9,
  };

  return (
      <View style={styles.illustrationFallback}>
        {type === "badge" && (
            <Award {...iconProps} color="#8C6120" />
        )}

        {type === "trophy" && (
            <Trophy {...iconProps} color="#9A661D" />
        )}

        {type === "heart" && (
            <Heart {...iconProps} color="#B55442" />
        )}

        {type === "comment" && (
            <MessageCircle {...iconProps} color="#48634A" />
        )}

        {type === "map" && (
            <MapPin {...iconProps} color="#C06E31" />
        )}

        {type === "paw" && (
            <PawPrint {...iconProps} color="#355C3C" />
        )}
      </View>
  );
}

function ActivityCard({
                        activity,
                        rank,
                        navigation,
                      }: {
  activity: ExtendedActivity;
  rank: number;
  navigation: Nav;
}) {
  const content = getActivityContent(activity);
  const thumbnail = getActivityThumbnail(activity);

  const handlePress = () => {
    if (
        isObservation(activity.type) &&
        activity.cat_id
    ) {
      navigation.navigate("CatDetail", {
        catId: activity.cat_id,
      });
    }
  };

  return (
      <TouchableOpacity
          style={styles.activityCard}
          activeOpacity={0.86}
          onPress={handlePress}
      >
        <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.75}
            onPress={() =>
                navigation.navigate("PublicProfile", {
                  username: activity.username,
                  rank,
                })
            }
        >
          {activity.avatar_url ? (
              <Image
                  source={{ uri: activity.avatar_url }}
                  style={styles.avatar}
              />
          ) : (
              <View style={styles.avatarFallback}>
                <PawPrint
                    size={20}
                    color="#355C3C"
                    strokeWidth={2}
                />
              </View>
          )}
        </TouchableOpacity>

        <View style={styles.activityContent}>
          <Text style={styles.activityEyebrow}>
            {content.eyebrow}
          </Text>

          <Text
              style={styles.activityTitle}
              numberOfLines={2}
          >
            {content.title}
          </Text>

          <Text
              style={styles.activityMeta}
              numberOfLines={1}
          >
            {content.meta}
          </Text>
        </View>

        <View style={styles.activitySide}>
          {thumbnail ? (
              <Image
                  source={{ uri: thumbnail }}
                  style={styles.thumbnail}
                  resizeMode="cover"
              />
          ) : (
              <ActivityIllustration type={content.icon} />
          )}

          {content.reward !== null && (
              <Text style={styles.reward}>
                +{content.reward} XP
              </Text>
          )}
        </View>
      </TouchableOpacity>
  );
}

export function ActivityFeedScreen() {
  const {
    activities,
    cats,
    loading,
    refresh,
  } = useCats();

  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  const [filter, setFilter] =
      useState<FeedFilter>("all");

  useFocusEffect(
      useCallback(() => {
        refresh();
      }, [refresh])
  );

  const enrichedActivities = useMemo(() => {
    return activities.map((a) => {
      let enriched = { ...(a as ExtendedActivity) };
      if (isObservation(a.type)) {
        const cat = cats.find((c) => c.id === a.cat_id);
        enriched.cat_photo_url = cat?.photo_url ?? null;
      }
      // Inject current user's avatar for own activities where it's missing
      if (!enriched.avatar_url && enriched.user_id === user?.id && user?.avatar_url) {
        enriched.avatar_url = user.avatar_url;
      }
      return enriched;
    });
  }, [activities, cats, user]);

  const filteredActivities = useMemo(() => {
    const typedActivities = enrichedActivities;

    switch (filter) {
      case "observations":
        return typedActivities.filter((activity) =>
            isObservation(activity.type)
        );

      case "interactions":
        return typedActivities.filter((activity) =>
            isInteraction(activity.type)
        );

      case "challenges":
        return typedActivities.filter((activity) =>
            isChallenge(activity.type)
        );

      default:
        return typedActivities;
    }
  }, [activities, filter]);

  const userRanks = useMemo(() => {
    const scores = new Map<string, Set<string>>();

    for (const rawActivity of activities) {
      const activity =
          rawActivity as ExtendedActivity;

      if (!isObservation(activity.type)) {
        continue;
      }

      if (!activity.cat_id) continue;
      const current =
          scores.get(activity.username) ??
          new Set<string>();

      current.add(activity.cat_id);
      scores.set(activity.username, current);
    }

    const ranking = Array.from(scores.entries())
        .map(([username, cats]) => ({
          username,
          score: cats.size,
        }))
        .sort((a, b) => b.score - a.score);

    const ranks = new Map<string, number>();

    ranking.forEach((entry, index) => {
      ranks.set(entry.username, index + 1);
    });

    return ranks;
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
        <View style={styles.centered}>
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.paperBackground}
              resizeMode="cover"
          />

          <ActivityIndicator
              size="large"
              color="#355C3C"
          />

          <Text style={styles.loadingText}>
            Chargement du journal…
          </Text>
        </View>
    );
  }

  return (
      <View style={styles.screen}>
        <Image
            source={require("../../assets/onboarding/paper.png")}
            style={styles.paperBackground}
            resizeMode="cover"
        />

        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
          >
            <ChevronLeft
                size={25}
                color="#5E4C36"
                strokeWidth={1.7}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Activité
          </Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item.key;

            return (
                <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
                    activeOpacity={0.84}
                    onPress={() => setFilter(item.key)}
                >
                  <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                      numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                  refreshing={loading}
                  onRefresh={refresh}
                  tintColor="#355C3C"
                  colors={["#355C3C"]}
              />
            }
        >
          {filteredActivities.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <PawPrint
                      size={36}
                      color="#B88637"
                      strokeWidth={1.7}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Rien à signaler
                </Text>

                <Text style={styles.emptyText}>
                  {filter === "observations"
                      ? "Les prochaines observations apparaîtront ici."
                      : filter === "interactions"
                          ? "Les likes et commentaires apparaîtront ici."
                          : filter === "challenges"
                              ? "Tes prochains succès apparaîtront ici."
                              : "Pars explorer pour alimenter ton journal d’activité."}
                </Text>
              </View>
          ) : (
              filteredActivities.map((activity) => (
                  <ActivityCard
                      key={activity.id}
                      activity={activity}
                      rank={
                          userRanks.get(activity.username) ||
                          (activity.username === user?.username
                              ? 1
                              : 1)
                      }
                      navigation={navigation}
                  />
              ))
          )}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6ECD6",
  },

  paperBackground: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "115%",
    top: -28,
    left: -38,
    opacity: 0.96,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6ECD6",
  },

  loadingText: {
    marginTop: 12,
    color: "#665A49",
    fontSize: 16,
    fontFamily:
        "CormorantGaramond_600SemiBold",
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 14,
    paddingBottom: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",
  },

  headerPlaceholder: {
    width: 38,
    height: 38,
  },

  headerTitle: {
    color: "#2F271F",
    fontSize: 27,
    lineHeight: 31,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  filters: {
    marginHorizontal: 14,
    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  filterButton: {
    flex: 1,
    minHeight: 34,

    paddingHorizontal: 7,
    paddingVertical: 7,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(226, 200, 150, 0.58)",

    borderWidth: 1,
    borderColor: "rgba(191, 155, 91, 0.25)",
  },

  filterButtonActive: {
    backgroundColor: "#355C3C",

    borderColor: "#355C3C",

    shadowColor: "#263B28",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  filterText: {
    color: "#5C4E3D",
    fontSize: 13,
    fontFamily:
        "CormorantGaramond_700Bold",
    textAlign: "center",
  },

  filterTextActive: {
    color: "#FFF7E8",
  },

  feed: {
    flex: 1,
  },

  feedContent: {
    paddingHorizontal: 14,
    paddingBottom: 26,
  },

  activityCard: {
    minHeight: 86,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 10,
    paddingLeft: 9,
    paddingRight: 8,

    marginBottom: 4,

    borderRadius: 13,

    borderWidth: 1,
    borderColor:
        "rgba(200, 175, 128, 0.55)",
  },

  avatarWrapper: {
    width: 45,
    height: 45,

    marginRight: 10,

    borderRadius: 23,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3E4C7",

    borderWidth: 1.5,
    borderColor: "#E3C995",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E9D7B2",
  },

  activityContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 7,
  },

  activityEyebrow: {
    color: "#645849",
    fontSize: 13,
    lineHeight: 13,
    fontFamily:
        "CormorantGaramond_600SemiBold",
  },

  activityTitle: {
    marginTop: 1,

    color: "#2F271F",
    fontSize: 16,
    lineHeight: 17,

    fontFamily:
        "CormorantGaramond_700Bold",
  },

  activityMeta: {
    marginTop: 4,

    color: "#7B6B56",
    fontSize: 13,
    lineHeight: 12,

    fontFamily:
        "CormorantGaramond_600SemiBold",
  },

  activitySide: {
    width: 72,

    alignSelf: "stretch",
    alignItems: "flex-end",
    justifyContent: "center",
  },

  thumbnail: {
    width: 67,
    height: 55,

    borderRadius: 9,

    borderWidth: 1,
    borderColor: "#D5BE91",
  },

  illustrationFallback: {
    width: 61,
    height: 54,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E9D6AB",

    borderWidth: 1,
    borderColor: "#D7BB82",
  },

  reward: {
    marginTop: 3,
    marginRight: 2,

    color: "#355C3C",
    fontSize: 12,

    fontFamily:
        "CormorantGaramond_700Bold",
  },

  empty: {
    marginTop: 72,
    paddingHorizontal: 30,

    alignItems: "center",
  },

  emptyIcon: {
    width: 72,
    height: 72,

    marginBottom: 14,

    borderRadius: 36,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
        "rgba(236, 212, 165, 0.72)",

    borderWidth: 1,
    borderColor: "#D9BA7E",
  },

  emptyTitle: {
    color: "#352C23",
    fontSize: 22,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  emptyText: {
    marginTop: 5,

    color: "#756653",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",

    fontFamily:
        "CormorantGaramond_600SemiBold",
  },
});
