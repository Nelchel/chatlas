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
  Image,
} from "react-native";
import { PawPrint, Mail, Lock, User } from "lucide-react-native";
import { useAuth, AppUser } from "../hooks/useAuth";
import { useGoogleAuth, signInWithAppleNative } from "../hooks/useOAuth";
import { colors, spacing } from "../constants/theme";
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

  useEffect(() => {
    if (googleError) Alert.alert("Erreur Google", googleError);
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
        const result = await authService.signUpWithEmail(
            email.trim(),
            password,
            username.trim() || undefined
        );
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

  if (mode === "local") return null;

  const isRegister = tab === "register";
  const isReset = tab === "reset";

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Image
            source={require("../../assets/onboarding/paper.png")}
            style={styles.paper}
            resizeMode="cover"
        />

        <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Chatlas</Text>
            <Text style={styles.subtitle}>
              L'encyclopédie vivante{"\n"}des chats du monde.
            </Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>
              {isReset
                  ? "Retrouver mon carnet"
                  : isRegister
                      ? "Commencer mon aventure"
                      : "Reprendre mon aventure"}
            </Text>

            <View style={styles.panelDivider}>
              <View style={styles.line} />
              <PawPrint size={20} color="#4F6244" />
              <View style={styles.line} />
            </View>

            {!isReset && (
                <>
                  <TouchableOpacity
                      style={[styles.greenButton, googleBusy && styles.buttonDisabled]}
                      onPress={handleGooglePress}
                      disabled={googleBusy}
                  >
                    {googleBusy ? (
                        <ActivityIndicator color="#F8F0DC" />
                    ) : (
                        <>
                          <Image source={require("../../assets/google.png")} style={styles.googleIcon} />
                          <Text style={styles.greenButtonText}>Continuer avec Google</Text>
                          <PawPrint size={22} color="#F8F0DC" style={styles.buttonPaw} />
                        </>
                    )}
                  </TouchableOpacity>

                  {Platform.OS === "ios" && (
                      <TouchableOpacity
                          style={[styles.secondaryButton, appleBusy && styles.buttonDisabled]}
                          onPress={handleApplePress}
                          disabled={appleBusy}
                      >
                        {appleBusy ? (
                            <ActivityIndicator color="#2D241D" />
                        ) : (
                            <Text style={styles.secondaryButtonText}> Continuer avec Apple</Text>
                        )}
                      </TouchableOpacity>
                  )}

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou par email</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </>
            )}

            {emailSent ? (
                <View style={styles.form}>
                  <View style={styles.successBanner}>
                    <Text style={styles.successBannerEmoji}>✉️</Text>
                    <Text style={styles.successBannerText}>Validation envoyée !</Text>
                    <Text style={styles.successBannerSubtext}>
                      Un lien de confirmation a été envoyé à ton adresse email.
                    </Text>
                  </View>

                  <TouchableOpacity
                      style={styles.greenButton}
                      onPress={() => {
                        setEmailSent(false);
                        setTab("login");
                      }}
                  >
                    <Text style={styles.greenButtonText}>Aller à la connexion</Text>
                  </TouchableOpacity>
                </View>
            ) : isReset ? (
                <View style={styles.form}>
                  <Text style={styles.resetInfo}>
                    Saisis ton email pour recevoir un lien de réinitialisation.
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#7C6E5B" />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#7C6E5B"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                      style={[styles.greenButton, busy && styles.buttonDisabled]}
                      onPress={handlePasswordReset}
                      disabled={busy}
                  >
                    {busy ? (
                        <ActivityIndicator color="#F8F0DC" />
                    ) : (
                        <Text style={styles.greenButtonText}>Envoyer le lien</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setTab("login")}>
                    <Text style={styles.link}>Retour à la connexion</Text>
                  </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.form}>
                  {isRegister && (
                      <View style={styles.inputWrapper}>
                        <User size={20} color="#7C6E5B" />
                        <TextInput
                            style={styles.input}
                            placeholder="Pseudo"
                            placeholderTextColor="#7C6E5B"
                            value={username}
                            onChangeText={setUsername}
                            maxLength={30}
                            autoCapitalize="none"
                        />
                      </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#7C6E5B" />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#7C6E5B"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#7C6E5B" />
                    <TextInput
                        style={styles.input}
                        placeholder="Mot de passe"
                        placeholderTextColor="#7C6E5B"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete={isRegister ? "new-password" : "password"}
                    />
                  </View>

                  <TouchableOpacity
                      style={[styles.greenButton, busy && styles.buttonDisabled]}
                      onPress={handleEmailAuth}
                      disabled={busy}
                  >
                    {busy ? (
                        <ActivityIndicator color="#F8F0DC" />
                    ) : (
                        <>
                          <Text style={styles.greenButtonText}>
                            {isRegister ? "Créer mon carnet" : "Se connecter"}
                          </Text>
                          <PawPrint size={22} color="#F8F0DC" style={styles.buttonPaw} />
                        </>
                    )}
                  </TouchableOpacity>

                  {!isRegister && (
                      <TouchableOpacity onPress={() => setTab("reset")}>
                        <Text style={styles.link}>Mot de passe oublié ?</Text>
                      </TouchableOpacity>
                  )}
                </View>
            )}

            {!emailSent && !isReset && (
                <View style={styles.switchBox}>
                  <Text style={styles.switchLabel}>
                    {isRegister ? "Déjà explorateur ?" : "Nouvel explorateur ?"}
                  </Text>

                  <TouchableOpacity
                      style={styles.switchButton}
                      onPress={() => setTab(isRegister ? "login" : "register")}
                  >
                    <Text style={styles.switchButtonText}>
                      {isRegister ? "Reprendre mon aventure" : "Commencer mon aventure"}
                    </Text>
                  </TouchableOpacity>
                </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EBD7",
  },

  paper: {
    ...StyleSheet.absoluteFillObject,
    left: -50,
    top: -20,
    opacity: 0.9,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 48,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 8,
  },

  title: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 54,
    lineHeight: 58,
    color: "#2D241D",
  },

  subtitle: {
    marginTop: 4,
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 20,
    lineHeight: 24,
    color: "#5D5144",
    textAlign: "center",
  },

  grasminou: {
    width: 210,
    height: 190,
    marginTop: -4,
    marginBottom: -20,
  },

  panel: {
    backgroundColor: "rgba(248, 241, 223, 0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D8C6A3",
    padding: 20,
    shadowColor: "#2A2521",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginTop: 10,
  },

  panelTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 34,
    lineHeight: 38,
    color: "#3E5E41",
    textAlign: "center",
  },

  panelDivider: {
    marginTop: 8,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#D8C6A3",
  },

  greenButton: {
    minHeight: 58,
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: "#3E5E41",
    borderWidth: 1.5,
    borderColor: "#5F7B59",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",

    shadowColor: "#1B2218",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10,
  },

  greenButtonText: {
    color: "#F8F0DC",
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 23,
  },

  googleIcon: {
    position: "absolute",
    left: 26,
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  buttonPaw: {
    position: "absolute",
    right: 22,
    opacity: 0.75,
  },

  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#EFE4C8",
    borderWidth: 1,
    borderColor: "#D8C6A3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryButtonText: {
    fontFamily: "CormorantGaramond_700Bold",
    color: "#2D241D",
    fontSize: 21,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D8C6A3",
  },

  dividerText: {
    marginHorizontal: 14,
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 18,
    color: "#7C6E5B",
  },

  form: {
    gap: 12,
  },

  inputWrapper: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255, 248, 232, 0.78)",
    borderWidth: 1,
    borderColor: "#D8C6A3",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  input: {
    flex: 1,
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 20,
    color: "#2D241D",
    paddingVertical: 0,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  link: {
    textAlign: "center",
    color: "#3E5E41",
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 19,
    marginTop: 4,
  },

  resetInfo: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 18,
    color: "#5D5144",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 4,
  },

  successBanner: {
    backgroundColor: "rgba(232, 245, 233, 0.75)",
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A9C393",
  },

  successBannerEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  successBannerText: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 24,
    color: "#3E5E41",
    marginBottom: 4,
    textAlign: "center",
  },

  successBannerSubtext: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 17,
    color: "#4F6244",
    textAlign: "center",
    lineHeight: 22,
  },

  switchBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#D8C6A3",
    alignItems: "center",
  },

  switchLabel: {
    fontFamily: "CormorantGaramond_600SemiBold",
    color: "#5D5144",
    fontSize: 19,
    marginBottom: 10,
  },

  switchButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255, 248, 232, 0.75)",
    borderWidth: 1,
    borderColor: "#D8C6A3",
    justifyContent: "center",
    alignItems: "center",
  },

  switchButtonText: {
    fontFamily: "CormorantGaramond_700Bold",
    color: "#3E5E41",
    fontSize: 22,
  },
});
