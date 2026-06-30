import { useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, borderRadius } from "../constants/theme";
import { calculateLevelInfo } from "../utils/xp";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PublicProfileRouteProp = RouteProp<RootStackParamList, "PublicProfile">;

function StatRow({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function PublicProfileScreen() {
  const route = useRoute<PublicProfileRouteProp>();
  const { username, rank } = route.params;
  const { activities, sightings, followUser, unfollowUser, isFollowing, getFollowers, getFollowing } = useCats();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const isMe = user?.username === username;
  const following = isFollowing(user?.id || "", username);

  const recentActivities = useMemo(() => {
    return activities
      .filter((a) => a.username === username)
      .slice(0, 10);
  }, [activities, username]);

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  const stats = useMemo(() => {
    const userActivities = activities.filter((a) => a.username === username);
    const discovered = new Set<string>();
    const spotted = new Set<string>();

    for (const a of userActivities) {
      if (a.type === "discovered") {
        discovered.add(a.cat_id);
      } else {
        spotted.add(a.cat_id);
      }
    }

    const totalCats = discovered.size + spotted.size;

    // XP : 100 par nouveau chat, 20 par revu (spotted)
    let totalXP = 0;
    for (const a of userActivities) {
      if (a.type === "discovered") {
        totalXP += 100 + 20;
      } else {
        totalXP += 20;
      }
    }

    // Stats ville préférée
    const userCatIds = new Set([...discovered, ...spotted]);
    const userSightings = sightings.filter((s) => userCatIds.has(s.cat_id));
    const cityCounts: Record<string, number> = {};
    for (const s of userSightings) {
      if (s.location_label) {
        cityCounts[s.location_label] = (cityCounts[s.location_label] || 0) + 1;
      }
    }
    const favoriteCity = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Inconnue";

    const levelInfo = calculateLevelInfo(totalXP);

    return {
      totalCats,
      discovered: discovered.size,
      spotted: spotted.size,
      favoriteCity,
      totalXP,
      levelInfo,
    };
  }, [activities, sightings, username]);

  const followersCount = getFollowers(username).length;
  const followingCount = getFollowing(username).length;

  const handleFollowToggle = async () => {
    if (!user) return;
    if (following) {
      await unfollowUser(user.id, username);
    } else {
      await followUser(user.id, username);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.username}>{username}</Text>

        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>🎖️ Niveau {stats.levelInfo.level}</Text>
        </View>

        <View style={styles.followCounts}>
        <View style={styles.followItem}>
          <Text style={styles.followValue}>{followersCount}</Text>
          <Text style={styles.followLabel}>Abonnés</Text>
        </View>
        <View style={styles.followDivider} />
        <View style={styles.followItem}>
          <Text style={styles.followValue}>{followingCount}</Text>
          <Text style={styles.followLabel}>Abonnements</Text>
        </View>
      </View>

      {!isMe && (
        <TouchableOpacity
          style={[styles.followButton, following && styles.followingButton]}
          onPress={handleFollowToggle}
        >
          <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
            {following ? "Suivi ✓" : "Suivre"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.xpContainer}>
          <View style={styles.xpBarBackground}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${stats.levelInfo.percentage}%` },
              ]}
            />
          </View>
          <Text style={styles.xpDetail}>
            {stats.levelInfo.xpProgress} / {stats.levelInfo.xpNeeded} XP pour niveau {stats.levelInfo.level + 1}
          </Text>
          <Text style={styles.xpTotal}>Total : {stats.totalXP} XP</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <StatRow label="Chats découverts" value={stats.discovered.toString()} emoji="🐱" />
        <View style={styles.divider} />
        <StatRow label="Observations" value={stats.spotted.toString()} emoji="👁️" />
        <View style={styles.divider} />
        <StatRow label="Total" value={stats.totalCats.toString()} emoji="📊" />
        <View style={styles.divider} />
        <StatRow label="Ville préférée" value={stats.favoriteCity} emoji="📍" />
        <View style={styles.divider} />
        <StatRow label="Rang mondial" value={`#${rank}`} emoji="🥇" />
      </View>

      {/* Activité récente */}
      <View style={styles.recentActivitiesSection}>
        <Text style={styles.sectionTitle}>🕐 Activité récente</Text>
        
        {recentActivities.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>Aucune activité récente</Text>
          </View>
        ) : (
          <View style={styles.recentActivitiesCard}>
            {recentActivities.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate("CatDetail", { catId: a.cat_id })}
                activeOpacity={0.7}
              >
                <Text style={styles.activityEmoji}>
                  {a.type === "discovered" ? "🐱" : "📍"}
                </Text>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>
                    {a.type === "discovered" 
                      ? `A découvert ${a.cat_name}` 
                      : `A revu ${a.cat_name}`}
                  </Text>
                  <Text style={styles.activityTime}>{timeAgo(a.created_at)}</Text>
                </View>
                <Text style={styles.activityChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  username: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  levelBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  levelText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  xpContainer: {
    width: "80%",
    alignItems: "center",
  },
  xpBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  xpDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  xpTotal: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  statEmoji: {
    fontSize: 24,
    width: 40,
    textAlign: "center",
  },
  statLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 50,
  },
  followCounts: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  followItem: {
    alignItems: "center",
  },
  followValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  followLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  followingButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  followingButtonText: {
    color: colors.primary,
  },
  recentActivitiesSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  recentActivitiesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityEmoji: {
    fontSize: 18,
    width: 32,
    textAlign: "center",
  },
  activityText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  activityTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityChevron: {
    fontSize: 20,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  emptyActivity: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  emptyActivityText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
