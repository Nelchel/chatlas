import { useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, borderRadius } from "../constants/theme";
import { calculateLevelInfo, calculateTotalXP } from "../utils/xp";

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, emoji }: { title: string; emoji: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function StatsScreen() {
  const { cats, sightings, userBadges, loading } = useCats();
  const { user } = useAuth();

  const stats = useMemo(() => {
    const userId = user?.id;
    const userCats = userId ? cats.filter((c) => c.user_id === userId) : cats;
    const userSightings = userId ? sightings.filter((s) => s.user_id === userId) : sightings;

    const totalCats = userCats.length;
    const uniqueCatIds = new Set(userSightings.map((s) => s.cat_id));
    const totalUniqueCatsSeen = uniqueCatIds.size;
    const totalSightings = userSightings.length;

    // Moyenne par jour
    let avgPerDay = "0";
    if (userSightings.length > 0) {
      const dates = userSightings
        .map((s) => new Date(s.sighted_at))
        .sort((a, b) => a.getTime() - b.getTime());
      const firstDate = dates[0].getTime();
      const lastDate = dates[dates.length - 1].getTime();
      const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1);
      avgPerDay = (totalSightings / daysDiff).toFixed(1);
    }

    // Temps depuis le premier chat
    let timeSinceFirst = "—";
    if (userCats.length > 0) {
      const dates = userCats
        .filter((c) => c.created_at)
        .map((c) => new Date(c.created_at))
        .sort((a, b) => a.getTime() - b.getTime());
      if (dates.length > 0) {
        const first = dates[0].getTime();
        const now = Date.now();
        const diff = now - first;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);
        if (years > 0) {
          timeSinceFirst = `${years} an${years > 1 ? "s" : ""}`;
        } else if (months > 0) {
          timeSinceFirst = `${months} mois`;
        } else {
          timeSinceFirst = `${days} jour${days > 1 ? "s" : ""}`;
        }
      }
    }

    // Espèces (races) observées
    const breeds = new Set(userCats.map((c) => c.breed).filter(Boolean));
    const totalBreeds = breeds.size;

    // Couleurs les plus fréquentes
    const colorCounts: Record<string, number> = {};
    for (const cat of userCats) {
      if (cat.color) {
        const color = cat.color.toLowerCase();
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Ville préférée (par sightings)
    const cityCounts: Record<string, number> = {};
    for (const s of userSightings) {
      if (s.location_label) {
        cityCounts[s.location_label] = (cityCounts[s.location_label] || 0) + 1;
      }
    }
    const sortedCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const favoriteCity = sortedCities.length > 0 ? sortedCities[0][0] : "—";
    const maxCityCount = sortedCities.length > 0 ? sortedCities[0][1] : 0;

    // Top chats revus (chercher dans cats global pour les noms)
    const catSightings: Record<string, number> = {};
    for (const s of userSightings) {
      catSightings[s.cat_id] = (catSightings[s.cat_id] || 0) + 1;
    }
    const topCats = Object.entries(catSightings)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([catId, count]) => ({
        cat: cats.find((c) => c.id === catId),
        count,
      }));

    return {
      totalCats,
      totalUniqueCatsSeen,
      totalSightings,
      avgPerDay,
      timeSinceFirst,
      totalBreeds,
      sortedColors,
      favoriteCity,
      maxCityCount,
      sortedCities,
      topCats,
    };
  }, [cats, sightings, user]);

  const levelInfo = useMemo(() => {
    const userId = user?.id;
    const totalXP = calculateTotalXP(cats, sightings, userBadges, userId);
    return calculateLevelInfo(totalXP);
  }, [cats, sightings, userBadges, user]);

  const heatLevel = (count: number, max: number) => {
    if (max === 0) return "🔵";
    const ratio = count / max;
    if (ratio > 0.8) return "🔥🔥🔥";
    if (ratio > 0.5) return "🔥🔥";
    if (ratio > 0.2) return "🔥";
    return "🧊";
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📈</Text>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>

      <View style={styles.cardsGrid}>
        <StatCard
          label="Niveau"
          value={levelInfo.level.toString()}
          emoji="🎖️"
        />
        <StatCard
          label="Chats vus"
          value={stats.totalUniqueCatsSeen.toString()}
          emoji="🐱"
        />
        <StatCard
          label="Observations"
          value={stats.totalSightings.toString()}
          emoji="👁️"
        />
        <StatCard label="Moy / jour" value={stats.avgPerDay} emoji="📊" />
        <StatCard
          label="Premier chat"
          value={stats.timeSinceFirst}
          emoji="⏳"
        />
      </View>

      <Section title="Progression XP" emoji="✨" />
      <View style={styles.infoCard}>
        <View style={styles.xpBarBackground}>
          <View
            style={[
              styles.xpBarFill,
              { width: `${levelInfo.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.xpDetail}>
          {levelInfo.xpProgress} / {levelInfo.xpNeeded} XP pour niveau {levelInfo.level + 1}
        </Text>
        <Text style={styles.xpTotal}>Total : {levelInfo.totalXP} XP</Text>
      </View>

      <Section title="Espèces observées" emoji="🧬" />
      {stats.totalBreeds > 0 ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>
            {stats.totalBreeds} espèce{stats.totalBreeds > 1 ? "s" : ""}
            {" "}
            différente{stats.totalBreeds > 1 ? "s" : ""}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune espèce enregistrée</Text>
        </View>
      )}

      <Section title="Couleurs populaires" emoji="🎨" />
      {stats.sortedColors.length > 0 ? (
        <View style={styles.infoCard}>
          {stats.sortedColors.map(([color, count]) => (
            <View key={color} style={styles.row}>
              <Text style={styles.rowLabel}>{color}</Text>
              <Text style={styles.rowValue}>{count}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune couleur enregistrée</Text>
        </View>
      )}

      <Section title="Carte de chaleur" emoji="😺" />
      {stats.sortedCities.length > 0 ? (
        <View style={styles.infoCard}>
          {stats.sortedCities.map(([city, count]) => (
            <View key={city} style={styles.row}>
              <Text style={styles.rowLabel}>{city}</Text>
              <Text style={styles.rowHeat}>
                {heatLevel(count, stats.maxCityCount)} {count}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune observation géolocalisée</Text>
        </View>
      )}

      <Section title="Top chats revus" emoji="🏆" />
      {stats.topCats.length > 0 ? (
        <View style={styles.infoCard}>
          {stats.topCats.map(({ cat, count }, i) => (
            <View key={cat?.id || i} style={styles.row}>
              <Text style={styles.rowLabel}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}{" "}
                {cat?.name || "Chat inconnu"}
              </Text>
              <Text style={styles.rowValue}>{count} obs.</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun chat revu</Text>
        </View>
      )}

      <Section title="Ville préférée" emoji="🏙️" />
      <View style={styles.infoCard}>
        <Text style={styles.infoValue}>
          {stats.favoriteCity}
          {stats.maxCityCount > 0 && (
            <Text style={styles.infoSub}>
              {" "}· {stats.maxCityCount} observation
              {stats.maxCityCount > 1 ? "s" : ""}
            </Text>
          )}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: spacing.lg,
  },
  headerEmoji: { fontSize: 48, marginBottom: spacing.sm },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEmoji: { fontSize: 28, marginBottom: spacing.sm },
  cardValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionEmoji: { fontSize: 22, marginRight: spacing.sm },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "40",
  },
  rowLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  rowHeat: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  xpBarBackground: {
    width: "100%",
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  xpDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  xpTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  infoSub: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "400",
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
});
