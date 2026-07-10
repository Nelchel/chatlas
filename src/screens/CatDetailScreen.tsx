import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  PawPrint,
  Share2,
  UserRound,
} from "lucide-react-native";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { getCurrentPosition } from "../services/location";
import { reverseGeocodeLocation } from "../utils/location";

type DetailRoute = RouteProp<RootStackParamList, "CatDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type DetailTab = "timeline" | "gallery" | "infos";

const SCREEN_WIDTH = Dimensions.get("window").width;

const SOCIABILITY_MAP: Record<
    string,
    {
      icon: string;
      label: string;
    }
> = {
  timide: {
    icon: "🫣",
    label: "Timide",
  },
  amical: {
    icon: "🤗",
    label: "Amical",
  },
  calin: {
    icon: "😼",
    label: "Câlin",
  },
  joueur: {
    icon: "😈",
    label: "Joueur",
  },
  grognon: {
    icon: "😤",
    label: "Grognon",
  },
  curieux: {
    icon: "👀",
    label: "Curieux",
  },
};

const BEHAVIOR_MAP = {
  sociable: {
    icon: "😺",
    label: "Sociable",
  },
  aggressive: {
    icon: "😾",
    label: "Agressif",
  },
  gourmand: {
    icon: "😋",
    label: "Gourmand",
  },
  sleepy: {
    icon: "😴",
    label: "Dormeur",
  },
};

const AGE_LABEL: Record<string, string> = {
  chaton: "Chaton",
  adulte: "Adulte",
  senior: "Senior",
};

const TABS: Array<{
  key: DetailTab;
  label: string;
}> = [
  {
    key: "timeline",
    label: "TIMELINE",
  },
  {
    key: "gallery",
    label: "GALERIE",
  },
  {
    key: "infos",
    label: "INFOS",
  },
];

function formatDate(date?: string | null) {
  if (!date) return "Inconnue";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date?: string | null) {
  if (!date) return "Inconnue";

  const value = new Date(date);
  const today = new Date();

  const isToday =
      value.getDate() === today.getDate() &&
      value.getMonth() === today.getMonth() &&
      value.getFullYear() === today.getFullYear();

  if (isToday) {
    return "Aujourd’hui";
  }

  return value.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSightingLocation(
    notes?: string,
    locationLabel?: string
): string {
  if (
      notes &&
      notes !== "Revu !" &&
      notes !== "Première observation"
  ) {
    return notes;
  }

  if (locationLabel) {
    if (
        locationLabel.match(
            /\d+\.\d+°[NS],\s*\d+\.\d+°[EO]/
        )
    ) {
      return "Lieu non déterminé";
    }

    return locationLabel;
  }

  return "Lieu non déterminé";
}

function getCatNumber(catId: string) {
  const digits = catId.match(/\d+/)?.[0];

  if (digits) {
    return `#${digits.padStart(6, "0").slice(-6)}`;
  }

  return `#${catId.slice(0, 6).toUpperCase()}`;
}

function InfoRow({
                   icon,
                   label,
                   value,
                 }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>{icon}</View>

        <Text style={styles.infoLabel}>{label}</Text>

        <Text
            style={styles.infoValue}
            numberOfLines={2}
        >
          {value}
        </Text>
      </View>
  );
}

function Tag({
               emoji,
               label,
             }: {
  emoji: string;
  label: string;
}) {
  return (
      <View style={styles.tag}>
        <Text style={styles.tagEmoji}>{emoji}</Text>
        <Text style={styles.tagText}>{label}</Text>
      </View>
  );
}

