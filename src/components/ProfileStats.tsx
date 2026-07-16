import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { colors, spacing, borderRadius } from "../constants/theme";
import { calculateLevelInfo } from "../utils/xp";

interface ProfileStatsProps {
  totalXP: number;
  streakCurrent: number;
  streakLongest: number;
  followersCount: number;
  followingCount: number;
}

export function ProfileStats({
  totalXP,
  streakCurrent,
  streakLongest,
  followersCount,
  followingCount,
}: ProfileStatsProps) {
  const levelInfo = calculateLevelInfo(totalXP);

  return (
    <View style={styles.container}>
      {/* Streak */}
      <View style={styles.streakContainer}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakTitle}>Série actuelle</Text>
          <Text style={styles.streakDays}>{streakCurrent} jour{streakCurrent > 1 ? "s" : ""}</Text>
        </View>
        {streakCurrent > 0 ? (
          <Text style={styles.streakSub}>
            Perdre la série si aucune observation.
          </Text>
        ) : (
          <Text style={styles.streakSub}>
            Fais une observation pour relancer ta série !
          </Text>
        )}
        <Text style={styles.streakRecord}>Record : {streakLongest} jour{streakLongest > 1 ? "s" : ""}</Text>
      </View>

      {/* Follow counts */}
      <View style={styles.followCounts}>
        <TouchableOpacity style={styles.followItem}>
          <Text style={styles.followValue}>{followersCount}</Text>
          <Text style={styles.followLabel}>Abonnés</Text>
        </TouchableOpacity>
        <View style={styles.followDivider} />
        <TouchableOpacity style={styles.followItem}>
          <Text style={styles.followValue}>{followingCount}</Text>
          <Text style={styles.followLabel}>Abonnements</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  xpContainer: {
    width: "80%",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.xs,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  xpTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
  streakContainer: {
    width: "80%",
    alignItems: "center",
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginRight: spacing.sm,
  },
  streakDays: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  streakSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 2,
  },
  streakRecord: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  followCounts: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  followItem: {
    alignItems: "center",
  },
  followValue: {
    fontSize: 18,
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
});
