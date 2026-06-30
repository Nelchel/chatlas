import { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, borderRadius } from "../constants/theme";
import { getNearbyCats } from "../services/nearby";
import { findMatches, MatchResult, getMatcherProviderName } from "../services/aiCatMatcherService";
import { formatDistance } from "../utils/distance";
import { reverseGeocodeLocation } from "../utils/location";

type CaptureRoute = RouteProp<RootStackParamList, "CaptureCat">;

const COLORS = [
  "Noir",
  "Blanc",
  "Roux",
  "Gris",
  "Tricolore",
  "Tigré",
  "Siamois",
  "Autre",
];

const SOCIABILITY = [
  { key: "timide", icon: "🫣", label: "Timide" },
  { key: "amical", icon: "🤗", label: "Amical" },
  { key: "calin", icon: "😼", label: "Câlin" },
  { key: "joueur", icon: "😈", label: "Joueur" },
  { key: "grognon", icon: "😤", label: "Grognon" },
  { key: "curieux", icon: "👀", label: "Curieux" },
];

function scoreLabel(score: number): { emoji: string; text: string; color: string } {
  if (score > 0.7) return { emoji: "🟢", text: "Très probable", color: colors.success };
  if (score > 0.4) return { emoji: "🟡", text: "Possible", color: "#E6A817" };
  return { emoji: "🔴", text: "Peu probable", color: colors.error };
}

async function generateCatName(color: string, lat: number, lng: number): Promise<string> {
  const place = await reverseGeocodeLocation(lat, lng);
  const prefix = color || "Chat inconnu";
  if (place) return `${prefix} ${place}`;
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "O";
  const latStr = `${Math.abs(lat).toFixed(2)}°${latDir}`;
  const lngStr = `${Math.abs(lng).toFixed(2)}°${lngDir}`;
  return `${prefix} • ${latStr} ${lngStr}`;
}

