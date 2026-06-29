import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { useCats } from "../hooks/useCats";
import { colors, spacing, borderRadius } from "../constants/theme";
import { ALL_BADGES } from "../constants/badges";
import { getBadgeProgress, getTierColor } from "../utils/badges";

export function BadgesScreen() {
  const { userBadges, cats, sightings, favorites } = useCats();
  const [dailyBadgeId, setDailyBadgeId] = useState<string | null>(null);

  useEffect(() => {
    const earnedIds = new Set(userBadges.map((b) => b.badge_id));
    const available = ALL_BADGES.filter((b) => !earnedIds.has(b.id)).map((b) => b.id);
    if (available.length > 0) {
      setDailyBadgeId(available[Math.floor(Math.random() * available.length)]);
    }
  }, [userBadges]);

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
  const uniqueCities = new Set(sightings.map((s) => s.location_label).filter((label): label is string => Boolean(label)));
  const totalFavs = favorites.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        🏅 Tes Badges ({userBadges.length} / {ALL_BADGES.length})
      </Text>

      {ALL_BADGES.map((badge) => {
        const earned = earnedBadgeIds.has(badge.id);
        const isDaily = dailyBadgeId === badge.id;
        const tierColor = getTierColor(badge.tier || "bronze");

        let progress: { current: number; target: number; percentage: number } | null = null;
        if (!earned && badge.progressTarget && cats && sightings) {
          const p = getBadgeProgress(badge as any, cats, sightings, totalFavs, uniqueCities, 0);
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
              <Text style={styles.dailyLabel}>⭐ Du jour</Text>
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
            {earned && (
              <Text style={styles.earnedLabel}>✅ Débloqué</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  locked: {
    opacity: 0.6,
  },
  dailyHighlight: {
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    top: 10,
    right: 12,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  icon: {
    fontSize: 36,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  iconLocked: {
    opacity: 0.4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nameLocked: {
    color: colors.textSecondary,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  progressContainer: {
    width: "100%",
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 10,
    marginTop: spacing.sm,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    zIndex: 1,
  },
  earnedLabel: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
    marginTop: spacing.xs,
  },
});
