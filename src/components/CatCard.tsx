import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { CatWithSightings } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";

const SOCIABILITY_ICONS: Record<string, string> = {
  timide: "🫣",
  amical: "🤗",
  calin: "😼",
  joueur: "😈",
  grognon: "😤",
  curieux: "👀",
};

interface CatCardProps {
  cat: CatWithSightings;
  onPress: (catId: string) => void;
  compact?: boolean;
}

export function CatCard({ cat, onPress, compact }: CatCardProps) {
  const socIcon = cat.sociability ? SOCIABILITY_ICONS[cat.sociability] : null;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compact]}
      onPress={() => onPress(cat.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, compact && styles.avatarCompact]}>
        {cat.photo_url && !cat.photo_url.startsWith("file://") ? (
          <Image
            source={{ uri: cat.photo_url }}
            style={[styles.image, compact && styles.imageCompact]}
            onError={(e) => console.warn("CatCard image failed:", cat.photo_url)}
          />
        ) : (
          <Text style={styles.avatarEmoji}>🐱</Text>
        )}
      </View>

      <View style={[styles.info, compact && styles.infoCompact]}>
        <Text style={[styles.name, compact && styles.nameCompact]}>
          {cat.name || cat.color || "Chat inconnu"}
        </Text>
        {!compact && (
          <>
            {cat.color && <Text style={styles.detail}>{cat.color}</Text>}
            <View style={styles.meta}>
              <Text style={styles.metaText}>
                🗺️ {cat.sightings?.length || 0} obs.
              </Text>
              {socIcon && (
                <Text style={styles.socIcon}>{socIcon}</Text>
              )}
              {cat.is_favorite && <Text style={styles.heart}>❤️</Text>}
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  compact: {
    padding: spacing.sm,
    marginHorizontal: spacing.sm,
    marginVertical: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  imageCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoCompact: {
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  nameCompact: {
    fontSize: 15,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  socIcon: {
    fontSize: 16,
  },
  heart: {
    fontSize: 14,
  },
});
