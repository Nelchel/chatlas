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
  const icon = type === "discovered" ? "🐱" : "📍";
  return (
    <View style={styles.iconCircle}>
      <Text style={styles.iconEmoji}>{icon}</Text>
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

  // Calculer les rangs de tous les utilisateurs à partir des activités
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
        filteredActivities.map((a) => {
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
                    {a.type === "discovered" ? "a découvert" : "a revu"}{" "}
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
