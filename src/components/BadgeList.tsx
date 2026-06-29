import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Badge, UserBadge, Cat, Sighting, Favorite } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";
import { getBadgeProgress, getTierColor } from "../utils/badges";

interface BadgeListProps {
  allBadges: Badge[];
  earnedBadges: UserBadge[];
  dailyBadgeId?: string | null;
  cats?: Cat[];
  sightings?: Sighting[];
  favorites?: Favorite[];
  currentStreak?: number;
}

export function BadgeList({ allBadges, earnedBadges, dailyBadgeId, cats = [], sightings = [], favorites = [], currentStreak = 0 }: BadgeListProps) {
  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badge_id));
  const uniqueCities = new Set(sightings.map((s) => s.location_label).filter((label): label is string => Boolean(label)));
  const totalFavs = favorites.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        🏅 Badges ({earnedBadges.length} / {allBadges.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {allBadges.map((badge) => {
          const earned = earnedBadgeIds.has(badge.id);
          const isDaily = dailyBadgeId === badge.id;
          const tierColor = getTierColor(badge.tier || "bronze");
          
          let progress: { current: number; target: number; percentage: number } | null = null;
          if (!earned && badge.progressTarget) {
            const p = getBadgeProgress(badge as any, cats, sightings, totalFavs, uniqueCities, currentStreak);
            progress = p;
          }

          return (
            <View
              key={badge.id}
              style={[
                styles.badge,
                !earned && styles.locked,
                isDaily && styles.dailyHighlight,
                { borderColor: tierColor },
              ]}
            >
              <View style={[styles.tierIndicator, { backgroundColor: tierColor }]} />
              {isDaily && (
                <Text style={styles.dailyLabel}>⭐</Text>
              )}
              <Text style={[styles.icon, !earned && styles.iconLocked]}>
                {badge.hidden && !earned ? "❓" : badge.icon}
              </Text>
              <Text style={[styles.name, !earned && styles.nameLocked]}>
                {badge.hidden && !earned ? "??" : badge.name}
              </Text>
              <Text style={styles.desc}>
                {badge.hidden && !earned ? "Badge caché" : badge.description}
              </Text>
              {!earned && progress && progress.percentage > 0 && progress.percentage < 100 && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${progress.percentage}%` }]} />
                  <Text style={styles.progressText}>{progress.current}/{progress.target}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginLeft: spacing.md,
    width: 120,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  locked: {
    opacity: 0.6,
  },
  dailyHighlight: {
    borderWidth: 3,
    borderColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tierIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  dailyLabel: {
    position: "absolute",
    top: 6,
    right: 6,
    fontSize: 14,
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  iconLocked: {
    opacity: 0.4,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  nameLocked: {
    color: colors.textSecondary,
  },
  desc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
    minHeight: 28,
  },
  progressContainer: {
    width: "100%",
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 8,
    marginTop: 6,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    zIndex: 1,
  },
});
