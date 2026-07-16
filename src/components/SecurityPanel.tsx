import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors, spacing, borderRadius } from "../constants/theme";
import { auth } from "../services/firebase";
import { authService } from "../services/authService";

interface UserProfile {
  id: string;
  username: string;
  email?: string | null;
  auth_provider?: string;
  is_admin?: boolean;
  emailVerified?: boolean;
}

interface SecurityPanelProps {
  user: UserProfile;
  signOut: () => void;
}

export function SecurityPanel({ user, signOut }: SecurityPanelProps) {
  const [showSecurity, setShowSecurity] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);

  const handleSendVerification = async () => {
    if (!auth?.currentUser) return;
    setSecurityBusy(true);
    try {
      await authService.sendEmailVerification(auth.currentUser);
      Alert.alert("✅ Email envoyé", "Vérifie ta boîte de réception.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible d'envoyer l'email");
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      Alert.alert("Champs requis", "Tous les champs sont obligatoires");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    if (!auth?.currentUser || auth.currentUser.isAnonymous) {
      Alert.alert("Erreur", "Impossible de changer le mot de passe pour ce compte");
      return;
    }
    setSecurityBusy(true);
    try {
      await authService.changePassword(auth.currentUser, currentPassword, newPassword);
      Alert.alert("✅ Succès", "Mot de passe modifié !");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      let msg = e.message || "Erreur";
      if (e.code === "auth/wrong-password") msg = "Mot de passe actuel incorrect";
      if (e.code === "auth/weak-password") msg = "Nouveau mot de passe trop faible (6+ caractères)";
      Alert.alert("Erreur", msg);
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser) {
      Alert.alert("Erreur", "Aucun utilisateur connecté");
      return;
    }
    setSecurityBusy(true);
    try {
      const providers = auth.currentUser.providerData.map((p) => p.providerId);
      const hasPassword = providers.includes("password");
      if (hasPassword && !deletePassword) {
        Alert.alert("Erreur", "Mot de passe requis pour supprimer le compte");
        setSecurityBusy(false);
        return;
      }
      if (hasPassword) {
        await authService.reauthenticateWithPassword(auth.currentUser, deletePassword);
      }
      await authService.deleteAccount(auth.currentUser);
      Alert.alert("✅ Compte supprimé", "Tes données ont été supprimées.");
      setShowDeleteConfirm(false);
      setDeletePassword("");
      signOut();
    } catch (e: any) {
      let msg = e.message || "Erreur";
      if (e.code === "auth/wrong-password") msg = "Mot de passe incorrect";
      if (e.code === "auth/requires-recent-login") msg = "Reconnecte-toi puis réessaie";
      Alert.alert("❌ Erreur", msg);
    } finally {
      setSecurityBusy(false);
    }
  };

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.securityToggle}
        onPress={() => setShowSecurity((p) => !p)}
      >
        <Text style={styles.securityToggleText}>
          🔐 Sécurité & Compte {showSecurity ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {showSecurity && (
        <View style={styles.securityPanel}>
          {user.auth_provider === "email" && (
            <View style={styles.securityRow}>
              <Text style={styles.securityLabel}>Email</Text>
              <View style={styles.securityStatusRow}>
                <Text
                  style={[
                    styles.securityStatusText,
                    user.emailVerified ? styles.statusVerified : styles.statusUnverified,
                  ]}
                >
                  {user.emailVerified ? "✅ Vérifié" : "⏳ Non vérifié"}
                </Text>
                {!user.emailVerified && auth?.currentUser && (
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={handleSendVerification}
                    disabled={securityBusy}
                  >
                    {securityBusy ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text style={styles.smallButtonText}>Renvoyer</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {user.auth_provider === "email" && (
            <View style={styles.securityBlock}>
              {!showChangePassword ? (
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={() => setShowChangePassword(true)}
                >
                  <Text style={styles.inlineButtonText}>🔑 Changer le mot de passe</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.securityForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe actuel"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nouveau mot de passe"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le nouveau mot de passe"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, securityBusy && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={securityBusy}
                  >
                    {securityBusy ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.actionButtonText}>Modifier</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                    <Text style={styles.link}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.securityBlock}>
            {!showDeleteConfirm ? (
              <TouchableOpacity
                style={[styles.inlineButton, styles.dangerButton]}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Text style={styles.dangerButtonText}>🗑️ Supprimer mon compte</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.securityForm}>
                <Text style={styles.warningText}>
                  ⚠️ Cette action est irréversible. Tes données seront supprimées.
                </Text>
                {user.auth_provider === "email" && (
                  <TextInput
                    style={[styles.input, styles.dangerInput]}
                    placeholder="Mot de passe actuel pour confirmer"
                    secureTextEntry
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    autoCapitalize="none"
                  />
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton, securityBusy && styles.buttonDisabled]}
                  onPress={handleDeleteAccount}
                  disabled={securityBusy}
                >
                  {securityBusy ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Supprimer définitivement</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDeleteConfirm(false)}>
                  <Text style={styles.link}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  securityToggle: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  securityToggleText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  securityPanel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  securityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  securityStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  securityStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusVerified: {
    color: "#2E7D32",
  },
  statusUnverified: {
    color: "#C62828",
  },
  securityBlock: {
    gap: spacing.sm,
  },
  smallButton: {
    backgroundColor: colors.primary + "20",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  smallButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  inlineButton: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  inlineButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  securityForm: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  dangerButton: {
    backgroundColor: "#FFF0F0",
    borderColor: colors.error,
    borderWidth: 1,
  },
  dangerButtonText: {
    color: colors.error,
  },
  dangerInput: {
    borderColor: "#FFCDD2",
  },
  warningText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
    fontWeight: "500",
  },
  link: {
    textAlign: "center",
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
