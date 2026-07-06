import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useCats } from "../hooks/useCats";
import { getTotalXPWithBonus, calculateLevelInfo } from "../utils/xp";
import { spacing } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LevelBadge() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { cats, sightings, userBadges } = useCats();

  const [levelInfo, setLevelInfo] = useState<{
    level: number;
    percentage: number;
    currentXP: number;
    requiredXP: number;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      getTotalXPWithBonus(cats, sightings, userBadges, user.id).then(
          (totalXP) => {
            const info = calculateLevelInfo(totalXP);

            setLevelInfo({
              level: info.level,
              percentage: info.percentage,
              currentXP: info.currentLevelXP ?? 0,
              requiredXP: info.xpForNextLevel ?? 0,
            });
          }
      );
    }
  }, [cats, sightings, userBadges, user]);

  if (!levelInfo) return null;

  return (
      <TouchableOpacity
          style={styles.container}
          onPress={() => navigation.navigate("Stats")}
          activeOpacity={0.86}
      >
        <View style={styles.medal}>
          <View style={styles.medalInner}>
            <Text style={styles.medalText}>{levelInfo.level}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.rank}>EXPLORATEUR NIVEAU {levelInfo.level}</Text>

          <View style={styles.progressBarBg}>
            <View
                style={[
                  styles.progressBarFill,
                  { width: `${levelInfo.percentage}%` },
                ]}
            />
          </View>

          <Text style={styles.xpText}>
            {levelInfo.currentXP} / {levelInfo.requiredXP} XP
          </Text>
        </View>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 235,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(248, 240, 220, 0.94)",
    borderRadius: 12,

    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 14,

    borderWidth: 1,
    borderColor: "#D8C6A3",

    shadowColor: "#2A2521",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },

  medal: {
    width: 30,
    height: 30,

    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#B9852B",

    backgroundColor: "#F3D89A",

    alignItems: "center",
    justifyContent: "center",

    transform: [{ rotate: "45deg" }],
    marginRight: 12,
  },

  medalInner: {
    width: 24,
    height: 24,

    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8C6120",

    alignItems: "center",
    justifyContent: "center",
  },

  medalText: {
    transform: [{ rotate: "-45deg" }],
    fontSize: 20,
    lineHeight: 22,
    color: "#3B2E24",
    fontFamily: "CormorantGaramond_700Bold",
  },

  content: {
    flex: 1,
  },

  rank: {
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#3B2E24",
    fontFamily: "CormorantGaramond_700Bold",
    marginBottom: 6,
  },

  progressBarBg: {
    height: 7,
    backgroundColor: "#DCCEB1",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 5,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#355C3C",
    borderRadius: 999,
  },

  xpText: {
    fontSize: 13,
    color: "#3B2E24",
    fontFamily: "CormorantGaramond_600SemiBold",
  },
});
