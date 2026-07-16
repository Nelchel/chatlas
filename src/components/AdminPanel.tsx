import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Cat, Sighting } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";

interface AdminPanelProps {
  cats: Cat[];
  sightings: Sighting[];
  mergeCats: (keepId: string, removeId: string) => Promise<void>;
}

export function AdminPanel({ cats, sightings, mergeCats }: AdminPanelProps) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [mergeKeepId, setMergeKeepId] = useState<string | null>(null);
  const [mergeRemoveId, setMergeRemoveId] = useState<string | null>(null);

  const duplicateGroups = cats.reduce<
    { name: string; items: Cat[] }[]
  >((groups, cat) => {
    const name = cat.name?.trim().toLowerCase();
    if (!name) return groups;
    const existing = groups.find((g) => g.name === name);
    if (existing) {
      existing.items.push(cat);
    } else {
      groups.push({ name, items: [cat] });
    }
    return groups;
  }, []).filter((g) => g.items.length > 1);

  const handleMerge = async () => {
    if (!mergeKeepId || !mergeRemoveId) return;
    try {
      await mergeCats(mergeKeepId, mergeRemoveId);
      Alert.alert("✅ Fusion réussie", "Les doublons ont été fusionnés.");
      setMergeKeepId(null);
      setMergeRemoveId(null);
    } catch (e) {
      console.error("Merge error:", e);
      Alert.alert("❌ Erreur", "Impossible de fusionner les chats.");
    }
  };

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.adminToggle}
        onPress={() => setShowAdmin((p) => !p)}
      >
        <Text style={styles.adminToggleText}>
          🛠️ Admin {showAdmin ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {showAdmin && (
        <View style={styles.adminPanel}>
          <Text style={styles.adminTitle}>Fusion de doublons</Text>
          {duplicateGroups.length === 0 ? (
            <Text style={styles.adminEmpty}>Aucun doublon trouvé ✨</Text>
          ) : (
            duplicateGroups.map((group) => (
              <View key={group.name} style={styles.dupGroup}>
                <Text style={styles.dupGroupTitle}>
                  &quot;{group.items[0].name}&quot; ({group.items.length} fois)
                </Text>
                {group.items.map((cat) => {
                  const isKeep = mergeKeepId === cat.id;
                  const isRemove = mergeRemoveId === cat.id;
                  const selected = isKeep || isRemove;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.dupCard,
                        isKeep && styles.dupCardKeep,
                        isRemove && styles.dupCardRemove,
                      ]}
                      onPress={() => {
                        if (mergeKeepId === cat.id) {
                          setMergeKeepId(null);
                        } else if (mergeRemoveId === cat.id) {
                          setMergeRemoveId(null);
                        } else if (!mergeKeepId) {
                          setMergeKeepId(cat.id);
                        } else if (!mergeRemoveId && cat.id !== mergeKeepId) {
                          setMergeRemoveId(cat.id);
                        } else {
                          setMergeKeepId(cat.id);
                          setMergeRemoveId(null);
                        }
                      }}
                    >
                      {cat.photo_url ? (
                        <Image
                          source={{ uri: cat.photo_url }}
                          style={styles.dupThumb}
                        />
                      ) : (
                        <View style={styles.dupThumbPlaceholder}>
                          <Text style={styles.dupThumbEmoji}>🐱</Text>
                        </View>
                      )}
                      <View style={styles.dupInfo}>
                        <Text style={styles.dupLabel}>
                          {selected
                            ? isKeep
                              ? "🟢 Garder"
                              : "🔴 Supprimer"
                            : "Sélectionner"}
                        </Text>
                        <Text style={styles.dupMeta}>
                          {sightings.filter((s) => s.cat_id === cat.id).length} obs.
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}

          <TouchableOpacity
            style={[
              styles.mergeButton,
              (!mergeKeepId || !mergeRemoveId) &&
                styles.mergeButtonDisabled,
            ]}
            disabled={!mergeKeepId || !mergeRemoveId}
            onPress={handleMerge}
          >
            <Text style={styles.mergeButtonText}>
              {mergeKeepId && mergeRemoveId
                ? "Fusionner"
                : "Sélectionne 2 chats à fusionner"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  adminToggle: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminToggleText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  adminPanel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  adminEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dupGroup: {
    marginBottom: spacing.md,
  },
  dupGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dupCardKeep: {
    borderColor: colors.primary,
  },
  dupCardRemove: {
    borderColor: colors.error,
  },
  dupThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
  },
  dupThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  dupThumbEmoji: {
    fontSize: 22,
  },
  dupInfo: {
    flex: 1,
  },
  dupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dupMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mergeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  mergeButtonDisabled: {
    opacity: 0.4,
  },
  mergeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
