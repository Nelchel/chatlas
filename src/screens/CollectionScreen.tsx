import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Cat as CatIcon,
  ChevronLeft,
  Heart,
  PawPrint,
  SlidersHorizontal,
} from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList, Cat } from "../types";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CollectionTab =
    | "cats"
    | "species"
    | "colors"
    | "collections";

type CollectionFilter =
    | "all"
    | "discovered"
    | "undiscovered";

type SortMode =
    | "recent"
    | "name"
    | "rarity";

type Rarity =
    | "COMMON"
    | "RARE"
    | "EPIC"
    | "LEGENDARY";

type CollectionCat = Cat & {
  isDiscovered: boolean;
  sightingCount: number;
  isFavorite: boolean;
  rarity?: Rarity | string | null;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

const PAGE_PADDING = 16;
const CARD_GAP = 10;
const CARD_WIDTH =
    (SCREEN_WIDTH - PAGE_PADDING * 2 - CARD_GAP) / 2;

const TABS: Array<{
  key: CollectionTab;
  label: string;
}> = [
  { key: "cats", label: "Chats" },
  { key: "species", label: "Espèces" },
  { key: "colors", label: "Couleurs" },
  { key: "collections", label: "Collections" },
];

const RARITY_CONFIG: Record<
    Rarity,
    {
      label: string;
      color: string;
      background: string;
      paws: number;
    }
> = {
  COMMON: {
    label: "COMMUN",
    color: "#6F665A",
    background: "#DFD4BD",
    paws: 1,
  },
  RARE: {
    label: "RARE",
    color: "#B96B25",
    background: "#F2D2A2",
    paws: 2,
  },
  EPIC: {
    label: "ÉPIQUE",
    color: "#A8502C",
    background: "#E8BA91",
    paws: 3,
  },
  LEGENDARY: {
    label: "LÉGENDAIRE",
    color: "#85601E",
    background: "#E7C66C",
    paws: 4,
  },
};

function normalizeRarity(
    rarity?: string | null
): Rarity {
  const value = rarity?.toUpperCase();

  if (
      value === "LEGENDARY" ||
      value === "LÉGENDAIRE"
  ) {
    return "LEGENDARY";
  }

  if (value === "EPIC" || value === "ÉPIQUE") {
    return "EPIC";
  }

  if (value === "RARE") {
    return "RARE";
  }

  return "COMMON";
}

function rarityFromSightings(count: number): Rarity {
  if (count >= 16) return "COMMON";
  if (count >= 7) return "RARE";
  if (count >= 3) return "EPIC";
  return "LEGENDARY";
}

function formatCatNumber(
    index: number,
    cat: CollectionCat
): string {
  if (typeof cat.number === "number") {
    return `#${String(cat.number).padStart(4, "0")}`;
  }

  const numericId = cat.id?.match(/\d+/)?.[0];
  if (numericId) {
    return `#${numericId.padStart(6, "0").slice(-6)}`;
  }

  return `#${String(index + 1).padStart(6, "0")}`;
}

function RarityPaws({
                      count,
                      color,
                    }: {
  count: number;
  color: string;
}) {
  return (
      <View style={styles.pawsRow}>
        {Array.from({ length: 4 }).map((_, index) => (
            <PawPrint
                key={index}
                size={10}
                strokeWidth={2}
                color={
                  index < count
                      ? color
                      : "rgba(92, 76, 55, 0.20)"
                }
                fill={
                  index < count
                      ? color
                      : "transparent"
                }
            />
        ))}
      </View>
  );
}

function CollectionCard({
                          item,
                          index,
                          onPress,
                        }: {
  item: CollectionCat;
  index: number;
  onPress: () => void;
}) {
  const rarity = normalizeRarity(item.rarity);
  const rarityConfig = RARITY_CONFIG[rarity];

  const displayName =
      item.name ||
      item.color ||
      "Chat inconnu";

  return (
      <TouchableOpacity
          style={[
            styles.cardShadow,
            !item.isDiscovered &&
            styles.cardShadowUndiscovered,
          ]}
          activeOpacity={item.isDiscovered ? 0.86 : 1}
          onPress={onPress}
          disabled={!item.isDiscovered}
      >
        <View style={styles.card}>
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.cardPaper}
              resizeMode="cover"
          />

          <View style={styles.cardNumberRow}>
            <Text style={styles.cardNumber}>
              {formatCatNumber(index, item)}
            </Text>

            {item.isFavorite && item.isDiscovered && (
                <View style={styles.favoriteBadge}>
                  <Heart
                      size={12}
                      color="#B7503D"
                      fill="#B7503D"
                      strokeWidth={2}
                  />
                </View>
            )}
          </View>

          <View style={styles.imageFrame}>
            {item.isDiscovered && item.photo_url ? (
                <Image
                    source={{ uri: item.photo_url }}
                    style={styles.catImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.mysteryImage}>
                  <View style={styles.mysteryHalo} />

                  <CatIcon
                      size={64}
                      color="#4D453D"
                      fill="#4D453D"
                      strokeWidth={1.3}
                  />

                  <Text style={styles.mysteryQuestion}>
                    ?
                  </Text>
                </View>
            )}

            <View style={styles.photoAgingTop} />
            <View style={styles.photoAgingBottom} />
          </View>

          <View style={styles.cardContent}>
            <Text
                style={[
                  styles.catName,
                  !item.isDiscovered &&
                  styles.catNameUnknown,
                ]}
                numberOfLines={2}
            >
              {item.isDiscovered
                  ? displayName
                  : "?????"}
            </Text>

            {item.isDiscovered ? (
                <>
                  <RarityPaws
                      count={rarityConfig.paws}
                      color={rarityConfig.color}
                  />

                  <View style={styles.cardFooter}>
                    <View
                        style={[
                          styles.rarityBadge,
                          {
                            backgroundColor:
                            rarityConfig.background,
                          },
                        ]}
                    >
                      <Text
                          style={[
                            styles.rarityText,
                            {
                              color: rarityConfig.color,
                            },
                          ]}
                      >
                        {rarityConfig.label}
                      </Text>
                    </View>

                    <Text style={styles.sightingCount}>
                      {item.sightingCount} vue
                      {item.sightingCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                </>
            ) : (
                <View style={styles.undiscoveredFooter}>
                  <Text style={styles.undiscoveredLabel}>
                    À DÉCOUVRIR
                  </Text>
                </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
  );
}

export function CollectionScreen() {
  const navigation = useNavigation<Nav>();

  const {
    cats,
    sightings,
    favorites,
    refresh,
    loading,
  } = useCats();

  const { user } = useAuth();

  const [activeTab, setActiveTab] =
      useState<CollectionTab>("cats");

  const [filter, setFilter] =
      useState<CollectionFilter>("all");

  const [sortMode, setSortMode] =
      useState<SortMode>("recent");

  useFocusEffect(
      useCallback(() => {
        refresh();
      }, [refresh])
  );

  const encyclopedia = useMemo(() => {
    const discoveredFromSightings = new Set(
        sightings
            .filter(
                (sighting) =>
                    user &&
                    sighting.user_id === user.id
            )
            .map((sighting) => sighting.cat_id)
    );

    const createdByUser = new Set(
        cats
            .filter(
                (cat) =>
                    user &&
                    cat.user_id === user.id
            )
            .map((cat) => cat.id)
    );

    const discoveredIds = new Set([
      ...discoveredFromSightings,
      ...createdByUser,
    ]);

    const encyclopediaCats: CollectionCat[] =
        cats.map((cat) => {
          const sightingCount = sightings.filter(
              (sighting) =>
                  sighting.cat_id === cat.id
          ).length;

          const isFavorite = favorites.some(
              (favorite) =>
                  favorite.cat_id === cat.id &&
                  (!user ||
                      favorite.user_id === user.id)
          );

          return {
            ...cat,
            isDiscovered: discoveredIds.has(cat.id),
            sightingCount,
            isFavorite,
            rarity: rarityFromSightings(sightingCount),
          };
        });

    return {
      total: cats.length,
      discovered: discoveredIds.size,
      cats: encyclopediaCats,
    };
  }, [cats, sightings, favorites, user]);

  const visibleCats = useMemo(() => {
    let result = [...encyclopedia.cats];

    if (filter === "discovered") {
      result = result.filter(
          (cat) => cat.isDiscovered
      );
    }

    if (filter === "undiscovered") {
      result = result.filter(
          (cat) => !cat.isDiscovered
      );
    }

    result.sort((a, b) => {
      if (sortMode === "name") {
        return (
            a.name || a.color || ""
        ).localeCompare(
            b.name || b.color || "",
            "fr"
        );
      }

      if (sortMode === "rarity") {
        const rarityScore: Record<Rarity, number> = {
          COMMON: 1,
          RARE: 2,
          EPIC: 3,
          LEGENDARY: 4,
        };

        return (
            rarityScore[
                normalizeRarity(b.rarity)
                ] -
            rarityScore[
                normalizeRarity(a.rarity)
                ]
        );
      }

      return Number(b.isDiscovered) -
          Number(a.isDiscovered);
    });

    return result;
  }, [encyclopedia, filter, sortMode]);

  const cycleSortMode = () => {
    setSortMode((current) => {
      if (current === "recent") {
        return "name";
      }

      if (current === "name") {
        return "rarity";
      }

      return "recent";
    });
  };

  const getSortLabel = () => {
    if (sortMode === "name") {
      return "Nom";
    }

    if (sortMode === "rarity") {
      return "Rareté";
    }

    return "Trier";
  };

  if (loading && cats.length === 0) {
    return (
        <View style={styles.centered}>
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.paperBackground}
              resizeMode="cover"
          />

          <ActivityIndicator
              size="large"
              color="#355C3C"
          />

          <Text style={styles.loadingText}>
            Ouverture du Chatlas…
          </Text>
        </View>
    );
  }

  return (
      <View style={styles.screen}>
        <Image
            source={require("../../assets/onboarding/paper.png")}
            style={styles.paperBackground}
            resizeMode="cover"
        />

        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
          >
            <ChevronLeft
                size={24}
                color="#6B5131"
                strokeWidth={1.8}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Collection
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const active =
                activeTab === tab.key;

            return (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tab,
                      active && styles.tabActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() =>
                        setActiveTab(tab.key)
                    }
                >
                  <Text
                      style={[
                        styles.tabText,
                        active &&
                        styles.tabTextActive,
                      ]}
                      numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.toolbar}>
          <TouchableOpacity
              style={styles.collectionCountButton}
              activeOpacity={0.75}
              onPress={() => {
                setFilter((current) => {
                  if (current === "all") {
                    return "discovered";
                  }

                  if (current === "discovered") {
                    return "undiscovered";
                  }

                  return "all";
                });
              }}
          >
            <Text style={styles.collectionCount}>
              {filter === "undiscovered"
                  ? encyclopedia.total -
                  encyclopedia.discovered
                  : filter === "discovered"
                      ? encyclopedia.discovered
                      : encyclopedia.total}
              {" / "}
              {encyclopedia.total}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
              style={styles.sortButton}
              activeOpacity={0.75}
              onPress={cycleSortMode}
          >
            <SlidersHorizontal
                size={14}
                color="#4F4436"
                strokeWidth={1.8}
            />

            <Text style={styles.sortText}>
              {getSortLabel()}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab !== "cats" ? (
            <View style={styles.comingSoon}>
              <View style={styles.comingSoonIcon}>
                <PawPrint
                    size={38}
                    color="#A27635"
                    strokeWidth={1.6}
                />
              </View>

              <Text style={styles.comingSoonTitle}>
                Bientôt disponible
              </Text>

              <Text style={styles.comingSoonText}>
                Cette partie du Chatlas est encore
                en cours de préparation.
              </Text>
            </View>
        ) : visibleCats.length === 0 ? (
            <View style={styles.comingSoon}>
              <CatIcon
                  size={60}
                  color="#A27635"
                  strokeWidth={1.5}
              />

              <Text style={styles.comingSoonTitle}>
                Aucun chat ici
              </Text>

              <Text style={styles.comingSoonText}>
                Pars explorer pour enrichir ta
                collection.
              </Text>
            </View>
        ) : (
            <FlatList
                data={visibleCats}
                keyExtractor={(item) => item.id}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                columnWrapperStyle={
                  styles.columnWrapper
                }
                renderItem={({ item, index }) => (
                    <CollectionCard
                        item={item}
                        index={index}
                        onPress={() =>
                            navigation.navigate(
                                "CatDetail",
                                {
                                  catId: item.id,
                                }
                            )
                        }
                    />
                )}
            />
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4E8CE",
  },

  paperBackground: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "115%",
    top: -28,
    left: -40,
    opacity: 0.97,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4E8CE",
  },

  loadingText: {
    marginTop: 12,
    color: "#625441",
    fontSize: 16,
    fontFamily:
        "CormorantGaramond_600SemiBold",
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 12,
    paddingBottom: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 38,
    height: 38,
  },

  title: {
    color: "#2F271F",
    fontSize: 28,
    lineHeight: 32,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  tabs: {
    paddingHorizontal: PAGE_PADDING,
    marginBottom: 10,

    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tab: {
    flex: 1,
    minHeight: 32,

    paddingHorizontal: 5,
    paddingVertical: 6,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
        "rgba(224, 197, 145, 0.58)",

    borderWidth: 1,
    borderColor:
        "rgba(185, 145, 80, 0.20)",
  },

  tabActive: {
    backgroundColor: "#355C3C",
    borderColor: "#355C3C",

    shadowColor: "#243922",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  tabText: {
    color: "#5B4D3B",
    fontSize: 13,
    textAlign: "center",
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  tabTextActive: {
    color: "#FFF8E8",
  },

  toolbar: {
    paddingHorizontal: PAGE_PADDING,
    marginBottom: 9,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  collectionCountButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },

  collectionCount: {
    color: "#3C342A",
    fontSize: 13,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  sortButton: {
    minHeight: 28,

    flexDirection: "row",
    alignItems: "center",
    gap: 5,

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 999,
  },

  sortText: {
    color: "#4F4436",
    fontSize: 12,
    fontFamily:
        "CormorantGaramond_600SemiBold",
  },

  list: {
    paddingHorizontal: PAGE_PADDING,
    paddingTop: 2,
    paddingBottom: 110,
  },

  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  cardShadow: {
    width: CARD_WIDTH,

    borderRadius: 8,

    backgroundColor: "#D8C09A",

    shadowColor: "#483724",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,

    elevation: 6,
  },

  cardShadowUndiscovered: {
    opacity: 0.78,
  },

  card: {
    width: "100%",
    minHeight: 220,

    borderRadius: 8,
    overflow: "hidden",

    backgroundColor: "#EBD4AA",

    borderWidth: 1,
    borderColor: "#CBAA76",
  },

  cardPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "130%",
    height: "130%",
    top: -20,
    left: -20,
    opacity: 0.68,
  },

  cardNumberRow: {
    minHeight: 25,

    paddingTop: 7,
    paddingHorizontal: 8,
    paddingBottom: 4,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardNumber: {
    color: "#3F3427",
    fontSize: 11,
    letterSpacing: 0.25,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  favoriteBadge: {
    width: 20,
    height: 20,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
        "rgba(255, 248, 232, 0.88)",

    borderWidth: 1,
    borderColor: "#D7B98A",
  },

  imageFrame: {
    height: 126,
    marginHorizontal: 7,

    position: "relative",
    overflow: "hidden",

    borderRadius: 4,

    backgroundColor: "#B89D73",

    borderWidth: 1.5,
    borderColor: "#9E7A4C",
  },

  catImage: {
    width: "100%",
    height: "100%",
  },

  mysteryImage: {
    width: "100%",
    height: "100%",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#B8AA8C",
  },

  mysteryHalo: {
    position: "absolute",

    width: 94,
    height: 94,

    borderRadius: 47,

    backgroundColor:
        "rgba(245, 229, 198, 0.28)",
  },

  mysteryQuestion: {
    position: "absolute",
    right: 10,
    bottom: 6,

    color: "rgba(255,255,255,0.70)",
    fontSize: 28,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  photoAgingTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,

    height: 18,

    backgroundColor:
        "rgba(76, 50, 28, 0.08)",
  },

  photoAgingBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    height: 22,

    backgroundColor:
        "rgba(55, 35, 20, 0.10)",
  },

  cardContent: {
    flex: 1,

    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 8,
  },

  catName: {

    color: "#2F271F",
    fontSize: 14,
    lineHeight: 15,

    fontFamily:
        "CormorantGaramond_700Bold",
  },

  catNameUnknown: {
    color: "#615748",
    letterSpacing: 1.5,
  },

  pawsRow: {
    height: 14,

    marginTop: 2,

    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  cardFooter: {
    marginTop: 4,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rarityBadge: {
    minHeight: 19,

    paddingHorizontal: 6,
    paddingVertical: 3,

    borderRadius: 999,

    justifyContent: "center",
  },

  rarityText: {
    fontSize: 8,
    letterSpacing: 0.45,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  sightingCount: {
    color: "#756650",
    fontSize: 9,
    fontFamily:
        "CormorantGaramond_600SemiBold",
  },

  undiscoveredFooter: {
    marginTop: 12,

    alignItems: "flex-start",
  },

  undiscoveredLabel: {
    color: "#74634E",
    fontSize: 9,
    letterSpacing: 0.7,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  comingSoon: {
    flex: 1,

    paddingHorizontal: 38,
    paddingBottom: 80,

    alignItems: "center",
    justifyContent: "center",
  },

  comingSoonIcon: {
    width: 78,
    height: 78,

    marginBottom: 15,

    borderRadius: 39,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
        "rgba(231, 204, 154, 0.68)",

    borderWidth: 1,
    borderColor: "#D3B176",
  },

  comingSoonTitle: {
    color: "#352C23",
    fontSize: 22,
    fontFamily:
        "CormorantGaramond_700Bold",
  },

  comingSoonText: {
    marginTop: 6,

    color: "#756653",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",

    fontFamily:
        "CormorantGaramond_600SemiBold",
  },
});
