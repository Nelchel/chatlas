import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DailyChallengeWidget() {
  const navigation = useNavigation<Nav>();
  const { quests } = useCats();

  const dailyQuest = quests.find((q) => q.type === "daily");
  if (!dailyQuest) return null;

  const progress = dailyQuest.progress || 0;
  const target = dailyQuest.target || 1;
  const percent = Math.min(100, (progress / target) * 100);

  return (
      <TouchableOpacity
          style={styles.container}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("Quests")}
      >
        <View style={styles.leftIcon}>
          <Text style={styles.catIcon}>🐱</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>DÉFI DU JOUR</Text>
            <Text style={styles.xpBadge}>+{dailyQuest.reward_xp} XP</Text>
          </View>

          <Text
              style={[styles.description, dailyQuest.completed && styles.completed]}
              numberOfLines={1}
          >
            {dailyQuest.description}
          </Text>

          {!dailyQuest.completed ? (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>

                <Text style={styles.progressText}>
                  {progress} / {target}
                </Text>
              </View>
          ) : (
              <Text style={styles.completedText}>Accompli !</Text>
          )}
        </View>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 18,

    minHeight: 82,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(248, 240, 220, 0.94)",

    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8C6A3",

    paddingVertical: 12,
    paddingHorizontal: 14,

    shadowColor: "#2A2521",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 9,

    zIndex: 20,
  },

  leftIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,

    backgroundColor: "#F0D9A6",
    borderWidth: 1,
    borderColor: "#D8B36A",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  catIcon: {
    fontSize: 25,
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  title: {
    flex: 1,

    fontSize: 13,
    letterSpacing: 0.6,

    color: "#3B2E24",
    fontFamily: "CormorantGaramond_700Bold",
  },

  xpBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,

    borderRadius: 999,

    overflow: "hidden",

    backgroundColor: "#F2D7A0",

    color: "#8A5A1F",

    fontSize: 13,
    fontFamily: "CormorantGaramond_700Bold",
  },

  description: {
    fontSize: 14,
    lineHeight: 18,

    color: "#2D241D",

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  completed: {
    textDecorationLine: "line-through",
    color: "#7C6E5B",
  },

  progressRow: {
    marginTop: 8,

    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  progressTrack: {
    flex: 1,
    height: 7,

    backgroundColor: "#DCCEB1",

    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",

    backgroundColor: "#355C3C",

    borderRadius: 999,
  },

  progressText: {
    minWidth: 34,

    fontSize: 12,
    color: "#3B2E24",

    fontFamily: "CormorantGaramond_700Bold",
    textAlign: "right",
  },

  completedText: {
    marginTop: 6,

    fontSize: 13,
    color: "#3E5E41",

    fontFamily: "CormorantGaramond_700Bold",
    textAlign: "right",
  },
});
