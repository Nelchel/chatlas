import { StyleSheet, View, Text } from "react-native";
import { colors, spacing, borderRadius } from "../constants/theme";

interface StatsCardProps {
  cats: number;
  sightings: number;
  favorites: number;
  badges: number;
}

export function StatsCard({
  cats,
  sightings,
  favorites,
  badges,
}: StatsCardProps) {
  const stats = [
    { label: "Chats", value: cats, emoji: "🐱" },
    { label: "Observations", value: sightings, emoji: "🗺️" },
    { label: "Favoris", value: favorites, emoji: "❤️" },
    { label: "Badges", value: badges, emoji: "🏅" },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.stat}>
          <Text style={styles.emoji}>{stat.emoji}</Text>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stat: {
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
