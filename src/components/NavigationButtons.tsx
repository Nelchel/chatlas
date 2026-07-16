import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";

export function NavigationButtons() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const buttons = [
    { label: "🏅 Voir tous les badges", screen: "Badges" as const, color: colors.primary },
    { label: "📈 Statistiques", screen: "Stats" as const, color: "#FF9800" },
    { label: "Quêtes", screen: "Quests" as const, color: "#9C27B0" },
    { label: "🏆 Classement", screen: "Leaderboard" as const, color: colors.surface },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <TouchableOpacity
          key={btn.screen}
          style={[styles.button, { backgroundColor: btn.color }]}
          onPress={() => navigation.navigate(btn.screen)}
        >
          <Text
            style={[
              styles.buttonText,
              btn.color === colors.surface && { color: colors.text },
            ]}
          >
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
});
