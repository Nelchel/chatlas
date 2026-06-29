import { useCallback, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";
import { Cat, RootStackParamList } from "../types";
import { BadgeList } from "../components/BadgeList";
import { StatsCard } from "../components/StatsCard";
import { colors, spacing, borderRadius } from "../constants/theme";
import { ALL_BADGES } from "../constants/badges";
import { getMode } from "../services/mode";
import { auth } from "../services/firebase";
import { useGoogleAuth, signInWithAppleNative } from "../hooks/useOAuth";
import { authService } from "../services/authService";
import { getDailyBadge } from "../utils/badges";
import { getStreakData, updateStreak } from "../utils/badges";
import { getTotalXPWithBonus, calculateLevelInfo } from "../utils/xp";

const MODE_LABELS: Record<string, { icon: string; label: string }> = {
  local: { icon: "📦", label: "Local" },
  firebase: { icon: "☁️", label: "Cloud" },
};

const OFFLINE_LABEL = { icon: "📴", label: "Hors ligne" };

function authProviderLabel(p: string): string {
  const labels: Record<string, string> = {
    google: "Google",
    apple: "Apple",
    email: "Email",
    anonymous: "invité·e",
  };
  return labels[p] || p;
}

export function ProfileScreen() {
  const {
    cats,
    sightings,
    favorites,
    userBadges,
    cloudStatus,
    refresh,
    mergeCats,
    getFollowers,
    getFollowing,
  } = useCats();
  const { user, signOut, updateUsername } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [mergeKeepId, setMergeKeepId] = useState<string | null>(null);
  const [mergeRemoveId, setMergeRemoveId] = useState<string | null>(null);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [dailyBadgeId, setDailyBadgeId] = useState<string | null>(null);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0 });
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    const earnedIds = new Set(userBadges.map((b) => b.badge_id));
    const available = ALL_BADGES.filter((b) => !earnedIds.has(b.id)).map((b) => b.id);
    getDailyBadge(available).then((d) => {
      if (d) setDailyBadgeId(d.badgeId);
    });
    getStreakData().then((s) => setStreakData({ current: s.currentStreak, longest: s.longestStreak }));
  }, [userBadges]);

  useEffect(() => {
    if (user?.id) {
      getTotalXPWithBonus(cats, sightings, userBadges, user.id).then(setTotalXP);
    }
  }, [cats, sightings, userBadges, user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      // Mettre à jour le streak à chaque entrée dans le profil
      if (user?.id) {
        updateStreak(user.id).then(() => {
          getStreakData().then((s) =>
            setStreakData({ current: s.currentStreak, longest: s.longestStreak })
          );
        });
      }
    }, [refresh, user])
  );

  const mode = getMode();

  const modeInfo =
    mode === "firebase" && cloudStatus === "offline"
      ? OFFLINE_LABEL
      : MODE_LABELS[mode] || MODE_LABELS.local;

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    await updateUsername(newName.trim());
    setEditingName(false);
    Alert.alert("✅ OK", "Nom mis à jour !");
  };

  const duplicateGroups = cats.reduce<
    Array<{ name: string; items: Cat[] }>
  >((groups, cat) => {
    const name = cat.name?.trim().toLowerCase();
    if (!name) return groups;
    const existing = groups.find((g) => g.name === name);
    if (existing) {
      existing.items.push(cat);
    } else {
      groups.push({ name, items: [cat] });
    }
    return groups;
  }, []).filter((g) => g.items.length > 1);

  const handleMerge = async () => {
    if (!mergeKeepId || !mergeRemoveId) return;
    try {
      await mergeCats(mergeKeepId, mergeRemoveId);
      Alert.alert("✅ Fusion réussie", "Les doublons ont été fusionnés.");
      setMergeKeepId(null);
      setMergeRemoveId(null);
    } catch (e) {
      console.error("Merge error:", e);
      Alert.alert("❌ Erreur", "Impossible de fusionner les chats.");
    }
  };

  // ===== SECURITY FUNCTIONS =====

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
      // Re-authenticate if email provider
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

  const handleLinkGoogle = async () => {
    // Linking Google in profile requires a redirect-based OAuth flow.
    // Users can link their Google account by logging out and signing in with Google,
    // which automatically links to existing anonymous accounts or creates a new one.
    Alert.alert("Lier Google", "Pour lier ton compte Google, connecte-toi avec Google sur cet appareil. Si tu es déjà connecté, ton compte sera automatiquement lié.");
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.infoText}>Chargement du profil...</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🐱</Text>
        </View>

        {editingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ton pseudo"
              maxLength={30}
              autoFocus
            />
            <TouchableOpacity onPress={handleSaveName}>
              <Text style={styles.saveText}>✅</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingName(false)}>
              <Text style={styles.cancelText}>❌</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setNewName(user.username);
              setEditingName(true);
            }}
          >
            <Text style={styles.username}>{user.username} ✏️</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.mode}>
          Mode : {modeInfo.icon} {modeInfo.label}
        </Text>

        {(() => {
          const levelInfo = calculateLevelInfo(totalXP);
          return (
            <View style={styles.xpContainer}>
              <View style={styles.levelRow}>
                <Text style={styles.levelText}>🎖️ Niveau {levelInfo.level}</Text>
                <Text style={styles.xpTotal}>{levelInfo.totalXP} XP</Text>
              </View>
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
            </View>
          );
        })()}

        {/* 🔥 Série Quotidienne */}
        <View style={styles.streakContainer}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakTitle}>Série actuelle</Text>
            <Text style={styles.streakDays}>{streakData.current} jour{streakData.current > 1 ? "s" : ""}</Text>
          </View>
          {streakData.current > 0 ? (
            <Text style={styles.streakSub}>
              Perdre la série si aucune observation.
            </Text>
          ) : (
            <Text style={styles.streakSub}>
              Fais une observation pour relancer ta série !
            </Text>
          )}
          <Text style={styles.streakRecord}>Record : {streakData.longest} jour{streakData.longest > 1 ? "s" : ""}</Text>
        </View>

        {/* Follow counts */}
        {(() => {
          const followers = getFollowers(user.id);
          const following = getFollowing(user.id);
          return (
            <View style={styles.followCounts}>
              <TouchableOpacity style={styles.followItem}>
                <Text style={styles.followValue}>{followers.length}</Text>
                <Text style={styles.followLabel}>Abonnés</Text>
              </TouchableOpacity>
              <View style={styles.followDivider} />
              <TouchableOpacity style={styles.followItem}>
                <Text style={styles.followValue}>{following.length}</Text>
                <Text style={styles.followLabel}>Abonnements</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {user.email && (
          <Text style={styles.email}>{user.email}</Text>
        )}

        {user.auth_provider && user.auth_provider !== "anonymous" && (
          <Text style={styles.provider}>
            Connecté·e avec {authProviderLabel(user.auth_provider)}
          </Text>
        )}
      </View>

      <StatsCard
        cats={cats.filter((c) => c.user_id === user?.id).length}
        sightings={sightings.filter((s) => s.user_id === user?.id).length}
        favorites={favorites.length}
        badges={new Set(userBadges.map((b) => b.badge_id)).size}
      />

      <BadgeList
        allBadges={ALL_BADGES}
        earnedBadges={userBadges}
        dailyBadgeId={dailyBadgeId}
        cats={cats}
        sightings={sightings}
        favorites={favorites}
        currentStreak={streakData.current}
      />

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.badgesButton}
          onPress={() => navigation.navigate("Badges")}
        >
          <Text style={styles.badgesButtonText}>🏅 Voir tous les badges</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate("Stats")}
        >
          <Text style={styles.statsButtonText}>📈 Statistiques</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.questsButton}
          onPress={() => navigation.navigate("Quests")}
        >
          <Text style={styles.questsButtonText}>Quêtes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={() => navigation.navigate("Leaderboard")}
        >
          <Text style={styles.leaderboardButtonText}>🏆 Classement</Text>
        </TouchableOpacity>
      </View>

      {user?.is_admin === true && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.adminToggle}
            onPress={() => setShowAdmin((p) => !p)}
          >
            <Text style={styles.adminToggleText}>
              🛠️ Admin {showAdmin ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {showAdmin && (
            <View style={styles.adminPanel}>
              <Text style={styles.adminTitle}>Fusion de doublons</Text>
              {duplicateGroups.length === 0 ? (
                <Text style={styles.adminEmpty}>Aucun doublon trouvé ✨</Text>
              ) : (
                duplicateGroups.map((group) => (
                  <View key={group.name} style={styles.dupGroup}>
                    <Text style={styles.dupGroupTitle}>
                      "{group.items[0].name}" ({group.items.length} fois)
                    </Text>
                    {group.items.map((cat) => {
                      const isKeep = mergeKeepId === cat.id;
                      const isRemove = mergeRemoveId === cat.id;
                      const selected = isKeep || isRemove;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.dupCard,
                            isKeep && styles.dupCardKeep,
                            isRemove && styles.dupCardRemove,
                          ]}
                          onPress={() => {
                            if (mergeKeepId === cat.id) {
                              setMergeKeepId(null);
                            } else if (mergeRemoveId === cat.id) {
                              setMergeRemoveId(null);
                            } else if (!mergeKeepId) {
                              setMergeKeepId(cat.id);
                            } else if (!mergeRemoveId && cat.id !== mergeKeepId) {
                              setMergeRemoveId(cat.id);
                            } else {
                              setMergeKeepId(cat.id);
                              setMergeRemoveId(null);
                            }
                          }}
                        >
                          {cat.photo_url ? (
                            <Image
                              source={{ uri: cat.photo_url }}
                              style={styles.dupThumb}
                            />
                          ) : (
                            <View style={styles.dupThumbPlaceholder}>
                              <Text style={styles.dupThumbEmoji}>🐱</Text>
                            </View>
                          )}
                          <View style={styles.dupInfo}>
                            <Text style={styles.dupLabel}>
                              {selected
                                ? isKeep
                                  ? "🟢 Garder"
                                  : "🔴 Supprimer"
                                : "Sélectionner"}
                            </Text>
                            <Text style={styles.dupMeta}>
                              {sightings.filter((s) => s.cat_id === cat.id).length} obs.
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[
                  styles.mergeButton,
                  (!mergeKeepId || !mergeRemoveId) &&
                    styles.mergeButtonDisabled,
                ]}
                disabled={!mergeKeepId || !mergeRemoveId}
                onPress={handleMerge}
              >
                <Text style={styles.mergeButtonText}>
                  {mergeKeepId && mergeRemoveId
                    ? "Fusionner"
                    : "Sélectionne 2 chats à fusionner"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {mode === "firebase" && user && (
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
              {/* Email verification status */}
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

              {/* Change password (email only) */}
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

              {/* Delete account */}
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
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>
        <TouchableOpacity
          style={styles.bugReportButton}
          onPress={() => navigation.navigate("BugReport")}
        >
          <Text style={styles.bugReportButtonText}>🐛 Signaler un bug</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Chatlas v1.0.0</Text>
      </View>
    </ScrollView>
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
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 18,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 150,
    textAlign: "center",
  },
  saveText: {
    fontSize: 20,
  },
  cancelText: {
    fontSize: 20,
  },
  mode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  xpContainer: {
    width: "80%",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.xs,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  xpTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  xpBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  xpDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  streakContainer: {
    width: "80%",
    alignItems: "center",
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginRight: spacing.sm,
  },
  streakDays: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  streakSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 2,
  },
  streakRecord: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  followCounts: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  followItem: {
    alignItems: "center",
  },
  followValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  followLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  provider: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    opacity: 0.7,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  logoutButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
  version: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  bugReportButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  bugReportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
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
  adminToggle: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminToggleText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  adminPanel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  adminEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dupGroup: {
    marginBottom: spacing.md,
  },
  dupGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dupCardKeep: {
    borderColor: colors.primary,
  },
  dupCardRemove: {
    borderColor: colors.error,
  },
  dupThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
  },
  dupThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  dupThumbEmoji: {
    fontSize: 22,
  },
  dupInfo: {
    flex: 1,
  },
  dupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dupMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mergeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  mergeButtonDisabled: {
    opacity: 0.4,
  },
  mergeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  leaderboardButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  leaderboardButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  badgesButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  badgesButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  statsButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "#FF9800",
    alignItems: "center",
  },
  statsButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  questsButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "#9C27B0",
    alignItems: "center",
  },
  questsButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  // Security Section Styles
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
