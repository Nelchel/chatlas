import { useMemo, useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";
import { calculateLevelInfo } from "../utils/xp";

const MEDALS = ["🥇", "🥈", "🥉"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
  d.setDate(diff);
  return d;
}

function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isThisWeek(date: Date): boolean {
  const weekStart = getWeekStart(new Date());
  return date >= weekStart;
}

function isThisMonth(date: Date): boolean {
  const monthStart = getMonthStart(new Date());
  return date >= monthStart;
}

type Scope = "monde" | "pays" | "region" | "ville";
type Metric = "observations" | "chats" | "badges" | "xp";
type Period = "tout" | "hebdo" | "mensuel";

export function LeaderboardScreen() {
  const { activities, loading, refresh, followUser, unfollowUser, isFollowing, cats, sightings } = useCats();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [, forceUpdate] = useState(0);
  const [scope, setScope] = useState<Scope>("monde");
  const [metric, setMetric] = useState<Metric>("observations");
  const [period, setPeriod] = useState<Period>("tout");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const rankings = useMemo(() => {
    // Filtrer les activités selon la période
    let filteredActivities = activities;
    if (period === "hebdo") {
      filteredActivities = activities.filter((a) => isThisWeek(new Date(a.created_at)));
    } else if (period === "mensuel") {
      filteredActivities = activities.filter((a) => isThisMonth(new Date(a.created_at)));
    }

    // On agrège par username depuis les activities et sightings
    const userStats = new Map<string, {
      username: string;
      discoveredCats: Set<string>;
      allCats: Set<string>;
      sightingCount: number;
      xp: number;
      badges: number;
    }>();

    // Stats depuis activities (qui ont les usernames)
    for (const a of filteredActivities) {
      let s = userStats.get(a.username);
      if (!s) {
        s = {
          username: a.username,
          discoveredCats: new Set(),
          allCats: new Set(),
          sightingCount: 0,
          xp: 0,
          badges: 0,
        };
        userStats.set(a.username, s);
      }
      s.allCats.add(a.cat_id);
      s.sightingCount++;
      if (a.type === "discovered") {
        s.discoveredCats.add(a.cat_id);
        s.xp += 120; // 100 découverte + 20 observation
      } else {
        s.xp += 20; // observation seule
      }
    }

    // Compléter avec les sightings qui n'auraient pas d'activity
    for (const sighting of sightings) {
      // On n'a pas le username dans sighting directement, on skip
      // (normalement les activities couvrent tout)
    }

    // Badges approximés depuis les stats
    for (const [, s] of userStats) {
      let badgeCount = 0;
      if (s.discoveredCats.size >= 1) badgeCount++;
      if (s.discoveredCats.size >= 5) badgeCount++;
      if (s.discoveredCats.size >= 10) badgeCount++;
      if (s.discoveredCats.size >= 25) badgeCount++;
      if (s.sightingCount >= 5) badgeCount++;
      if (s.sightingCount >= 20) badgeCount++;
      badgeCount += Math.floor(s.discoveredCats.size / 10); // proportionnel
      s.badges = Math.min(badgeCount, 20); // cap
    }

    let result = Array.from(userStats.values()).map((s) => ({
      username: s.username,
      cats: s.discoveredCats.size,
      totalObservations: s.sightingCount,
      total: s.allCats.size,
      badges: s.badges,
      xp: s.xp,
      level: calculateLevelInfo(s.xp).level,
    }));

    // Tri selon la métrique choisie
    switch (metric) {
      case "observations":
        result.sort((a, b) => b.totalObservations - a.totalObservations || b.cats - a.cats);
        break;
      case "chats":
        result.sort((a, b) => b.cats - a.cats || b.totalObservations - a.totalObservations);
        break;
      case "badges":
        result.sort((a, b) => b.badges - a.badges || b.xp - a.xp);
        break;
      case "xp":
        result.sort((a, b) => b.xp - a.xp || b.cats - a.cats);
        break;
    }

    return result;
  }, [activities, metric, period]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleFollowToggle = async (username: string) => {
    if (!user) return;
    if (isFollowing(user.id, username)) {
      await unfollowUser(user.id, username);
    } else {
      await followUser(user.id, username);
    }
    forceUpdate((x) => x + 1);
  };

  const getMetricValue = (item: typeof rankings[0]) => {
    switch (metric) {
      case "observations": return `${item.totalObservations} observations`;
      case "chats": return `${item.cats} chats`;
      case "badges": return `${item.badges} badges`;
      case "xp": return `${item.xp} XP`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🏆</Text>
        <Text style={styles.title}>
          Classement {period === "hebdo" ? "Hebdo" : period === "mensuel" ? "Mensuel" : ""}
        </Text>
        <Text style={styles.subtitle}>
          {period === "hebdo"
            ? "Les plus actifs cette semaine"
            : period === "mensuel"
            ? "Les plus actifs ce mois-ci"
            : "Les chasseur·euses les plus actif·ves"}
        </Text>
      </View>

      {/* Filtres géographiques */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>📍 Zone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {([
            { key: "monde", label: "Monde" },
            { key: "pays", label: "Pays" },
            { key: "region", label: "Région" },
            { key: "ville", label: "Ville" },
          ] as { key: Scope; label: string }[]).map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.scopeChip, scope === s.key && styles.scopeChipActive]}
              onPress={() => setScope(s.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.scopeChipText, scope === s.key && styles.scopeChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtres métriques */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>📊 Par</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {([
            { key: "observations", label: "Observations" },
            { key: "chats", label: "Chats" },
            { key: "badges", label: "Badges" },
            { key: "xp", label: "XP" },
          ] as { key: Metric; label: string }[]).map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.metricChip, metric === m.key && styles.metricChipActive]}
              onPress={() => setMetric(m.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.metricChipText, metric === m.key && styles.metricChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtres de période */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>📅 Période</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {([
            { key: "tout", label: "Tout" },
            { key: "hebdo", label: "Hebdomadaire" },
            { key: "mensuel", label: "Mensuel" },
          ] as { key: Period; label: string }[]).map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Note pour scopes non-monde */}
      {scope !== "monde" && (
        <View style={styles.scopeNotice}>
          <Text style={styles.scopeNoticeText}>
            🌍 Les filtres géographiques arrivent bientôt. Pour l&apos;instant : classement mondial.
          </Text>
        </View>
      )}

      <FlatList
        data={rankings}
        keyExtractor={(item) => item.username}
        renderItem={({ item, index }) => {
          const medal = index < 3 ? MEDALS[index] : `#${index + 1}`;
          const followState = user && user.username !== item.username ? isFollowing(user.id, item.username) : false;
          return (
            <TouchableOpacity 
              style={styles.row}
              onPress={() => navigation.navigate("PublicProfile", { username: item.username, rank: index + 1 })}
              activeOpacity={0.7}
            >
              <Text style={styles.rank}>{medal}</Text>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.username}</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv. {item.level}</Text>
                  </View>
                </View>
                <Text style={styles.detail}>{getMetricValue(item)}</Text>
                <Text style={styles.subDetail}>
                  {item.totalObservations} observations · {item.cats} chats · {item.badges} badges · {item.xp} XP
                </Text>
              </View>
              {user && user.username !== item.username && (
                <TouchableOpacity
                  style={[styles.followButton, followState && styles.followingButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(item.username);
                  }}
                >
                  <Text style={[styles.followButtonText, followState && styles.followingButtonText]}>
                    {followState ? "Suivi ✓" : "Suivre"}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Encore personne n&apos;a chassé</Text>
          </View>
        }
        contentContainerStyle={rankings.length === 0 ? styles.emptyContainer : styles.list}
      />
    </View>
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
    paddingBottom: spacing.md,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipScroll: {
    flexDirection: "row",
  },
  scopeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scopeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  scopeChipTextActive: {
    color: "#FFF",
  },
  metricChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  metricChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  metricChipTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  periodChipTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  scopeNotice: {
    backgroundColor: colors.secondary + "30",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  scopeNoticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    paddingBottom: 100,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  rank: {
    fontSize: 22,
    width: 44,
    textAlign: "center",
    fontWeight: "700",
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  detail: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  subDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  followingButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  followingButtonText: {
    color: colors.primary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