export function CatDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();

  const { catId } = route.params;

  const {
    getCatWithDetails,
    toggleFavorite,
    addSighting,
    toggleSightingLike,
    getSightingLikes,
    getSightingComments,
    addSightingComment,
    loading,
  } = useCats();

  const { user } = useAuth();

  const [resighting, setResighting] = useState(false);
  const [activeTab, setActiveTab] =
      useState<DetailTab>("timeline");
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [
    activeCommentSightingId,
    setActiveCommentSightingId,
  ] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const catWithDetails = getCatWithDetails(catId);

  const sortedSightings = useMemo(() => {
    if (!catWithDetails) return [];

    return [...catWithDetails.sightings].sort(
        (a, b) =>
            new Date(b.sighted_at).getTime() -
            new Date(a.sighted_at).getTime()
    );
  }, [catWithDetails]);

  if (!catWithDetails) {
    if (loading) {
      return (
          <View style={styles.centered}>
            <Image
                source={require("../../assets/onboarding/paper.png")}
                style={styles.paperBackground}
                resizeMode="cover"
            />
            <ActivityIndicator size="large" color="#355C3C" />
            <Text style={styles.loadingText}>Chargement du chat...</Text>
          </View>
      );
    }
    return (
        <View style={styles.centered}>
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.paperBackground}
              resizeMode="cover"
          />

          <Text style={styles.notFoundEmoji}>😿</Text>
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
  } = catWithDetails;

  const uniquePhotos = Array.from(
      new Set(
          [photo_url, ...(photos || [])].filter(
              (photo): photo is string => Boolean(photo)
          )
      )
  );

  const currentPhoto =
      uniquePhotos[selectedPhoto] || photo_url;

  const count = catSightings.length;

  const firstSighting = [...catSightings].sort(
      (a, b) =>
          new Date(a.sighted_at).getTime() -
          new Date(b.sighted_at).getTime()
  )[0];

  const lastSighting = sortedSightings[0];

  const sociabilityInfo = sociability
      ? SOCIABILITY_MAP[sociability]
      : null;

  const activeBehaviors = behaviors
      ? Object.entries(behaviors)
          .filter(([, value]) => value)
          .map(([key]) => key)
      : [];

  const getRarity = () => {
    if (count >= 16) {
      return {
        paws: 1,
        label: "COMMUN",
        color: "#746958",
        background: "#DFD4BD",
      };
    }

    if (count >= 7) {
      return {
        paws: 2,
        label: "RARE",
        color: "#B56A25",
        background: "#F1D39F",
      };
    }

    if (count >= 3) {
      return {
        paws: 3,
        label: "ÉPIQUE",
        color: "#A44E2B",
        background: "#E8B98F",
      };
    }

    return {
      paws: 4,
      label: "LÉGENDAIRE",
      color: "#87601C",
      background: "#E7C66B",
    };
  };

  const rarity = getRarity();

  const handleToggleFavorite = async () => {
    if (!user) return;

    try {
      await toggleFavorite(catId, user.id);
    } catch {
      Alert.alert(
          "Erreur",
          "Impossible de mettre à jour les favoris"
      );
    }
  };

  const handleShare = async () => {
    const location =
        lastSighting?.location_label || "quelque part";

    const message = [
      `Je viens de découvrir ${name || "un chat"} dans Chatlas !`,
      "",
      `${rarity.label}`,
      `${location}`,
    ].join("\n");

    try {
      await Share.share({
        message,
      });
    } catch {
      Alert.alert(
          "Erreur",
          "Impossible de partager cette fiche"
      );
    }
  };

  const handleResighting = async () => {
    if (!user) return;

    setResighting(true);

    try {
      const position = await getCurrentPosition();

      const locationLabel =
          await reverseGeocodeLocation(
              position.latitude,
              position.longitude
          );

      await addSighting({
        cat_id: catId,
        user_id: user.id,
        latitude: position.latitude,
        longitude: position.longitude,
        notes: "Revu !",
        location_label: locationLabel || undefined,
        sighted_at: new Date().toISOString(),
      });

      Alert.alert(
          "Chat revu !",
          "Cette nouvelle observation a été ajoutée à sa fiche."
      );
    } catch {
      Alert.alert(
          "Erreur",
          "Impossible d’enregistrer cette observation"
      );
    } finally {
      setResighting(false);
    }
  };

  const renderTimeline = () => {
    if (sortedSightings.length === 0) {
      return (
          <View style={styles.emptyTab}>
            <PawPrint
                size={42}
                color="#B98942"
                strokeWidth={1.5}
            />

            <Text style={styles.emptyTabTitle}>
              Aucune observation
            </Text>

            <Text style={styles.emptyTabText}>
              Ce chat n’a pas encore été observé.
            </Text>
          </View>
      );
    }

    return (
        <View style={styles.timeline}>
          {sortedSightings.map((sighting, index) => {
            const likes = getSightingLikes(sighting.id);
            const comments = getSightingComments(
                sighting.id
            );

            const likedByCurrentUser =
                Boolean(user) &&
                likes.some(
                    (like) => like.user_id === user?.id
                );

            const isFirst =
                index === sortedSightings.length - 1;

            return (
                <View
                    key={sighting.id}
                    style={styles.timelineItem}
                >
                  <View style={styles.timelineRail}>
                    <View
                        style={[
                          styles.timelineDot,
                          index === 0 &&
                          styles.timelineDotActive,
                        ]}
                    />

                    {index <
                        sortedSightings.length - 1 && (
                            <View style={styles.timelineLine} />
                        )}
                  </View>

                  <View style={styles.timelineCardShadow}>
                    <View style={styles.timelineCard}>
                      <Image
                          source={require("../../assets/onboarding/paper.png")}
                          style={styles.timelinePaper}
                          resizeMode="cover"
                      />

                      <View style={styles.timelineCardMain}>
                        <View style={styles.timelineText}>
                          <Text style={styles.timelineDate}>
                            {formatShortDate(
                                sighting.sighted_at
                            )}
                          </Text>

                          <Text style={styles.timelineTitle}>
                            {isFirst
                                ? "Première observation"
                                : "Observé à nouveau"}
                          </Text>

                          <View
                              style={styles.timelineLocationRow}
                          >
                            <MapPin
                                size={12}
                                color="#B57032"
                                strokeWidth={2}
                            />

                            <Text
                                style={
                                  styles.timelineLocation
                                }
                                numberOfLines={2}
                            >
                              {formatSightingLocation(
                                  sighting.notes,
                                  sighting.location_label
                              )}
                            </Text>
                          </View>
                        </View>

                        {sighting.photo_url && (
                            <Image
                                source={{
                                  uri: sighting.photo_url,
                                }}
                                style={styles.timelineThumbnail}
                                resizeMode="cover"
                            />
                        )}
                      </View>

                      <View style={styles.timelineActions}>
                        <TouchableOpacity
                            style={styles.timelineAction}
                            activeOpacity={0.75}
                            onPress={() => {
                              if (!user) return;

                              toggleSightingLike(
                                  sighting.id,
                                  user.id
                              );
                            }}
                        >
                          <Heart
                              size={15}
                              color={
                                likedByCurrentUser
                                    ? "#B95545"
                                    : "#746958"
                              }
                              fill={
                                likedByCurrentUser
                                    ? "#B95545"
                                    : "transparent"
                              }
                              strokeWidth={1.8}
                          />

                          <Text
                              style={
                                styles.timelineActionText
                              }
                          >
                            {likes.length}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.timelineAction}
                            activeOpacity={0.75}
                            onPress={() => {
                              setActiveCommentSightingId(
                                  activeCommentSightingId ===
                                  sighting.id
                                      ? null
                                      : sighting.id
                              );
                              setCommentText("");
                            }}
                        >
                          <MessageCircle
                              size={15}
                              color="#746958"
                              strokeWidth={1.8}
                          />

                          <Text
                              style={
                                styles.timelineActionText
                              }
                          >
                            {comments.length}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {comments.length > 0 && (
                          <View style={styles.comments}>
                            {comments.map((comment) => (
                                <View
                                    key={comment.id}
                                    style={styles.comment}
                                >
                                  <Text
                                      style={
                                        styles.commentUsername
                                      }
                                  >
                                    {comment.username}
                                  </Text>

                                  <Text
                                      style={styles.commentText}
                                  >
                                    {comment.text}
                                  </Text>
                                </View>
                            ))}
                          </View>
                      )}

                      {activeCommentSightingId ===
                          sighting.id && (
                              <View style={styles.commentInputRow}>
                                <TextInput
                                    style={styles.commentInput}
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    placeholder="Ajouter un commentaire…"
                                    placeholderTextColor="#94836D"
                                    multiline
                                    maxLength={140}
                                />

                                <TouchableOpacity
                                    style={styles.commentSend}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                      if (
                                          !user ||
                                          !commentText.trim()
                                      ) {
                                        return;
                                      }

                                      addSightingComment(
                                          sighting.id,
                                          user.id,
                                          user.username,
                                          commentText.trim()
                                      );

                                      setCommentText("");
                                      setActiveCommentSightingId(
                                          null
                                      );
                                    }}
                                >
                                  <Text
                                      style={
                                        styles.commentSendText
                                      }
                                  >
                                    Envoyer
                                  </Text>
                                </TouchableOpacity>
                              </View>
                          )}
                    </View>
                  </View>
                </View>
            );
          })}
        </View>
    );
  };

  const renderGallery = () => {
    if (uniquePhotos.length === 0) {
      return (
          <View style={styles.emptyTab}>
            <Camera
                size={42}
                color="#B98942"
                strokeWidth={1.5}
            />

            <Text style={styles.emptyTabTitle}>
              Galerie vide
            </Text>

            <Text style={styles.emptyTabText}>
              Les prochaines photos apparaîtront ici.
            </Text>
          </View>
      );
    }

    return (
        <View style={styles.gallery}>
          {uniquePhotos.map((photo, index) => (
              <TouchableOpacity
                  key={`${photo}-${index}`}
                  style={styles.galleryItemShadow}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedPhoto(index);
                  }}
              >
                <View style={styles.galleryItem}>
                  <Image
                      source={{
                        uri: photo,
                      }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                  />

                  <Text style={styles.galleryNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
              </TouchableOpacity>
          ))}
        </View>
    );
  };

  const renderInfos = () => {
    return (
        <View style={styles.infosTab}>
          {sex && (
              <InfoRow
                  icon={
                    <UserRound
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Sexe"
                  value={
                    sex === "male"
                        ? "Mâle"
                        : sex === "female"
                            ? "Femelle"
                            : "Inconnu"
                  }
              />
          )}

          {estimated_age && (
              <InfoRow
                  icon={
                    <Clock3
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Âge"
                  value={
                      AGE_LABEL[estimated_age] ||
                      estimated_age
                  }
              />
          )}

          {breed && (
              <InfoRow
                  icon={
                    <PawPrint
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Race"
                  value={breed}
              />
          )}

          {color && (
              <InfoRow
                  icon={
                    <Text style={styles.infoEmoji}>🎨</Text>
                  }
                  label="Couleur"
                  value={color}
              />
          )}

          {sociabilityInfo && (
              <InfoRow
                  icon={
                    <Text style={styles.infoEmoji}>
                      {sociabilityInfo.icon}
                    </Text>
                  }
                  label="Caractère"
                  value={sociabilityInfo.label}
              />
          )}

          {note && (
              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>
                  NOTES DU CARNET
                </Text>

                <Text style={styles.noteText}>{note}</Text>
              </View>
          )}
        </View>
    );
  };

  return (
      <View style={styles.screen}>
        <Image
            source={require("../../assets/onboarding/paper.png")}
            style={styles.paperBackground}
            resizeMode="cover"
        />

        <View style={styles.header}>
          <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
          >
            <ChevronLeft
                size={25}
                color="#3D3329"
                strokeWidth={1.8}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Fiche chat
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.7}
                onPress={handleShare}
            >
              <Share2
                  size={20}
                  color="#3D3329"
                  strokeWidth={1.8}
              />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.7}
            >
              <MoreVertical
                  size={21}
                  color="#3D3329"
                  strokeWidth={1.8}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          <View style={styles.photoCardShadow}>
            <View style={styles.photoCard}>
              <Image
                  source={require("../../assets/onboarding/paper.png")}
                  style={styles.photoCardPaper}
                  resizeMode="cover"
              />

              <View style={styles.photoLabel}>
                <Text style={styles.photoLabelText}>
                  {getCatNumber(catId)}
                </Text>
              </View>

              <View style={styles.paperClip}>
                <View style={styles.paperClipInner} />
              </View>

              <View style={styles.photoFrame}>
                {currentPhoto ? (
                    <Image
                        source={{
                          uri: currentPhoto,
                        }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.heroFallback}>
                      <PawPrint
                          size={58}
                          color="#8A775D"
                          strokeWidth={1.4}
                      />
                    </View>
                )}
              </View>

              <TouchableOpacity
                  style={styles.favoriteButton}
                  activeOpacity={0.8}
                  onPress={handleToggleFavorite}
                  hitSlop={{
                    top: 10,
                    left: 10,
                    right: 10,
                    bottom: 10,
                  }}
              >
                <Heart
                    pointerEvents="none"
                    size={26}
                    color="#B84F3D"
                    fill={
                      is_favorite
                          ? "#B84F3D"
                          : "#FFF8EA"
                    }
                    strokeWidth={1.8}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.identitySection}>
            <View style={styles.nameRow}>
              <Text
                  style={styles.name}
                  numberOfLines={2}
              >
                {name || color || "Chat inconnu"}
              </Text>

              <View
                  style={[
                    styles.rarityBadge,
                    {
                      backgroundColor:
                      rarity.background,
                    },
                  ]}
              >
                <Text
                    style={[
                      styles.rarityText,
                      {
                        color: rarity.color,
                      },
                    ]}
                >
                  {rarity.label}
                </Text>
              </View>
            </View>

            <View style={styles.rarityPaws}>
              {Array.from({
                length: 4,
              }).map((_, index) => (
                  <PawPrint
                      key={index}
                      size={15}
                      color={
                        index < rarity.paws
                            ? "#C5662C"
                            : "rgba(113, 91, 65, 0.22)"
                      }
                      fill={
                        index < rarity.paws
                            ? "#C5662C"
                            : "transparent"
                      }
                      strokeWidth={1.8}
                  />
              ))}
            </View>
          </View>

          <View style={styles.profileCardShadow}>
            <View style={styles.profileCard}>
              <Image
                  source={require("../../assets/onboarding/paper.png")}
                  style={styles.profileCardPaper}
                  resizeMode="cover"
              />

              <InfoRow
                  icon={
                    <MapPin
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Lieu"
                  value={
                      lastSighting?.location_label ||
                      "Lieu inconnu"
                  }
              />

              <InfoRow
                  icon={
                    <CalendarDays
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Première obs."
                  value={formatDate(
                      firstSighting?.sighted_at
                  )}
              />

              <InfoRow
                  icon={
                    <Clock3
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Dernière obs."
                  value={formatShortDate(
                      lastSighting?.sighted_at
                  )}
              />

              <InfoRow
                  icon={
                    <Camera
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Observations"
                  value={`${count} observation${
                      count > 1 ? "s" : ""
                  }`}
              />

              <InfoRow
                  icon={
                    <Heart
                        size={17}
                        color="#5F5548"
                        strokeWidth={1.8}
                    />
                  }
                  label="Favori"
                  value={
                    is_favorite
                        ? "Ajouté à vos favoris"
                        : "Pas encore ajouté"
                  }
              />
            </View>
          </View>

          <View style={styles.tags}>
            {color && (
                <Tag
                    emoji="🎨"
                    label={color}
                />
            )}

            {sociabilityInfo && (
                <Tag
                    emoji={sociabilityInfo.icon}
                    label={sociabilityInfo.label}
                />
            )}

            {activeBehaviors.map((key) => {
              const behavior =
                  BEHAVIOR_MAP[
                      key as keyof typeof BEHAVIOR_MAP
                      ];

              if (!behavior) return null;

              return (
                  <Tag
                      key={key}
                      emoji={behavior.icon}
                      label={behavior.label}
                  />
              );
            })}
          </View>

          <View style={styles.tabs}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;

              return (
                  <TouchableOpacity
                      key={tab.key}
                      style={styles.tabButton}
                      activeOpacity={0.75}
                      onPress={() => setActiveTab(tab.key)}
                  >
                    <Text
                        style={[
                          styles.tabText,
                          active && styles.tabTextActive,
                        ]}
                    >
                      {tab.label}
                    </Text>

                    {active && (
                        <View style={styles.tabIndicator} />
                    )}
                  </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "timeline" &&
                renderTimeline()}

            {activeTab === "gallery" &&
                renderGallery()}

            {activeTab === "infos" && renderInfos()}
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
              style={styles.resightButton}
              activeOpacity={0.86}
              disabled={resighting}
              onPress={handleResighting}
          >
            {resighting ? (
                <ActivityIndicator color="#FFF8E8" />
            ) : (
                <>
                  <Camera
                      size={20}
                      color="#FFF8E8"
                      strokeWidth={2}
                  />

                  <Text style={styles.resightText}>
                    Je l’ai revu !
                  </Text>
                </>
            )}
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4E7CB",
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
    backgroundColor: "#F4E7CB",
  },

  notFoundEmoji: {
    fontSize: 56,
  },

  notFound: {
    marginTop: 10,
    color: "#594B3A",
    fontSize: 20,
    fontFamily: "CormorantGaramond_700Bold",
  },

  loadingText: {
    marginTop: 12,
    color: "#594B3A",
    fontSize: 16,
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 8,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    position: "absolute",
    left: 70,
    right: 70,

    color: "#2D251E",
    fontSize: 25,
    textAlign: "center",
    fontFamily: "CormorantGaramond_700Bold",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 13,
    paddingBottom: 115,
  },

  photoCardShadow: {
    borderRadius: 10,

    backgroundColor: "#B38A51",

    shadowColor: "#3E2B1A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.24,
    shadowRadius: 12,

    elevation: 10,
  },

  photoCard: {
    position: "relative",

    padding: 8,
    paddingBottom: 28,

    borderRadius: 10,
    overflow: "hidden",

    backgroundColor: "#E2C38C",

    borderWidth: 1,
    borderColor: "#A77D45",
  },

  photoCardPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "130%",
    top: -18,
    left: -25,
    opacity: 0.74,
  },

  photoFrame: {
    height: SCREEN_WIDTH * 0.58,

    borderRadius: 5,
    overflow: "hidden",

    backgroundColor: "#A68D6C",

    borderWidth: 1.5,
    borderColor: "#7E5D35",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#C8B28D",
  },

  photoLabel: {
    position: "absolute",
    top: 4,
    left: 8,
    zIndex: 10,

    paddingHorizontal: 7,
    paddingVertical: 4,

    backgroundColor: "#EFE1BF",

    transform: [
      {
        rotate: "-2deg",
      },
    ],

    shadowColor: "#4A3520",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  photoLabelText: {
    color: "#3A2E22",
    fontSize: 10,
    fontFamily: "CormorantGaramond_700Bold",
  },

  paperClip: {
    position: "absolute",
    top: -8,
    right: 20,
    zIndex: 10,

    width: 16,
    height: 48,

    borderRadius: 8,

    borderWidth: 2,
    borderColor: "#6C6359",

    transform: [
      {
        rotate: "9deg",
      },
    ],
  },

  paperClipInner: {
    position: "absolute",
    top: 5,
    left: 3,

    width: 7,
    height: 35,

    borderRadius: 4,

    borderWidth: 1,
    borderColor: "#6C6359",
  },

  favoriteButton: {
    position: "absolute",
    right: 13,
    bottom: -2,

    width: 51,
    height: 51,

    borderRadius: 26,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF7E5",

    borderWidth: 1,
    borderColor: "#D9BE8B",

    shadowColor: "#48331F",
    shadowOpacity: 0.19,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 7,
  },

  identitySection: {
    paddingTop: 10,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  name: {
    flex: 1,
    paddingRight: 10,

    color: "#2D251E",
    fontSize: 29,
    lineHeight: 30,

    fontFamily: "CormorantGaramond_700Bold",
  },

  rarityBadge: {
    minHeight: 25,

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",
  },

  rarityText: {
    fontSize: 9,
    letterSpacing: 0.6,
    fontFamily: "CormorantGaramond_700Bold",
  },

  rarityPaws: {
    marginTop: 5,

    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  profileCardShadow: {
    marginTop: 3,

    borderRadius: 10,

    backgroundColor: "#CEB17D",

    shadowColor: "#4A3420",
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  profileCard: {
    position: "relative",

    paddingHorizontal: 13,
    paddingVertical: 8,

    borderRadius: 10,
    overflow: "hidden",

    backgroundColor: "#F1DFC0",

    borderWidth: 1,
    borderColor: "#CFB17D",
  },

  profileCardPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "130%",
    height: "140%",
    top: -20,
    left: -25,
    opacity: 0.55,
  },

  infoRow: {
    minHeight: 36,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: "rgba(153, 123, 81, 0.20)",
  },

  infoIcon: {
    width: 27,

    alignItems: "flex-start",
    justifyContent: "center",
  },

  infoEmoji: {
    fontSize: 15,
  },

  infoLabel: {
    width: 103,

    color: "#665A4C",
    fontSize: 12,

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  infoValue: {
    flex: 1,

    color: "#2F281F",
    fontSize: 13,
    textAlign: "right",

    fontFamily: "CormorantGaramond_700Bold",
  },

  tags: {
    marginTop: 10,
    marginBottom: 8,

    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  tag: {
    minHeight: 27,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",
    gap: 4,

    backgroundColor: "#E5D4AE",

    borderWidth: 1,
    borderColor: "#C9AD75",
  },

  tagEmoji: {
    fontSize: 12,
  },

  tagText: {
    color: "#52483A",
    fontSize: 11,

    fontFamily: "CormorantGaramond_700Bold",
  },

  tabs: {
    height: 42,

    marginTop: 2,

    flexDirection: "row",
    alignItems: "stretch",

    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(145, 113, 70, 0.24)",
  },

  tabButton: {
    flex: 1,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    color: "#746655",
    fontSize: 10,
    letterSpacing: 0.5,

    fontFamily: "CormorantGaramond_700Bold",
  },

  tabTextActive: {
    color: "#2F4D33",
  },

  tabIndicator: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -1,

    height: 2,

    borderRadius: 2,

    backgroundColor: "#355C3C",
  },

  tabContent: {
    paddingTop: 13,
  },

  timeline: {
    paddingLeft: 2,
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "stretch",

    marginBottom: 10,
  },

  timelineRail: {
    width: 25,

    alignItems: "center",
  },

  timelineDot: {
    width: 9,
    height: 9,

    marginTop: 14,

    borderRadius: 5,

    backgroundColor: "#B79861",
  },

  timelineDotActive: {
    backgroundColor: "#355C3C",
  },

  timelineLine: {
    width: 1.5,
    flex: 1,

    marginTop: 4,

    backgroundColor: "#A78C5F",

    borderStyle: "dotted",
  },

  timelineCardShadow: {
    flex: 1,

    borderRadius: 10,

    backgroundColor: "#C8A66F",

    shadowColor: "#49341F",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  timelineCard: {
    position: "relative",

    padding: 11,

    borderRadius: 10,
    overflow: "hidden",

    backgroundColor: "#F0DEBD",

    borderWidth: 1,
    borderColor: "#D1B37E",
  },

  timelinePaper: {
    ...StyleSheet.absoluteFillObject,
    width: "130%",
    height: "150%",
    top: -20,
    left: -20,
    opacity: 0.45,
  },

  timelineCardMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  timelineText: {
    flex: 1,
    paddingRight: 8,
  },

  timelineDate: {
    color: "#355C3C",
    fontSize: 10,

    fontFamily: "CormorantGaramond_700Bold",
  },

  timelineTitle: {
    marginTop: 2,

    color: "#2F271F",
    fontSize: 13,
    lineHeight: 15,

    fontFamily: "CormorantGaramond_700Bold",
  },

  timelineLocationRow: {
    marginTop: 3,

    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },

  timelineLocation: {
    flex: 1,

    color: "#695D4E",
    fontSize: 10,
    lineHeight: 12,

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  timelineThumbnail: {
    width: 73,
    height: 58,

    borderRadius: 7,

    borderWidth: 1,
    borderColor: "#C5A46F",
  },

  timelineActions: {
    marginTop: 8,

    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  timelineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  timelineActionText: {
    color: "#746958",
    fontSize: 10,

    fontFamily: "CormorantGaramond_700Bold",
  },

  comments: {
    marginTop: 8,
    gap: 5,
  },

  comment: {
    paddingHorizontal: 8,
    paddingVertical: 6,

    borderRadius: 7,

    backgroundColor: "rgba(255, 248, 232, 0.58)",

    borderWidth: 1,
    borderColor: "rgba(174, 141, 94, 0.22)",
  },

  commentUsername: {
    color: "#355C3C",
    fontSize: 10,

    fontFamily: "CormorantGaramond_700Bold",
  },

  commentText: {
    marginTop: 1,

    color: "#4F4437",
    fontSize: 11,
    lineHeight: 14,

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  commentInputRow: {
    marginTop: 8,

    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },

  commentInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 90,

    paddingHorizontal: 10,
    paddingVertical: 8,

    borderRadius: 8,

    color: "#392F26",
    fontSize: 12,

    backgroundColor: "rgba(255, 249, 236, 0.75)",

    borderWidth: 1,
    borderColor: "#CFB17D",

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  commentSend: {
    minHeight: 38,

    paddingHorizontal: 11,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#355C3C",
  },

  commentSendText: {
    color: "#FFF8E8",
    fontSize: 11,

    fontFamily: "CormorantGaramond_700Bold",
  },

  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  galleryItemShadow: {
    width:
        (SCREEN_WIDTH - 26 - 9) / 2,

    borderRadius: 8,

    backgroundColor: "#C6A36B",

    shadowColor: "#3D2C1C",
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  galleryItem: {
    position: "relative",

    padding: 5,

    borderRadius: 8,

    backgroundColor: "#E8CEA0",

    borderWidth: 1,
    borderColor: "#C7A16A",
  },

  galleryImage: {
    width: "100%",
    aspectRatio: 1,

    borderRadius: 5,
  },

  galleryNumber: {
    position: "absolute",
    right: 8,
    bottom: 7,

    paddingHorizontal: 5,
    paddingVertical: 2,

    borderRadius: 5,

    color: "#3D3227",
    fontSize: 9,

    backgroundColor: "rgba(255, 246, 225, 0.82)",

    fontFamily: "CormorantGaramond_700Bold",
  },

  infosTab: {
    paddingHorizontal: 5,
  },

  noteCard: {
    marginTop: 14,

    padding: 13,

    borderRadius: 9,

    backgroundColor: "rgba(239, 219, 180, 0.70)",

    borderWidth: 1,
    borderColor: "#CFAE75",
  },

  noteLabel: {
    color: "#8B6837",
    fontSize: 9,
    letterSpacing: 0.8,

    fontFamily: "CormorantGaramond_700Bold",
  },

  noteText: {
    marginTop: 5,

    color: "#4C4033",
    fontSize: 14,
    lineHeight: 19,

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  emptyTab: {
    minHeight: 190,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyTabTitle: {
    marginTop: 9,

    color: "#3A3027",
    fontSize: 19,

    fontFamily: "CormorantGaramond_700Bold",
  },

  emptyTabText: {
    marginTop: 4,

    color: "#756653",
    fontSize: 13,
    textAlign: "center",

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 15,
    paddingTop: 9,
    paddingBottom: 17,

    backgroundColor: "rgba(245, 232, 204, 0.96)",

    borderTopWidth: 1,
    borderTopColor: "rgba(160, 126, 79, 0.25)",
  },

  resightButton: {
    height: 52,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,

    backgroundColor: "#355C3C",

    borderWidth: 1,
    borderColor: "#24432A",

    shadowColor: "#243922",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 7,
  },

  resightText: {
    color: "#FFF8E8",
    fontSize: 18,

    fontFamily: "CormorantGaramond_700Bold",
  },
});
