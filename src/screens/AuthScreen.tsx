import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth, AppUser } from "../hooks/useAuth";
import { useGoogleAuth, signInWithAppleNative } from "../hooks/useOAuth";
import { colors, spacing, borderRadius } from "../constants/theme";
import { getMode } from "../services/mode";

interface AuthScreenProps {
  onAuthComplete: (user: AppUser) => void;
}

export function AuthScreen({ onAuthComplete }: AuthScreenProps) {
  const { authService, handleSignInResult } = useAuth();
  const { signIn: signInGoogle, busy: googleBusy, error: googleError } = useGoogleAuth();
  const mode = getMode();

  const [tab, setTab] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  // Affiche les erreurs Google
  useEffect(() => {
    if (googleError) {
      Alert.alert("Erreur Google", googleError);
    }
  }, [googleError]);

  const handleGooglePress = async () => {
    await signInGoogle();
  };

  const handleApplePress = async () => {
    setAppleBusy(true);
    try {
      const firebaseUser = await signInWithAppleNative();
      if (firebaseUser) {
        const appUser = await handleSignInResult({ user: firebaseUser as any, isNew: false });
        onAuthComplete(appUser);
      }
    } catch (e: any) {
      if (e.code !== "ERR_CANCELED") {
        Alert.alert("Erreur", e.message || "Connexion Apple échouée");
      }
    } finally {
      setAppleBusy(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Email et mot de passe requis");
      return;
    }
    setBusy(true);
    try {
      if (tab === "register") {
        const result = await authService.signUpWithEmail(email.trim(), password, username.trim() || undefined);
        await handleSignInResult(result);
        setEmailSent(true);
        setEmail("");
        setPassword("");
        setUsername("");
      } else {
        const result = await authService.signInWithEmail(email.trim(), password);
        const appUser = await handleSignInResult(result);
        onAuthComplete(appUser);
      }
    } catch (e: any) {
      const msg =
        e.code === "auth/invalid-credential"
          ? "Email ou mot de passe incorrect"
          : e.code === "auth/email-already-in-use"
            ? "Cet email est déjà utilisé"
            : e.code === "auth/user-not-found"
              ? "Aucun compte avec cet email"
              : e.code === "auth/weak-password"
                ? "Mot de passe trop court (6+ caractères)"
                : e.code === "auth/invalid-email"
                  ? "Email invalide"
                  : e.message || "Erreur de connexion";
      Alert.alert("Erreur", msg);
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert("Champs requis", "Email requis");
      return;
    }
    setBusy(true);
    try {
      await authService.sendPasswordReset(email.trim());
      Alert.alert("✅ Email envoyé", "Vérifie ta boîte de réception");
      setTab("login");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible d'envoyer l'email");
    } finally {
      setBusy(false);
    }
  };

  const handleAnonymous = async () => {
    setBusy(true);
    try {
      const result = await authService.signInAnonymously();
      const appUser = await handleSignInResult(result);
      onAuthComplete(appUser);
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Connexion anonyme échouée");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "local") return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🐱</Text>
          <Text style={styles.title}>Chatlas</Text>
          <Text style={styles.subtitle}>Découvre, identifie et collectionne les chats autour de toi.</Text>
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, googleBusy && styles.buttonDisabled]}
            onPress={handleGooglePress}
            disabled={googleBusy}
          >
            {googleBusy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.socialButtonText}>G  Continuer avec Google</Text>
            )}
          </TouchableOpacity>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleApplePress}
              disabled={appleBusy}
            >
              {appleBusy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                    Continuer avec Apple
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou par email</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === "login" && styles.tabActive]}
            onPress={() => setTab("login")}
          >
            <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>
              Connexion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "register" && styles.tabActive]}
            onPress={() => setTab("register")}
          >
            <Text style={[styles.tabText, tab === "register" && styles.tabTextActive]}>
              Inscription
            </Text>
          </TouchableOpacity>
        </View>

        {emailSent ? (
          <View style={styles.form}>
            <View style={styles.successBanner}>
              <Text style={styles.successBannerEmoji}>✉️</Text>
              <Text style={styles.successBannerText}>
                Validation envoyée !
              </Text>
              <Text style={styles.successBannerSubtext}>
                Un lien de confirmation a été envoyé à ton adresse email.
                Vérifie ta boîte de réception et clique sur le lien pour activer ton compte.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setEmailSent(false);
                setTab("login");
              }}
            >
              <Text style={styles.primaryButtonText}>Aller à la connexion</Text>
            </TouchableOpacity>
          </View>
        ) : tab !== "reset" ? (
          <View style={styles.form}>
            {tab === "register" && (
              <TextInput
                style={styles.input}
                placeholder="Pseudo"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                maxLength={30}
                autoCapitalize="none"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={tab === "register" ? "new-password" : "password"}
            />
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {tab === "register" ? "Créer mon compte" : "Se connecter"}
                </Text>
              )}
            </TouchableOpacity>
            {tab === "login" && (
              <TouchableOpacity onPress={() => setTab("reset")}>
                <Text style={styles.link}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.resetInfo}>
              Saisis ton email pour recevoir un lien de réinitialisation.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={handlePasswordReset}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Envoyer le lien</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab("login")}>
              <Text style={styles.link}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}

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
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  socialRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  appleButton: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  appleButtonText: {
    color: "#FFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFF",
  },
  form: {
    gap: spacing.md,
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  link: {
    textAlign: "center",
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  resetInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  successBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  successBannerEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  successBannerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  successBannerSubtext: {
    fontSize: 14,
    color: "#388E3C",
    textAlign: "center",
    lineHeight: 20,
  },
  skipButton: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
