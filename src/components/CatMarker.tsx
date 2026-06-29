import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { colors, borderRadius } from "../constants/theme";

interface CatMarkerProps {
  name?: string;
  sightings?: number;
  onPress?: () => void;
}

export function CatMarker({ name, sightings = 1, onPress }: CatMarkerProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.emoji}>
          🐱{sightings > 1 ? ` x${sightings}` : ""}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {name || "Chat"}
        </Text>
      </View>
      <View style={styles.arrow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 140,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.surface,
    marginTop: -1,
  },
});
