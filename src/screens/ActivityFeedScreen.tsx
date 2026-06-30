import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}

function ActivityIcon({ type }: { type: string }) {
  const config = {
    discovered: { icon: "🐱", color: colors.primary },
    spotted: { icon: "📍", color: colors.secondary },
    badge_earned: { icon: "🏅", color: "#FFD700" },
    quest_completed: { icon: "🎯", color: "#FF6B6B" },
  }[type] || { icon: "✨", color: colors.text };

  return (
    <View style={[styles.iconCircle, { backgroundColor: config.color + "20" }]}>
      <Text style={styles.iconEmoji}>{config.icon}</Text>
    </View>
  );
}

export function ActivityFeedScreen() {
  const { activities, loading, refresh, getFollowing } = useCats();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<"all" | "following">("all");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    const following = getFollowing(user?.id || "");
    return activities.filter((a) => a.username === user?.username || following.includes(a.username));
  }, [activities, filter, getFollowing, user]);

  const feedStats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const todayCount = activities.filter(a => new Date(a.created_at) >= today).length;
    const weekCount = activities.filter(a => new Date(a.created_at) >= weekAgo).length;
    const activeUsers = new Set(activities.map(a => a.username)).size;
    const uniqueCats = new Set(activities.map(a => a.cat_id)).size;
    
    return { todayCount, weekCount, activeUsers, uniqueCats };
  }, [activities]);

  const groupedActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    const groups: Record<string, typeof filteredActivities> = {
      "Aujourd'hui": [],
      "Hier": [],
      "Cette semaine": [],
      "Ce mois-ci": [],
      "Plus tôt": [],
    };

    for (const a of filteredActivities) {
      const d = new Date(a.created_at);
      d.setHours(0,0,0,0);
      if (d.getTime() === today.getTime()) {
        groups["Aujourd'hui"].push(a);
      } else if (d.getTime() === yesterday.getTime()) {
        groups["Hier"].push(a);
      } else if (d >= weekAgo) {
        groups["Cette semaine"].push(a);
      } else if (d >= monthAgo) {
        groups["Ce mois-ci"].push(a);
      } else {
        groups["Plus tôt"].push(a);
      }
    }
    return groups;
  }, [filteredActivities]);

  const userRanks = useMemo(() => {
    const discovered = new Map<string, { name: string; cats: Set<string> }>();
    const spotted = new Map<string, { name: string; cats: Set<string> }>();

    for (const a of activities) {
      const map = a.type === "discovered" ? discovered : spotted;
      let entry = map.get(a.username);
      if (!entry) {
        entry = { name: a.username, cats: new Set() };
        map.set(a.username, entry);
      }
      entry.cats.add(a.cat_id);
    }

    const allUsers = new Set([...discovered.keys(), ...spotted.keys()]);

    const rankings = Array.from(allUsers)
      .map((username) => {
        const d = discovered.get(username);
        const s = spotted.get(username);
        const discoveredCount = d?.cats.size || 0;
        const spottedCount = s?.cats.size || 0;
        return {
          username: d?.name || s?.name || username,
          total: discoveredCount + spottedCount,
        };
      })
      .sort((a, b) => b.total - a.total);

    const ranks = new Map<string, number>();
    rankings.forEach((u, idx) => {
      ranks.set(u.username, idx + 1);
    });
    return ranks;
  }, [activities]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🐱</Text>
        <Text style={styles.headerTitle}>Activité</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{feedStats.todayCount}</Text>
            <Text style={styles.statLabel}>Aujourd&apos;hui</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{feedStats.weekCount}</Text>
            <Text style={styles.statLabel}>Cette semaine</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{feedStats.activeUsers}</Text>
            <Text style={styles.statLabel}>Chasseurs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{feedStats.uniqueCats}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
            Tout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === "following" && styles.filterButtonActive]}
          onPress={() => setFilter("following")}
        >
          <Text style={[styles.filterText, filter === "following" && styles.filterTextActive]}>
            Abonnements
          </Text>
        </TouchableOpacity>
      </View>

      {filteredActivities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>
            {filter === "following"
              ? "Suivez des chasseurs pour voir leur activité"
              : "Aucune activité pour l'instant"}
          </Text>
          {filter !== "following" && (
            <Text style={styles.emptySub}>
              Capture ton premier chat pour lancer le fil !
            </Text>
          )}
        </View>
      ) : (
        Object.entries(groupedActivities).map(([dateGroup, acts]) => {
          if (acts.length === 0) return null;
          return (
            <View key={dateGroup}>
              <Text style={styles.dateGroupHeader}>{dateGroup}</Text>
              {acts.map((a) => {
                const rank = userRanks.get(a.username) || 1;
                return (
                  <View key={a.id} style={styles.card}>
                    <ActivityIcon type={a.type} />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTextRow}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("PublicProfile", {
                              username: a.username,
                              rank,
                            })
                          }
                          activeOpacity={0.6}
                        >
                          <Text style={styles.username}>{a.username}</Text>
                        </TouchableOpacity>
                        <Text style={styles.actionText}>
                          {" "}
                          {a.type === "discovered" ? "a découvert" : a.type === "spotted" ? "a revu" : a.type === "badge_earned" ? "a obtenu" : a.type === "quest_completed" ? "a accompli" : "a activité"}{" "}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("CatDetail", { catId: a.cat_id })
                          }
                          activeOpacity={0.6}
                        >
                          <Text style={styles.catName}>{a.cat_name}</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cardTime}>
                        {timeAgo(new Date(a.created_at))}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: "#FFF",
  },
  dateGroupHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
  },
  cardTextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  actionText: {
    fontSize: 15,
    color: colors.text,
  },
  catName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  cardTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
