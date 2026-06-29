import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList, Cat } from "../types";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, borderRadius } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CollectionScreen() {
  const navigation = useNavigation<Nav>();
  const { cats, sightings, favorites, refresh, loading } = useCats();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "discovered" | "undiscovered">("all");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  // Encyclopédie globale : tous les chats de tous les utilisateurs
  const encyclopedia = useMemo(() => {
    const total = cats.length;
    const discoveredCatIds = new Set(
      sightings
        .filter((s) => user && s.user_id === user.id)
        .map((s) => s.cat_id)
    );
    // Ajouter aussi les chats créés par l'utilisateur
    const createdCatIds = new Set(
      cats.filter((c) => user && c.user_id === user.id).map((c) => c.id)
    );
    const discoveredIds = new Set([...discoveredCatIds, ...createdCatIds]);
    const discovered = discoveredIds.size;

    const encyclopediaCats = cats.map((cat) => {
      const isDiscovered = discoveredIds.has(cat.id);
      const sightingCount = sightings.filter((s) => s.cat_id === cat.id).length;
      const isFavorite = favorites.some((f) => f.cat_id === cat.id && (!user || f.user_id === user.id));
      return {
        ...cat,
        isDiscovered,
        sightingCount,
        isFavorite,
      };
    });

    return {
      total,
      discovered,
      encyclopediaCats,
    };
  }, [cats, sightings, favorites, user]);

  const filteredCats = useMemo(() => {
    switch (filter) {
      case "discovered":
        return encyclopedia.encyclopediaCats.filter((c) => c.isDiscovered);
      case "undiscovered":
        return encyclopedia.encyclopediaCats.filter((c) => !c.isDiscovered);
      default:
        return encyclopedia.encyclopediaCats;
    }
  }, [encyclopedia, filter]);

  const progress = encyclopedia.total > 0 ? encyclopedia.discovered / encyclopedia.total : 0;
  const GOAL = 500; // Objectif encyclopédique
  const progressToGoal = Math.min(encyclopedia.discovered / GOAL, 1);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Cat & { isDiscovered: boolean; sightingCount: number; isFavorite: boolean } }) => {
    return (
      <TouchableOpacity
        style={[styles.card, !item.isDiscovered && styles.cardUndiscovered]}
        onPress={() => item.isDiscovered && navigation.navigate("CatDetail", { catId: item.id })}
        activeOpacity={item.isDiscovered ? 0.7 : 0.9}
      >
        <View style={styles.imageWrap}>
          {item.isDiscovered ? (
            <Image source={{ uri: item.photo_url }} style={styles.image} />
          ) : (
            <View style={styles.mysteryImage}>
              <Text style={styles.mysteryEmoji}>❓</Text>
            </View>
          )}
          {item.isDiscovered && item.isFavorite && (
            <View style={styles.favBadge}>
              <Text style={styles.favBadgeText}>❤️</Text>
            </View>
          )}
          {!item.isDiscovered && (
            <View style={styles.undiscoveredOverlay}>
              <Text style={styles.undiscoveredText}>Non découvert</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, !item.isDiscovered && styles.cardNameMuted]} numberOfLines={1}>
            {item.name || item.color || "Chat inconnu"}
          </Text>
          <View style={styles.cardMetaRow}>
            {item.isDiscovered ? (
              <>
                <Text style={styles.cardMeta}>{item.sightingCount} observation{item.sightingCount > 1 ? "s" : ""}</Text>
                <Text style={styles.cardMetaDot}>·</Text>
                <Text style={styles.cardMetaSeen}>✓ Vu</Text>
              </>
            ) : (
              <Text style={styles.cardMetaUndiscovered}>👀 À découvrir</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Chatlas</Text>
        <Text style={styles.subtitle}>L'encyclopédie des chats</Text>

        {/* Barre de progression vers l'objectif */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Chats observés</Text>
            <Text style={styles.progressValue}>
              {encyclopedia.discovered} / {GOAL}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressToGoal * 100}%` }]} />
          </View>
          <Text style={styles.progressSub}>
            {encyclopedia.total} chats répertoriés dans la région
          </Text>
        </View>

        {/* Filtres */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "all" && styles.filterActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
              Tous ({encyclopedia.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "discovered" && styles.filterActive]}
            onPress={() => setFilter("discovered")}
          >
            <Text style={[styles.filterText, filter === "discovered" && styles.filterTextActive]}>
              ✓ Découverts ({encyclopedia.discovered})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "undiscovered" && styles.filterActive]}
            onPress={() => setFilter("undiscovered")}
          >
            <Text style={[styles.filterText, filter === "undiscovered" && styles.filterTextActive]}>
              👀 À découvrir ({encyclopedia.total - encyclopedia.discovered})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredCats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyTitle}>Aucun chat ici</Text>
          <Text style={styles.emptyText}>
            {filter === "undiscovered"
              ? "Tu as découvert tous les chats répertoriés !"
              : "L'encyclopédie est vide pour l'instant."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const CARD_GAP = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  progressSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  filterTextActive: {
    color: "#FFF",
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUndiscovered: {
    opacity: 0.7,
  },
  imageWrap: {
    position: "relative",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  mysteryImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  mysteryEmoji: {
    fontSize: 48,
  },
  undiscoveredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    alignItems: "center",
  },
  undiscoveredText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  favBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  favBadgeText: {
    fontSize: 14,
  },
  cardInfo: {
    padding: spacing.sm,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  cardNameMuted: {
    color: colors.textSecondary,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardMetaDot: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardMetaSeen: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  cardMetaUndiscovered: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
