import { StyleSheet, View, Text, ScrollView, Dimensions } from "react-native";
import { useCats } from "../hooks/useCats";
import { colors, spacing, borderRadius } from "../constants/theme";
import { formatTimeRemaining } from "../utils/quests";

const { width } = Dimensions.get("window");

function ProgressBar({ progress, target }: { progress: number; target: number }) {
  const percentage = Math.min(100, Math.max(0, target > 0 ? (progress / target) * 100 : 0));
  return (
    <View style={styles.progressBackground}>
      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressText}>
          {progress}/{target}
        </Text>
      </View>
    </View>
  );
}

function QuestCard({ quest }: { quest: any }) {
  const timeRemaining = quest.type !== "one_time" ? formatTimeRemaining(quest.expires_at) : null;

  return (
    <View style={[styles.card, quest.completed && styles.cardCompleted]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, quest.completed && styles.textCompleted]}>
          {quest.description}
        </Text>
        <View style={styles.badgeXP}>
          <Text style={styles.badgeXPText}>+{quest.reward_xp} XP</Text>
        </View>
      </View>
      <ProgressBar progress={quest.progress} target={quest.target || 1} />
      {timeRemaining && (
        <Text style={styles.timeRemaining}>Reste {timeRemaining}</Text>
      )}
      {quest.completed && (
        <Text style={styles.completedLabel}>Accompli</Text>
      )}
    </View>
  );
}

export function QuestsScreen() {
  const { quests } = useCats();

  const dailyQuest = quests.find((q) => q.type === "daily");
  const weeklyQuests = quests.filter((q) => q.type === "weekly");
  const oneTimeQuests = quests.filter((q) => q.type === "one_time");

  const completedOneTime = oneTimeQuests.filter((q) => q.completed);
  const incompleteOneTime = oneTimeQuests.filter((q) => !q.completed);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Quêtes</Text>

      <Text style={styles.sectionTitle}>Mission du jour</Text>
      {dailyQuest ? (
        <QuestCard quest={dailyQuest} />
      ) : (
        <Text style={styles.emptyText}>Aucune mission du jour</Text>
      )}

      <Text style={styles.sectionTitle}>Défis hebdo</Text>
      {weeklyQuests.length > 0 ? (
        weeklyQuests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
      ) : (
        <Text style={styles.emptyText}>Aucun défi hebdomadaire</Text>
      )}

      {incompleteOneTime.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>À accomplir</Text>
          {incompleteOneTime.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </>
      )}

      {completedOneTime.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Succès</Text>
          {completedOneTime.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </>
      )}
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
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompleted: {
    opacity: 0.7,
    backgroundColor: colors.background,
    borderColor: "#E0E0E0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginRight: spacing.sm,
  },
  textCompleted: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  badgeXP: {
    backgroundColor: colors.primary + "20",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeXPText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  progressBackground: {
    height: 24,
    backgroundColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  progressLabelRow: {
    position: "relative",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    zIndex: 1,
  },
  timeRemaining: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  completedLabel: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
    marginTop: spacing.xs,
    textAlign: "right",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