export function CaptureCatScreen() {
  const navigation = useNavigation();
  const route = useRoute<CaptureRoute>();
  const { cats, sightings, addCat, addSighting } = useCats();
  const { user, loading: authLoading } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<"camera" | "analyzing" | "nearby" | "form">("camera");
  const [photo, setPhoto] = useState<string | null>(null);
  const [nearbyCats, setNearbyCats] = useState<MatchResult[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [sociability, setSociability] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "unknown">("unknown");
  const [estimatedAge, setEstimatedAge] = useState<"chaton" | "adulte" | "senior" | "">("");
  const [behaviors, setBehaviors] = useState({
    sociable: false,
    aggressive: false,
    gourmand: false,
    sleepy: false,
  });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(
    route.params?.latitude ? { latitude: route.params.latitude, longitude: route.params.longitude } : null
  );
  const cameraRef = useRef<CameraView>(null);

  useFocusEffect(
    useCallback(() => {
      // Always reset to camera when screen becomes active
      setStep("camera");
      setPhoto(null);
      setNearbyCats([]);
      setName("");
      setColor("");
      setSociability("");
      setSex("unknown");
      setEstimatedAge("");
      setBehaviors({ sociable: false, aggressive: false, gourmand: false, sleepy: false });
      setNote("");
      setSubmitting(false);
    }, [])
  );

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (result?.uri) {
        setPhoto(result.uri);
        setStep("analyzing"); // 🔄 Feedback immédiat

        // Récupérer la position en parallèle (si pas déjà connue)
        let pos = position;
        if (!pos) {
          const { getCurrentPosition } = await import("../services/location");
          pos = await getCurrentPosition();
          setPosition(pos);
        }

        // Analyse proximité + AI
        try {
          const found = getNearbyCats(cats, sightings, pos.latitude, pos.longitude, 100);
          if (found.length > 0) {
            const matched = await findMatches(
              result.uri, cats, sightings, pos.latitude, pos.longitude, 100
            );
            if (matched.length > 0) {
              setNearbyCats(matched);
              setStep("nearby");
              return;
            }
          }
        } catch {
          // Nearby check failed — proceed to form
        }

        setStep("form");
      }
    } catch {
      setStep("camera");
      Alert.alert("Erreur", "Impossible de prendre la photo");
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setNearbyCats([]);
    setName("");
    setColor("");
    setSociability("");
    setNote("");
    setStep("camera");
  };

  const handleAddSightingToExisting = async (nearby: MatchResult) => {
    if (!user || !photo || !position) return;

    setSubmitting(true);
    try {
      await addSighting({
        cat_id: nearby.cat.id,
        user_id: user.id,
        latitude: position.latitude,
        longitude: position.longitude,
        photo_url: photo,
        notes: note.trim() || undefined,
        sighted_at: new Date().toISOString(),
      });

      Alert.alert(
        "✅ Observation ajoutée !",
        `${nearby.cat.name || "Ce chat"} a été revu près d'ici.`,
        [{ text: "Super !", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.error("handleAddSighting error:", e);
      Alert.alert("Erreur", "Impossible d'ajouter l'observation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToNew = () => {
    setName("");
    setColor("");
    setSociability("");
    setNote("");
    setStep("form");
  };

  const handleSubmit = async () => {
    if (authLoading) {
      Alert.alert("Patientez", "Connexion en cours...");
      return;
    }
    if (!user) {
      Alert.alert("Erreur", "Authentification nécessaire. Vérifie que l'authentification anonyme est activée dans Firebase Console.");
      return;
    }
    if (!photo) {
      Alert.alert("Oups", "Prends d'abord une photo du chat !");
      return;
    }

    setSubmitting(true);
    try {
      let pos = position;
      if (!pos) {
        const { getCurrentPosition } = await import("../services/location");
        pos = await getCurrentPosition();
      }

      const catName = name.trim() || await generateCatName(color, pos.latitude, pos.longitude);
      const cat = await addCat({
        user_id: user.id,
        name: catName,
        photo_url: photo,
        photos: [photo],
        color: color || undefined,
        breed: undefined,
        sex: sex !== "unknown" ? sex : undefined,
        estimated_age: estimatedAge || undefined,
        sociability: sociability || undefined,
        behaviors: Object.values(behaviors).some(Boolean) ? behaviors : undefined,
        note: note.trim() || undefined,
      });

      await addSighting({
        cat_id: cat.id,
        user_id: user.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        photo_url: photo,
        notes: note.trim() || undefined,
        sighted_at: new Date().toISOString(),
      });

      Alert.alert("✅ Capturé !", `${catName} a rejoint ta collection.`, [
        { text: "Super !", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error("CaptureCatScreen.handleSubmit error:", e);
      Alert.alert("Erreur", "Impossible de sauvegarder le chat");
    } finally {
      setSubmitting(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.permissionText}>
          Chatlas a besoin d&apos;accéder à ta caméra pour capturer les chats !
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "camera") {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>📸 Capture un chat</Text>
              <Text style={styles.cameraHint}>
                Cadre le chat et prends la photo
              </Text>
            </View>
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={takePicture}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === "analyzing") {
    return (
      <View style={styles.container}>
        <View style={styles.analyzingContainer}>
          <Image source={{ uri: photo! }} style={styles.analyzingPhoto} />
          <ActivityIndicator size="large" color={colors.primary} style={styles.analyzingSpinner} />
          <Text style={styles.analyzingTitle}>🐱 Analyse en cours...</Text>
          <Text style={styles.analyzingSub}>On cherche si on connaît déjà ce chat dans le coin</Text>
          <TouchableOpacity style={styles.analyzingSkip} onPress={() => setStep("form")}>
            <Text style={styles.analyzingSkipText}>Passer directement au formulaire →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === "nearby") {
    const hasAi = getMatcherProviderName() !== "Mock (couleur + distance)";
    const [top, ...rest] = nearbyCats;
    return (
      <View style={styles.container}>
        <ScrollView style={styles.nearbyScroll}>
          <View style={styles.nearbyHeader}>
            <Text style={styles.nearbyEmoji}>🐱</Text>
            <Text style={styles.nearbyTitle}>Correspondance proximité</Text>
            <Text style={styles.nearbySubtitle}>
              {nearbyCats.length === 1
                ? "1 chat trouvé à proximité"
                : `${nearbyCats.length} chats trouvés à proximité`}
            </Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>
                {hasAi ? `✨ IA : ${getMatcherProviderName()}` : "📐 Suggestion (couleur + distance)"}
              </Text>
            </View>
          </View>

          {top && (
            <>
              <Text style={styles.topLabel}>Meilleure correspondance</Text>
              {(() => {
                const sl = scoreLabel(top.similarityScore);
                return (
                  <View style={styles.topCard}>
                    {top.cat.photo_url ? (
                      <Image
                        source={{ uri: top.cat.photo_url }}
                        style={styles.topPhoto}
                      />
                    ) : (
                      <View style={[styles.topPhoto, styles.topPhotoFallback]}>
                        <Text style={styles.topPhotoEmoji}>🐱</Text>
                      </View>
                    )}
                    <View style={styles.topInfo}>
                      <Text style={styles.topName}>
                        {top.cat.name || top.cat.color || "Chat inconnu"}
                      </Text>
                      {top.cat.color && (
                        <Text style={styles.topDetail}>{top.cat.color}</Text>
                      )}
                      <Text style={styles.topDetail}>
                        {formatDistance(top.distance)}
                      </Text>
                      <Text style={styles.topDetail}>
                        👀 {top.sightingCount === 1 ? "Vu 1 fois" : `Vu ${top.sightingCount} fois`}
                      </Text>
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreEmoji}>{sl.emoji}</Text>
                        <Text style={[styles.scoreLabel, { color: sl.color }]}>
                          {sl.text}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.nearbyButton, top.similarityScore > 0.7 && styles.nearbyButtonHigh]}
                      onPress={() => handleAddSightingToExisting(top)}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.nearbyButtonText}>C&apos;est lui</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </>
          )}

          {rest.length > 0 && (
            <>
              <Text style={styles.otherLabel}>Autres suggestions</Text>
              {rest.map((item) => {
                const sl = scoreLabel(item.similarityScore);
                return (
                  <View key={item.cat.id} style={styles.nearbyCard}>
                    {item.cat.photo_url ? (
                      <Image
                        source={{ uri: item.cat.photo_url }}
                        style={styles.nearbyPhoto}
                      />
                    ) : (
                      <View style={[styles.nearbyPhoto, styles.nearbyPhotoFallback]}>
                        <Text style={styles.nearbyPhotoEmoji}>🐱</Text>
                      </View>
                    )}
                    <View style={styles.nearbyInfo}>
                      <Text style={styles.nearbyName}>
                        {item.cat.name || item.cat.color || "Chat inconnu"}
                      </Text>
                      {item.cat.color && (
                        <Text style={styles.nearbyDetail}>{item.cat.color}</Text>
                      )}
                      <Text style={styles.nearbyDetail}>
                        {formatDistance(item.distance)}
                      </Text>
                      <Text style={styles.nearbyDetail}>
                        👀 {item.sightingCount === 1 ? "Vu 1 fois" : `Vu ${item.sightingCount} fois`}
                      </Text>
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreEmoji}>{sl.emoji}</Text>
                        <Text style={[styles.scoreLabel, { color: sl.color }]}>
                          {sl.text}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.nearbyButton, item.similarityScore > 0.7 && styles.nearbyButtonHigh]}
                      onPress={() => handleAddSightingToExisting(item)}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.nearbyButtonText}>C&apos;est lui</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}

          <TouchableOpacity
            style={styles.newCatButton}
            onPress={handleContinueToNew}
          >
            <Text style={styles.newCatButtonText}>
              ✨ Nouveau chat (pas dans la liste)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <TouchableOpacity onPress={handleRetake} activeOpacity={0.8}>
            <Image source={{ uri: photo! }} style={styles.preview} />
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>Photo ✓</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.label}>Nom (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Minou"
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Couleur</Text>
            <View style={styles.chips}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, color === c && styles.chipActive]}
                  onPress={() => setColor(c === color ? "" : c)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      color === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Sociabilité</Text>
            <View style={styles.sociabilityRow}>
              {SOCIABILITY.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.socChip,
                    sociability === s.key && styles.socChipActive,
                  ]}
                  onPress={() =>
                    setSociability(sociability === s.key ? "" : s.key)
                  }
                >
                  <Text style={styles.socIcon}>{s.icon}</Text>
                  <Text
                    style={[
                      styles.socLabel,
                      sociability === s.key && styles.socLabelActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Sexe (optionnel)</Text>
            <View style={styles.sociabilityRow}>
              <TouchableOpacity
                style={[styles.socChip, sex === "male" && styles.socChipActive]}
                onPress={() => setSex(sex === "male" ? "unknown" : "male")}
              >
                <Text style={styles.socIcon}>♂️</Text>
                <Text style={[styles.socLabel, sex === "male" && styles.socLabelActive]}>Mâle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socChip, sex === "female" && styles.socChipActive]}
                onPress={() => setSex(sex === "female" ? "unknown" : "female")}
              >
                <Text style={styles.socIcon}>♀️</Text>
                <Text style={[styles.socLabel, sex === "female" && styles.socLabelActive]}>Femelle</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Âge estimé (optionnel)</Text>
            <View style={styles.sociabilityRow}>
              {[{ key: "chaton", icon: "😺", label: "Chaton" }, { key: "adulte", icon: "🐱", label: "Adulte" }, { key: "senior", icon: "🐈", label: "Senior" }].map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.socChip, estimatedAge === a.key && styles.socChipActive]}
                  onPress={() => setEstimatedAge(estimatedAge === a.key ? "" : a.key as any)}
                >
                  <Text style={styles.socIcon}>{a.icon}</Text>
                  <Text style={[styles.socLabel, estimatedAge === a.key && styles.socLabelActive]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Comportements (optionnel)</Text>
            <View style={styles.sociabilityRow}>
              {[
                { key: "sociable", icon: "😺", label: "Sociable" },
                { key: "aggressive", icon: "😾", label: "Agressif" },
                { key: "gourmand", icon: "😋", label: "Gourmand" },
                { key: "sleepy", icon: "😴", label: "Dormeur" },
              ].map((b) => (
                <TouchableOpacity
                  key={b.key}
                  style={[styles.socChip, behaviors[b.key as keyof typeof behaviors] && styles.socChipActive]}
                  onPress={() =>
                    setBehaviors((prev) => ({ ...prev, [b.key]: !prev[b.key as keyof typeof behaviors] }))
                  }
                >
                  <Text style={styles.socIcon}>{b.icon}</Text>
                  <Text style={[styles.socLabel, behaviors[b.key as keyof typeof behaviors] && styles.socLabelActive]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Note (optionnelle)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Où l'as-tu vu ? Son attitude ?"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
              maxLength={200}
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitIcon}>🐾</Text>
                <Text style={styles.submitText}>Ajouter à ma collection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 60,
  },
  cameraHeader: {
    paddingTop: 60,
    alignItems: "center",
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cameraHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF",
  },
  formScroll: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  photoBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  sociabilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  socChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  socIcon: {
    fontSize: 18,
  },
  socLabel: {
    fontSize: 14,
    color: colors.text,
  },
  socLabelActive: {
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  submitIcon: {
    fontSize: 20,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  nearbyScroll: {
    flex: 1,
  },
  nearbyHeader: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  nearbyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  nearbyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  nearbySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  nearbyPhoto: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  otherLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  topCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  topPhoto: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  topPhotoFallback: {
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  topPhotoEmoji: {
    fontSize: 36,
  },
  topInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  topDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 1,
  },
  nearbyPhotoFallback: {
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  nearbyPhotoEmoji: {
    fontSize: 28,
  },
  nearbyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nearbyName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  nearbyDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  scoreEmoji: {
    fontSize: 12,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  aiBadge: {
    marginTop: spacing.sm,
    backgroundColor: "#F0F0FF",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  aiBadgeText: {
    fontSize: 12,
    color: "#6666AA",
    fontWeight: "500",
  },
  nearbyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
    minWidth: 80,
    alignItems: "center",
  },
  nearbyButtonHigh: {
    backgroundColor: colors.success,
  },
  nearbyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
  newCatButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: 60,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
  },
  newCatButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  analyzingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  analyzingPhoto: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  analyzingSpinner: {
    marginBottom: spacing.md,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  analyzingSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  analyzingSkip: {
    marginTop: spacing.md,
  },
  analyzingSkipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
});
