import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Share,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { getCurrentPosition } from "../services/location";
import { reverseGeocodeLocation } from "../utils/location";
import { colors, spacing, borderRadius } from "../constants/theme";

type DetailRoute = RouteProp<RootStackParamList, "CatDetail">;

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

const SOCIABILITY_MAP: Record<string, { icon: string; label: string }> = {
  timide: { icon: "🫣", label: "Timide" },
  amical: { icon: "🤗", label: "Amical" },
  calin: { icon: "😼", label: "Câlin" },
  joueur: { icon: "😈", label: "Joueur" },
  grognon: { icon: "😤", label: "Grognon" },
  curieux: { icon: "👀", label: "Curieux" },
};

const BEHAVIOR_MAP = {
  sociable: { icon: "😺", label: "Sociable" },
  aggressive: { icon: "😾", label: "Agressif" },
  gourmand: { icon: "😋", label: "Gourmand" },
  sleepy: { icon: "😴", label: "Dormeur" },
};

const AGE_LABEL: Record<string, string> = {
  chaton: "😺 Chaton",
  adulte: "🐱 Adulte",
  senior: "🐈 Senior",
};

function formatSightingLocation(
  notes: string | undefined,
  locationLabel: string | undefined,
): string {
  if (notes && notes !== "Revu !" && notes !== "Première observation") {
    return notes;
  }
  if (locationLabel) {
    if (locationLabel.match(/\d+\.\d+°[NS],\s*\d+\.\d+°[EO]/)) {
      return "📍 Lieu non déterminé";
    }
    return `📍 ${locationLabel}`;
  }
  return "📍 Lieu non déterminé";
}

