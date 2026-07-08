import { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { MapPin, X } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { LevelBadge } from "../components/LevelBadge";
import { DailyChallengeWidget } from "../components/DailyChallengeWidget";
import { colors, spacing, borderRadius } from "../constants/theme";
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

export function HomeMapScreen() {
  const navigation = useNavigation<Nav>();
  const { cats, sightings, loading, refresh } = useCats();
  const [showStats, setShowStats] = useState(false);
  const [campOpen, setCampOpen] = useState(false);

  useFocusEffect(
      useCallback(() => {
        refresh();
      }, [refresh])
  );

  const { cityStats, countryStats, totalCities, totalCountries } =
      useMemo(() => {
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
    { id: "pin-1", count: 12, emoji: "🐈‍⬛", style: styles.catPinOne },
    { id: "pin-2", count: 3, emoji: "🐈‍⬛", style: styles.catPinTwo },
    { id: "pin-3", count: 2, emoji: "🐱", style: styles.catPinThree },
    { id: "pin-4", count: 3, emoji: "🐈", style: styles.catPinFour },
  ];

  const pins =
      catsWithSightings.length > 0
          ? catsWithSightings.map((item, index) => ({
            id: item.cat.id,
            count: item.count,
            emoji: "🐈‍⬛",
            catId: item.cat.id,
            style:
                [
                  styles.catPinOne,
                  styles.catPinTwo,
                  styles.catPinThree,
                  styles.catPinFour,
                ][index] || styles.catPinTwo,
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
                <View style={styles.catAvatar}>
                  <Text style={styles.catEmoji}>{pin.emoji}</Text>
                </View>

                <Text style={styles.catPinCount}>{pin.count}</Text>
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
              <View style={styles.campActions}>
                <TouchableOpacity
                    style={[styles.campAction, styles.campActionPhoto]}
                    onPress={() => {
                      setCampOpen(false);
                      navigation.navigate("CaptureCat", {});
                    }}
                    activeOpacity={0.9}
                >
                  <View style={styles.campIconWrapper}>
                    <Image
                        source={require("../../assets/map/photo.png")}
                        style={styles.campIcon}
                        resizeMode="contain"
                    />
                  </View>
                  <View style={styles.campTextWrapper}>
                    <Text style={styles.campActionText}>Photo</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.campClose}
                    onPress={() => setCampOpen(false)}
                    activeOpacity={0.9}
                >
                  <X size={24} color="white" />
                </TouchableOpacity>
              </View>
          )}

          <TouchableOpacity
              style={styles.compass}
              activeOpacity={0.85}
              onPress={() => setShowStats(true)}
          >
            <Text style={styles.compassIcon}>🧭</Text>
          </TouchableOpacity>

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

  mapWrapper: {
    flex: 1,
    position: "relative",
    marginRight: 10,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8C9A8",
    backgroundColor: "#E7D7B8",
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
  },

  catPinOne: {
    top: "18%",
    right: "16%",
  },

  catPinTwo: {
    top: "40%",
    left: "48%",
  },

  catPinThree: {
    bottom: "34%",
    left: "22%",
  },

  catPinFour: {
    bottom: "25%",
    left: "44%",
  },

  catAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F8F0DC",
    borderWidth: 3,
    borderColor: "#FFF7E8",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#2A2521",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  catEmoji: {
    fontSize: 26,
  },

  catPinCount: {
    position: "absolute",
    right: -6,
    bottom: -4,

    minWidth: 24,
    height: 24,
    borderRadius: 12,

    backgroundColor: "#F8F0DC",
    borderWidth: 2,
    borderColor: "#FFF7E8",

    textAlign: "center",
    lineHeight: 20,

    color: "#2D241D",
    fontSize: 13,
    fontFamily: "CormorantGaramond_700Bold",

    overflow: "hidden",
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

  currentPositionIcon: {
    fontSize: 30,
  },

  compass: {
    position: "absolute",
    right: 18,
    bottom: 132,

    width: 74,
    height: 74,
    borderRadius: 37,

    backgroundColor: "rgba(248, 240, 220, 0.9)",
    borderWidth: 1,
    borderColor: "#D8C6A3",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#2A2521",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },

  compassIcon: {
    fontSize: 42,
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

  campActions: {
    position: "absolute",
    top: "37%",
    left: "35%",
    width: 150,
    height: 150,
    zIndex: 40,
  },
  campActions: {
    position: "absolute",
    top: "47%",
    left: "48%",
    width: 1,
    height: 1,
    zIndex: 45,
  },

  campAction: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 9,
  },

  campActionPhoto: {
    top: -92,
    left: -92,
  },

  campActionCats: {
    top: -92,
    left: 16,
  },

  campIconWrapper: {
    width: 75,
    height: 75,

    borderRadius: 43,

    backgroundColor: "rgba(248, 240, 220, 0.94)",

    borderWidth: 3,
    borderColor: "#E8D4A8",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#2A2521",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 8,
  },

  campIcon: {
    width: 46,
    height: 46,
  },

  campTextWrapper: {
    marginTop: -10,

    minWidth: 85,
    height: 34,

    paddingHorizontal: 18,

    borderRadius: 17,

    backgroundColor: "#FFF5E2",

    borderWidth: 2,
    borderColor: "#D9C7A2",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#2A2521",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 4,
  },

  campActionText: {
    color: "#3A2D23",
    fontSize: 18,

    fontFamily: "CormorantGaramond_700Bold",
  },

  campClose: {
    position: "absolute",
    top: 70,
    left: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#355C3C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F8F0DC",
  },
});
