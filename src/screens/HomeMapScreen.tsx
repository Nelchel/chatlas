import { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { MapPin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { LevelBadge } from "../components/LevelBadge";
import { DailyChallengeWidget } from "../components/DailyChallengeWidget";
import { CampActions } from "../components/CampActions";
import { colors, spacing, borderRadius } from "../constants/theme";
import { MapTutorial } from "../components/MapTutorial";
import { LocalStorage } from "../services/storage";
import { calculateGeoStats } from "../utils/geoStats";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function SectionTitle({ children, emoji }: { children: string; emoji: string }) {
  return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={styles.sectionTitleText}>{children}</Text>
      </View>
  );
}

function getCatPinImage(color?: string | null) {
  const normalizedColor = color?.toLowerCase();

  if (normalizedColor === "roux") {
    return require("../../assets/cats/orange-cat.png");
  }

  if (normalizedColor === "noir") {
    return require("../../assets/cats/black-cat.png");
  }

  if (normalizedColor === "blanc") {
    return require("../../assets/cats/white-cat.png");
  }

  if (normalizedColor === "gris") {
    return require("../../assets/cats/grey-cat.png");
  }

  if (normalizedColor === "tricolore") {
    return require("../../assets/cats/tricolore-cat.png");
  }

  if (normalizedColor === "tigré") {
    return require("../../assets/cats/tigre-cat.png");
  }

  if (normalizedColor === "siamois") {
    return require("../../assets/cats/siamois-cat.png");
  }

  return null;
}

export function HomeMapScreen() {
  const navigation = useNavigation<Nav>();
  const { cats, sightings, loading, refresh } = useCats();
  const [showStats, setShowStats] = useState(false);
  const [campOpen, setCampOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useFocusEffect(
      useCallback(() => {
        refresh();
      }, [refresh])
  );

  useEffect(() => {
    LocalStorage.getRaw<boolean>("@catquest_map_tutorial_seen").then((seen) => {
      if (!seen) {
        const timer = setTimeout(() => setShowTutorial(true), 800);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const { cityStats, countryStats, totalCities, totalCountries } = useMemo(() => {
    return calculateGeoStats(sightings, cats);
  }, [sightings, cats]);

  const sightingsWithCoords = sightings.filter(
      (s) => s.latitude && s.longitude
  );

  const sightingsCountByCat = new Map<string, number>();

  sightingsWithCoords.forEach((s) => {
    sightingsCountByCat.set(
        s.cat_id,
        (sightingsCountByCat.get(s.cat_id) || 0) + 1
    );
  });

  const catsWithSightings = Array.from(sightingsCountByCat.entries())
      .map(([catId, count]) => {
        const cat = cats.find((c) => c.id === catId);
        return cat ? { cat, count } : null;
      })
      .filter(Boolean)
      .slice(0, 4) as { cat: any; count: number }[];

  const fallbackPins = [
    {
      id: "pin-1",
      count: 12,
      emoji: "🐈‍⬛",
      pinImage: require("../../assets/cats/black-cat.png"),
      style: styles.catPinOne,
    },
    {
      id: "pin-2",
      count: 3,
      emoji: "🐈‍⬛",
      pinImage: require("../../assets/cats/black-cat.png"),
      style: styles.catPinTwo,
    },
    {
      id: "pin-3",
      count: 2,
      emoji: "🐱",
      pinImage: require("../../assets/cats/tigre-cat.png"),
      style: styles.catPinThree,
    },
    {
      id: "pin-4",
      count: 3,
      emoji: "🐈",
      pinImage: require("../../assets/cats/orange-cat.png"),
      style: styles.catPinFour,
    },
  ];

  const pinPositions = [
    styles.catPinOne,
    styles.catPinTwo,
    styles.catPinThree,
    styles.catPinFour,
  ];

  const pins =
      catsWithSightings.length > 0
          ? catsWithSightings.map((item, index) => ({
            id: item.cat.id,
            count: item.count,
            emoji: "🐈‍⬛",
            catId: item.cat.id,
            pinImage: getCatPinImage(item.cat.color),
            style: pinPositions[index] || styles.catPinTwo,
          }))
          : fallbackPins;

  if (loading) {
    return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des chats...</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <Image
            source={require("../../assets/onboarding/paper.png")}
            style={styles.paperBackground}
            resizeMode="cover"
        />

        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Chatlas</Text>
            <Text style={styles.subtitle}>
              L'encyclopédie vivante{"\n"}des chats du monde
            </Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>🐾</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgeContainer}>
          <LevelBadge />
        </View>

        <View style={styles.mapShadow}>
          <LinearGradient
              colors={[
                "rgba(0,0,0,0.12)",
                "transparent",
                "transparent",
                "rgba(0,0,0,0.10)",
              ]}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />

          <View style={styles.mapWrapper}>
            <Image
                source={require("../../assets/map/adventure-map.png")}
                style={styles.illustratedMap}
                resizeMode="cover"
            />

            {pins.map((pin) => (
                <TouchableOpacity
                    key={pin.id}
                    style={[styles.catPin, pin.style]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if ("catId" in pin && pin.catId) {
                        navigation.navigate("CatDetail", { catId: pin.catId });
                      }
                    }}
                >
                  <View style={styles.catPinShadow}>
                    <View style={styles.catAvatar}>
                      {pin.pinImage ? (
                          <Image
                              source={pin.pinImage}
                              style={styles.catPinImage}
                              resizeMode="contain"
                          />
                      ) : (
                          <Text style={styles.catEmoji}>{pin.emoji}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.catPinPoint} />

                  <View style={styles.catPinCount}>
                    <Text style={styles.catPinCountText}>{pin.count}</Text>
                  </View>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.currentPosition}
                onPress={() => setCampOpen(true)}
            >
              <MapPin size={28} color="white" />
            </TouchableOpacity>

            {campOpen && (
                <CampActions
                    onPhotoPress={() => {
                      setCampOpen(false);
                      navigation.navigate("CaptureCat", {});
                    }}
                    onClose={() => setCampOpen(false)}
                />
            )}

            <Pressable style={styles.compass} onPress={() => setShowStats(true)}>
              <Text style={styles.compassIcon}>🧭</Text>
            </Pressable>

            <DailyChallengeWidget />

            {showStats && (
                <View style={styles.statsOverlay}>
                  <View style={styles.statsPanel}>
                    <View style={styles.statsHeader}>
                      <Text style={styles.statsTitle}>📊 Statistiques</Text>

                      <TouchableOpacity
                          onPress={() => setShowStats(false)}
                          style={styles.statsCloseBtn}
                      >
                        <Text style={styles.statsCloseText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.statsScroll}
                    >
                      <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{totalCities}</Text>
                            <Text style={styles.summaryLabel}>villes découvertes</Text>
                          </View>

                          <View style={styles.divider} />

                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{totalCountries}</Text>
                            <Text style={styles.summaryLabel}>pays explorés</Text>
                          </View>

                          <View style={styles.divider} />

                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{cats.length}</Text>
                            <Text style={styles.summaryLabel}>chats</Text>
                          </View>
                        </View>
                      </View>

                      <SectionTitle emoji="🏙️">Classement des villes</SectionTitle>

                      {cityStats.length > 0 ? (
                          <View style={styles.rankCard}>
                            {cityStats.slice(0, 7).map((city, i) => (
                                <View key={city.name} style={styles.rankRow}>
                                  <Text style={styles.rankNumber}>
                                    {i === 0
                                        ? "🥇"
                                        : i === 1
                                            ? "🥈"
                                            : i === 2
                                                ? "🥉"
                                                : `#${i + 1}`}
                                  </Text>

                                  <Text style={styles.rankName} numberOfLines={1}>
                                    {city.name}
                                  </Text>

                                  <Text style={styles.rankCount}>
                                    {city.catCount} chat{city.catCount > 1 ? "s" : ""}
                                  </Text>
                                </View>
                            ))}
                          </View>
                      ) : (
                          <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Aucune ville enregistrée</Text>
                          </View>
                      )}

                      <SectionTitle emoji="🌍">Pays</SectionTitle>

                      {countryStats.length > 0 ? (
                          <View style={styles.rankCard}>
                            {countryStats.map((country) => (
                                <View key={country.name} style={styles.countryRow}>
                                  <Text style={styles.countryFlag}>{country.flag}</Text>

                                  <Text style={styles.countryName}>{country.name}</Text>

                                  <Text style={styles.countryCount}>
                                    {country.cityCount} ville
                                    {country.cityCount > 1 ? "s" : ""} ·{" "}
                                    {country.catCount} chat
                                    {country.catCount > 1 ? "s" : ""}
                                  </Text>
                                </View>
                            ))}
                          </View>
                      ) : (
                          <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>
                              Aucune donnée de pays disponible
                            </Text>
                          </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
            )}

            <MapTutorial
              visible={showTutorial}
              onDismiss={() => setShowTutorial(false)}
            />
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EBD7",
  },

  paperBackground: {
    ...StyleSheet.absoluteFillObject,
    top: -20,
    left: -50,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  menuIcon: {
    fontSize: 24,
    color: "#3B2E24",
  },

  headerCenter: {
    alignItems: "center",
    flex: 1,
  },

  title: {
    fontSize: 36,
    color: "#2C241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  subtitle: {
    marginTop: -4,
    fontSize: 16,
    lineHeight: 16,
    textAlign: "center",
    color: "#4D463C",
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D8A24B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  profileIcon: {
    fontSize: 22,
  },

  mapShadow: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 24,
    backgroundColor: "#E7D7B8",

    shadowColor: "#2A2521",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,

    elevation: 16,
  },

  mapWrapper: {
    flex: 1,
    position: "relative",

    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E7D7B8",

    borderWidth: 1.5,
    borderColor: "#D7C8A6",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },

  illustratedMap: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  badgeContainer: {
    position: "absolute",
    top: 138,
    left: 8,
    zIndex: 20,
  },

  catPin: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
    transform: [
      { translateY: -2 },
    ]
  },

  catPinOne: {
    top: "16%",
    right: "13%",
  },

  catPinTwo: {
    top: "39%",
    left: "47%",
  },

  catPinThree: {
    bottom: "30%",
    left: "18%",
  },

  catPinFour: {
    top: "56%",
    left: "28%",
  },

  catPinShadow: {
    width: 50,
    height: 50,
    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#2D241D",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 6,
  },

  catAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,

    backgroundColor: "#c4bf8f",

    borderWidth: 3,
    borderColor: "#F5E9D4",

    alignItems: "center",
    justifyContent: "center",

  },

  catEmoji: {
    fontSize: 24,
  },

  catPinImage: {
    width: 40,
    height: 40,
  },

  catPinPoint: {
    width: 16,
    height: 16,
    position: "absolute",
    top: 45,

    backgroundColor: "#F5E9D4",

    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#F5E9D4",

    transform: [
      { rotate: "45deg" },
    ],

    marginTop: -8,

    zIndex: -1,
  },

  catPinCount: {
    position: "absolute",

    right: -6,
    bottom: -4,

    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: "#FFF6E6",

    borderWidth: 1,
    borderColor: "#E6D4B2",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#2D241D",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 4,
  },

  catPinCountText: {
    fontSize: 12,
    lineHeight: 14,
    color: "#3A2E24",
    fontFamily: "CormorantGaramond_700Bold",
  },

  currentPosition: {
    position: "absolute",
    top: "42%",
    left: "36%",

    width: 100,
    height: 100,
    borderRadius: 50,

    borderWidth: 2,
    borderColor: "white",
    borderStyle: "dashed",

    alignItems: "center",
    justifyContent: "center",

    zIndex: 12,
  },

  compass: {
    position: "absolute",
    right: 18,
    bottom: 132,

    width: 74,
    height: 74,
    borderRadius: 37,

    zIndex: 55,
    opacity: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  compassIcon: {
    fontSize: 42,
    zIndex: 55,
    opacity: 1,
    position: "relative",
  },

  statsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.15)",
    zIndex: 50,
  },

  statsPanel: {
    backgroundColor: "#F8F0DC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "55%",
    minHeight: 240,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 12,
    paddingTop: spacing.md,
  },

  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#D8C6A3",
  },

  statsTitle: {
    fontSize: 20,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  statsCloseBtn: {
    padding: spacing.sm,
  },

  statsCloseText: {
    fontSize: 18,
    color: "#7C6E5B",
    fontWeight: "600",
  },

  statsScroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },

  summaryCard: {
    backgroundColor: "rgba(255, 248, 232, 0.8)",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#D8C6A3",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  summaryItem: {
    alignItems: "center",
    flex: 1,
  },

  summaryValue: {
    fontSize: 24,
    color: "#355C3C",
    fontFamily: "CormorantGaramond_700Bold",
  },

  summaryLabel: {
    fontSize: 13,
    color: "#5D5144",
    marginTop: 2,
    textAlign: "center",
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#D8C6A3",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  sectionEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },

  sectionTitleText: {
    fontSize: 18,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  rankCard: {
    backgroundColor: "rgba(255, 248, 232, 0.8)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "#D8C6A3",
  },

  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 198, 163, 0.45)",
  },

  rankNumber: {
    fontSize: 14,
    width: 28,
    textAlign: "center",
  },

  rankName: {
    flex: 1,
    fontSize: 16,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  rankCount: {
    fontSize: 15,
    color: "#355C3C",
    fontFamily: "CormorantGaramond_700Bold",
  },

  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(216, 198, 163, 0.45)",
  },

  countryFlag: {
    fontSize: 22,
    marginRight: spacing.sm,
  },

  countryName: {
    flex: 1,
    fontSize: 16,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  countryCount: {
    fontSize: 14,
    color: "#5D5144",
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  emptyCard: {
    backgroundColor: "rgba(255, 248, 232, 0.8)",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8C6A3",
  },

  emptyText: {
    fontSize: 15,
    color: "#5D5144",
    fontFamily: "CormorantGaramond_600SemiBold",
  },
});