export function CatDetailScreen() {
  const route = useRoute<DetailRoute>();
  const { catId } = route.params;
  const { getCatWithDetails, toggleFavorite, addSighting, toggleSightingLike, getSightingLikes, getSightingComments, addSightingComment } = useCats();
  const { user } = useAuth();
  const [resighting, setResighting] = useState(false);
  const [activeCommentSightingId, setActiveCommentSightingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const catWithDetails = getCatWithDetails(catId);

  if (!catWithDetails) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>😿</Text>
        <Text style={styles.notFound}>Chat non trouvé</Text>
      </View>
    );
  }

  const {
    name,
    photo_url,
    photos,
    color,
    breed,
    sex,
    estimated_age,
    sociability,
    behaviors,
    note,
    sightings: catSightings,
    is_favorite,
    created_at,
  } = catWithDetails;

  const uniquePhotos = Array.from(new Set(photos));
  const hasPhotos = uniquePhotos.length > 1;

  const handleImageError = () => {
    console.warn("Failed to load cat photo");
  };

  const soc = sociability ? SOCIABILITY_MAP[sociability] : null;
  const count = catSightings.length;

  const getRarity = () => {
    if (count <= 2) return { stars: "⭐⭐", label: "Rare" };
    if (count <= 6) return { stars: "⭐⭐⭐", label: "Commun" };
    return { stars: "⭐⭐⭐⭐⭐", label: "Fréquent" };
  };

  const rarity = getRarity();

  const handleToggleFavorite = () => {
    if (!user) return;
    toggleFavorite(catId, user.id).catch(() =>
      Alert.alert("Erreur", "Impossible de mettre à jour les favoris")
    );
  };

  const handleShare = async () => {
    const lastSighting = catSightings[catSightings.length - 1];
    const location = lastSighting?.location_label || "quelque part";
    const message = `Je viens de découvrir ${name || "un chat"} !\n\n${rarity.stars} ${rarity.label}\n\n${location}`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert("Erreur", "Impossible de partager");
    }
  };

  const handleResighting = async () => {
    if (!user) return;
    setResighting(true);
    try {
      const pos = await getCurrentPosition();
      const locationLabel = await reverseGeocodeLocation(pos.latitude, pos.longitude);
      await addSighting({
        cat_id: catId,
        user_id: user.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        notes: "Revu !",
        location_label: locationLabel || undefined,
        sighted_at: new Date().toISOString(),
      });
      Alert.alert("👋 Revu !", "Observation enregistrée.");
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer l'observation");
    } finally {
      setResighting(false);
    }
  };

  const sortedSightings = catSightings.slice().sort((a, b) => 
    new Date(a.sighted_at).getTime() - new Date(b.sighted_at).getTime()
  );

  const firstSighting = sortedSightings[0];

  const infoRows = [
    sex && { label: "Sexe", value: sex === "male" ? "Mâle" : sex === "female" ? "Femelle" : "Inconnu", emoji: sex === "male" ? "♂️" : sex === "female" ? "♀️" : "❓" },
    estimated_age && { label: "Âge", value: AGE_LABEL[estimated_age], emoji: "" },
    breed && { label: "Race", value: breed, emoji: "🧬" },
    color && { label: "Couleur", value: color, emoji: "🎨" },
    soc && { label: "Caractère", value: `${soc.icon} ${soc.label}`, emoji: "" },
  ].filter(Boolean) as { label: string; value: string; emoji: string }[];

  const activeBehaviors = behaviors ? Object.entries(behaviors).filter(([_, v]) => v).map(([k]) => k) : [];

  return (
    <ScrollView style={styles.container}>
      {/* Photo principale */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: uniquePhotos[selectedPhoto] || photo_url }}
          style={styles.image}
          onError={handleImageError}
          resizeMode="cover"
        />
        {hasPhotos && (
          <View style={styles.photoCounter}>
            <Text style={styles.photoCounterText}>
              {selectedPhoto + 1} / {uniquePhotos.length}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.favButton, is_favorite && styles.favButtonActive]}
          onPress={handleToggleFavorite}
        >
          <Text style={styles.favIcon}>{is_favorite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.shareIcon}>📢</Text>
        </TouchableOpacity>
      </View>

      {/* Galerie miniatures */}
      {hasPhotos && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
          {uniquePhotos.map((url, i) => (
            <TouchableOpacity
              key={`${url}-${i}`}
              onPress={() => setSelectedPhoto(i)}
              activeOpacity={0.7}
            >
              <View style={[styles.thumb, i === selectedPhoto && styles.thumbActive]}>
                <Image
                  source={{ uri: url }}
                  style={styles.thumbImage}
                  onError={handleImageError}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {/* Nom & stats */}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name || color || "Chat inconnu"}</Text>
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityStars}>{rarity.stars}</Text>
            <Text style={styles.rarityLabel}>{rarity.label}</Text>
          </View>
        </View>

        {/* Fiche info */}
        <View style={styles.infoCard}>
          {infoRows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoEmoji}>{row.emoji}</Text>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Comportements */}
        {activeBehaviors.length > 0 && (
          <View style={styles.behaviorSection}>
            <Text style={styles.sectionTitle}>🧠 Comportements</Text>
            <View style={styles.behaviorTags}>
              {activeBehaviors.map((key) => {
                const b = BEHAVIOR_MAP[key as keyof typeof BEHAVIOR_MAP];
                if (!b) return null;
                return (
                  <View key={key} style={styles.behaviorTag}>
                    <Text style={styles.behaviorTagText}>{b.icon} {b.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {note && (
          <View style={styles.noteSection}>
            <Text style={styles.sectionTitle}>📝 Note</Text>
            <Text style={styles.note}>{note}</Text>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Timeline</Text>
          {count === 0 ? (
            <Text style={styles.emptyText}>Aucune observation pour l'instant</Text>
          ) : (
            <View style={styles.timeline}>
              {sortedSightings.map((s, i) => {
                const isFirst = i === 0;
                return (
                  <View key={s.id} style={styles.timelineItem}>
                    <View style={styles.timelineConnector}>
                      <View style={[styles.timelineDot, isFirst && styles.timelineDotFirst]} />
                      {i < sortedSightings.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>
                        {new Date(s.sighted_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                      <Text style={styles.timelineTitle}>
                        {isFirst ? "Première observation" : "Revu"}
                      </Text>
                      <Text style={styles.timelineLocation}>
                        {formatSightingLocation(s.notes, s.location_label)}
                      </Text>
                      {s.photo_url && (
                        <Image source={{ uri: s.photo_url }} style={styles.timelinePhoto} />
                      )}
                      {/* Likes & comments */}
                      <View style={styles.timelineActions}>
                        <TouchableOpacity
                          style={styles.likeButton}
                          onPress={() => user && toggleSightingLike(s.id, user.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.likeIcon}>
                            {user && getSightingLikes(s.id).some((l) => l.user_id === user.id) ? "❤️" : "🤍"}
                          </Text>
                          <Text style={styles.likeCount}>{getSightingLikes(s.id).length}</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {getSightingComments(s.id).map((comment) => (
                        <View key={comment.id} style={styles.commentBubble}>
                          <Text style={styles.commentText}>"{comment.text}"</Text>
                          <Text style={styles.commentMeta}>
                            {comment.username} — {new Date(comment.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      ))}

                      {activeCommentSightingId === s.id ? (
                        <View style={styles.commentInputRow}>
                          <TextInput
                            style={styles.commentInput}
                            value={commentText}
                            onChangeText={setCommentText}
                            placeholder="Ajouter un commentaire..."
                            multiline
                            maxLength={140}
                          />
                          <TouchableOpacity
                            style={styles.commentSendButton}
                            onPress={() => {
                              if (!user || !commentText.trim()) return;
                              addSightingComment(s.id, user.id, user.username, commentText.trim());
                              setCommentText("");
                              setActiveCommentSightingId(null);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.commentSendText}>Envoyer</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.commentButton}
                          onPress={() => {
                            setActiveCommentSightingId(s.id);
                            setCommentText("");
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.commentButtonText}>💬 Commenter</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bouton revu */}
        <TouchableOpacity
          style={styles.resightButton}
          onPress={handleResighting}
          disabled={resighting}
          activeOpacity={0.8}
        >
          {resighting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.resightIcon}>📍</Text>
              <Text style={styles.resightText}>Je l'ai revu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  notFound: { fontSize: 18, color: colors.textSecondary },
  
  imageContainer: { position: "relative" },
  image: { width: "100%", height: SCREEN_HEIGHT * 0.38 },
  photoCounter: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  photoCounterText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  
  favButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  favButtonActive: { backgroundColor: "#FFF" },
  favIcon: { fontSize: 24 },
  shareButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg + 56,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  shareIcon: { fontSize: 22 },

  thumbStrip: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbActive: { borderColor: colors.primary },
  thumbImage: { width: "100%", height: "100%" },

  content: { padding: spacing.lg },
  
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  rarityStars: { fontSize: 16 },
  rarityLabel: { fontSize: 13, fontWeight: "700", color: colors.text },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoEmoji: { fontSize: 18, marginRight: spacing.sm, width: 20 },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 90,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },

  behaviorSection: { marginBottom: spacing.lg },
  behaviorTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  behaviorTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary,
  },
  behaviorTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  noteSection: { marginBottom: spacing.lg },
  note: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  
  timeline: { paddingLeft: spacing.sm },
  timelineItem: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  timelineConnector: {
    width: 24,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  timelineDotFirst: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  timelineDate: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  timelinePhoto: {
    width: "100%",
    height: 160,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  timelineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  resightButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  resightIcon: { fontSize: 18 },
  resightText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeIcon: { fontSize: 16 },
  likeCount: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  commentBubble: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  commentMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  commentButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  commentButtonText: { fontSize: 14, color: colors.textSecondary },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  commentSendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  commentSendText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
});
