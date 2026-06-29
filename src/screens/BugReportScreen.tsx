import { useState, useCallback } from "react";
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
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Application from "expo-application";
import { useAuth } from "../hooks/useAuth";
import { BugReportService } from "../services/bugReportService";
import { colors, spacing, borderRadius } from "../constants/theme";

export function BugReportScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const appVersion = Application.nativeApplicationVersion || "1.0.0";

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour joindre un screenshot.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setScreenshotUri(result.assets[0].uri);
    }
  }, []);

  const removeImage = useCallback(() => {
    setScreenshotUri(null);
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Erreur", "Tu dois être connecté pour signaler un bug.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Description requise", "Explique-nous le problème rencontré.");
      return;
    }

    setSubmitting(true);
    try {
      await BugReportService.create(user.id, description.trim(), appVersion, screenshotUri || undefined);
      Alert.alert("✅ Bug signalé", "Merci pour ton retour ! On va investiguer ça.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error("BugReportScreen.handleSubmit error:", e);
      Alert.alert("Erreur", "Impossible d\u0027envoyer le rapport de bug. Réessaie plus tard.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>🐛 Signaler un bug</Text>
          <Text style={styles.subtitle}>
            Décris le problème que tu as rencontré. Un screenshot aide beaucoup à comprendre !
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décris le bug en détail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Screenshot (optionnel)</Text>
            {screenshotUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: screenshotUri }} style={styles.image} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Text style={styles.removeImageText}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerText}>Choisir un screenshot</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Version de l&apos;app :</Text>
            <Text style={styles.versionValue}>{appVersion}</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>📤 Envoyer le rapport</Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
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
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  imageContainer: {
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  removeImageButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFF0F0",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  removeImageText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  imagePickerIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  versionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  versionValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
