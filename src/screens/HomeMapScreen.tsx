import { useState, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { useLocation } from "../hooks/useLocation";
import { CatMarker } from "../components/CatMarker";
import { colors, spacing, borderRadius } from "../constants/theme";
import { calculateGeoStats } from "../utils/geoStats";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function CityMarkerBubble({ name, count }: { name: string; count: number }) {
  return (
    <View style={styles.cityBubble}>
      <Text style={styles.cityBubbleEmoji}>🏙️</Text>
      <View>
        <Text style={styles.cityBubbleName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cityBubbleCount}>
          {count} chat{count > 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

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
  const { location, permissionGranted } = useLocation();
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const { cityStats, countryStats, totalCities, totalCountries, heatmapPoints } =
    useMemo(() => {
      return calculateGeoStats(sightings, cats);
    }, [sightings, cats]);

  const sightingsWithCoords = sightings.filter(
    (s) => s.latitude && s.longitude
  );

  const latestSightingByCat = new Map<string, (typeof sightingsWithCoords)[0]>();
  const sightingsCountByCat = new Map<string, number>();
  sightingsWithCoords.forEach((s) => {
    sightingsCountByCat.set(
      s.cat_id,
      (sightingsCountByCat.get(s.cat_id) || 0) + 1
    );
    const existing = latestSightingByCat.get(s.cat_id);
    if (!existing || s.sighted_at > existing.sighted_at) {
      latestSightingByCat.set(s.cat_id, s);
    }
  });

  const isZoomedOut = !region || (region.latitudeDelta ?? 0.05) > 0.1;

  const handleZoomToCity = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
    setShowStats(false);
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Chatlas</Text>
        <Text style={styles.subtitle}>
          {cats.length} chat{cats.length !== 1 ? "s" : ""} répertorié
          {cats.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={(ref) => { mapRef.current = ref; }}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location?.latitude || 48.8566,
            longitude: location?.longitude || 2.3522,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={permissionGranted}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={(r) => setRegion(r)}
        >
          {mapReady && showHeatmap && (
            <Heatmap
              points={heatmapPoints}
              radius={35}
              opacity={0.65}
              gradient={{
                colors: ["#00ADEF", "#55CF58", "#F7D708", "#F47B20", "#E31B23"],
                startPoints: [0.01, 0.25, 0.5, 0.75, 1.0],
                colorMapSize: 256,
              }}
            />
          )}

          {mapReady && !showHeatmap && isZoomedOut &&
            cityStats.map((city) => (
              <Marker
                key={`city-${city.name}`}
                coordinate={{
                  latitude: city.latitude,
                  longitude: city.longitude,
                }}
                onPress={() => handleZoomToCity(city.latitude, city.longitude)}
              >
                <CityMarkerBubble name={city.name} count={city.catCount} />
              </Marker>
            ))}

          {mapReady && !isZoomedOut &&
            Array.from(latestSightingByCat.entries()).map(([catId, sighting]) => {
              const cat = cats.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <Marker
                  key={catId}
                  coordinate={{
                    latitude: sighting.latitude,
                    longitude: sighting.longitude,
                  }}
                  onPress={() => navigation.navigate("CatDetail", { catId })}
                >
                  <CatMarker
                    name={cat.name}
                    sightings={sightingsCountByCat.get(catId)}
                  />
                </Marker>
              );
            })}
        </MapView>

        <View style={styles.controlsTopRight}>
          <TouchableOpacity
            style={[styles.controlBtn, showHeatmap && styles.controlBtnActive]}
            onPress={() => setShowHeatmap(!showHeatmap)}
          >
            <Text style={styles.controlBtnIcon}>🔥</Text>
            <Text style={styles.controlBtnLabel}>Carte de chaleur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, showStats && styles.controlBtnActive]}
            onPress={() => setShowStats(!showStats)}
          >
            <Text style={styles.controlBtnIcon}>📊</Text>
            <Text style={styles.controlBtnLabel}>Stats</Text>
          </TouchableOpacity>
        </View>

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
                {/* Résumé global */}
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

                {/* Classement villes */}
                <SectionTitle emoji="🏙️">Classement des villes</SectionTitle>
                {cityStats.length > 0 ? (
                  <View style={styles.rankCard}>
                    {cityStats.slice(0, 7).map((city, i) => (
                      <TouchableOpacity
                        key={city.name}
                        style={styles.rankRow}
                        onPress={() =>
                          handleZoomToCity(city.latitude, city.longitude)
                        }
                      >
                        <Text style={styles.rankNumber}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </Text>
                        <Text style={styles.rankName} numberOfLines={1}>
                          {city.name}
                        </Text>
                        <Text style={styles.rankCount}>
                          {city.catCount} chat{city.catCount > 1 ? "s" : ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Aucune ville enregistrée</Text>
                  </View>
                )}

                {/* Pays */}
                <SectionTitle emoji="🌍">Pays</SectionTitle>
                {countryStats.length > 0 ? (
                  <View style={styles.rankCard}>
                    {countryStats.map((country) => (
                      <View key={country.name} style={styles.countryRow}>
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.countryCount}>
                          {country.cityCount} ville
                          {country.cityCount > 1 ? "s" : ""} · {country.catCount} chat
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (location) {
            navigation.navigate("CaptureCat", {
              latitude: location.latitude,
              longitude: location.longitude,
            });
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>📸</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsTopRight: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.md,
    gap: spacing.sm,
  },
  controlBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 58,
  },
  controlBtnActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  controlBtnIcon: {
    fontSize: 20,
  },
  controlBtnLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cityBubble: {
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
    maxWidth: 160,
    gap: 6,
  },
  cityBubbleEmoji: {
    fontSize: 18,
  },
  cityBubbleName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  cityBubbleCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  statsPanel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
    borderBottomColor: colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  statsCloseBtn: {
    padding: spacing.sm,
  },
  statsCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statsScroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
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
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  rankCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "40",
  },
  rankNumber: {
    fontSize: 14,
    width: 28,
    textAlign: "center",
  },
  rankName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  rankCount: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "40",
  },
  countryFlag: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  countryCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
  },
});
