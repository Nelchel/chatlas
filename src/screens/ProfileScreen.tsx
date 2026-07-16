import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Award, Settings, ShieldCheck, Wrench } from "lucide-react-native";

import { useCats } from "../hooks/useCats";
import { useAuth } from "../hooks/useAuth";

import { BadgeList } from "../components/BadgeList";
import { StatsCard } from "../components/StatsCard";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileStats } from "../components/ProfileStats";
import { NavigationButtons } from "../components/NavigationButtons";
import { AdminPanel } from "../components/AdminPanel";
import { SecurityPanel } from "../components/SecurityPanel";
import { SettingsSection } from "../components/SettingsSection";

import { colors, spacing } from "../constants/theme";
import { ALL_BADGES } from "../constants/badges";
import { getMode } from "../services/mode";
import {
  getDailyBadge,
  getStreakData,
  updateStreak,
} from "../utils/badges";
import { getTotalXPWithBonus, calculateLevelInfo } from "../utils/xp";

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

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [dailyBadgeId, setDailyBadgeId] = useState<string | null>(null);
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
  });
  const [totalXP, setTotalXP] = useState(0);

  const mode = getMode();

  useEffect(() => {
    const earnedIds = new Set(
        userBadges.map((badge) => badge.badge_id)
    );

    const availableBadgeIds = ALL_BADGES
        .filter((badge) => !earnedIds.has(badge.id))
        .map((badge) => badge.id);

    getDailyBadge(availableBadgeIds).then((dailyBadge) => {
      if (dailyBadge) {
        setDailyBadgeId(dailyBadge.badgeId);
      }
    });

    getStreakData().then((streak) => {
      setStreakData({
        current: streak.currentStreak,
        longest: streak.longestStreak,
      });
    });
  }, [userBadges]);

  useEffect(() => {
    if (!user?.id) return;

    getTotalXPWithBonus(
        cats,
        sightings,
        userBadges,
        user.id
    ).then(setTotalXP);
  }, [cats, sightings, userBadges, user]);

  const levelInfo = useMemo(
    () => calculateLevelInfo(totalXP),
    [totalXP]
  );

  useFocusEffect(
      useCallback(() => {
        refresh();

        if (!user?.id) return;

        updateStreak(user.id).then(() => {
          getStreakData().then((streak) => {
            setStreakData({
              current: streak.currentStreak,
              longest: streak.longestStreak,
            });
          });
        });
      }, [refresh, user])
  );

  const handleSaveName = async () => {
    const trimmedName = newName.trim();

    if (!trimmedName) return;

    try {
      await updateUsername(trimmedName);
      setEditingName(false);

      Alert.alert("Nom mis à jour", "Ton profil a bien été modifié.");
    } catch {
      Alert.alert(
          "Erreur",
          "Impossible de modifier ton nom pour le moment."
      );
    }
  };

  const profileData = useMemo(() => {
    if (!user) {
      return {
        userCats: [],
        userSightings: [],
        followers: [],
        following: [],
        badgesCount: 0,
      };
    }

    return {
      userCats: cats.filter((cat) => cat.user_id === user.id),
      userSightings: sightings.filter(
          (sighting) => sighting.user_id === user.id
      ),
      followers: getFollowers(user.id),
      following: getFollowing(user.id),
      badgesCount: new Set(
          userBadges.map((badge) => badge.badge_id)
      ).size,
    };
  }, [
    user,
    cats,
    sightings,
    userBadges,
    getFollowers,
    getFollowing,
  ]);

  if (!user) {
    return (
        <View style={styles.centered}>
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.loadingPaper}
              resizeMode="cover"
          />

          <View style={styles.loadingMedallion}>
            <Text style={styles.loadingEmoji}>🐱</Text>
          </View>

          <Text style={styles.loadingTitle}>
            Ouverture du profil…
          </Text>

          <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
          />
        </View>
    );
  }

  return (
      <View style={styles.screen}>
        <Image
            source={require("../../assets/onboarding/paper.png")}
            style={styles.paperBackground}
            resizeMode="cover"
        />

        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Profil</Text>

          <View style={styles.heroShadow}>
            <View style={styles.heroCard}>
              <Image
                  source={require("../../assets/onboarding/paper.png")}
                  style={styles.cardPaper}
                  resizeMode="cover"
              />

              <ProfileHeader
                  username={user.username}
                  email={user.email}
                  authProvider={user.auth_provider}
                  cloudStatus={cloudStatus}
                  editingName={editingName}
                  newName={newName}
                  mode={mode}
                  onStartEdit={() => {
                    setNewName(user.username);
                    setEditingName(true);
                  }}
                  onSaveName={handleSaveName}
                  onCancelEdit={() => setEditingName(false)}
                  onChangeName={setNewName}
                  totalXP={totalXP}
                  level={levelInfo.level}
                  xpProgress={levelInfo.xpProgress}
                  xpNeeded={levelInfo.xpNeeded}
                  percentage={levelInfo.percentage}
              />

              <View style={styles.heroDivider} />

              <ProfileStats
                  totalXP={totalXP}
                  streakCurrent={streakData.current}
                  streakLongest={streakData.longest}
                  followersCount={profileData.followers.length}
                  followingCount={profileData.following.length}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
                icon={<Award size={19} color="#896225" strokeWidth={1.8} />}
                title="Carnet d’explorateur"
            />

            <View style={styles.panelShadow}>
              <View style={styles.panel}>
                <Image
                    source={require("../../assets/onboarding/paper.png")}
                    style={styles.panelPaper}
                    resizeMode="cover"
                />

                <StatsCard
                    cats={profileData.userCats.length}
                    sightings={profileData.userSightings.length}
                    favorites={favorites.length}
                    badges={profileData.badgesCount}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
                icon={<Award size={19} color="#896225" strokeWidth={1.8} />}
                title="Badges récents"
                subtitle={`${profileData.badgesCount} débloqué${
                    profileData.badgesCount > 1 ? "s" : ""
                }`}
            />

            <View style={styles.panelShadow}>
              <View style={styles.badgesPanel}>
                <Image
                    source={require("../../assets/onboarding/paper.png")}
                    style={styles.panelPaper}
                    resizeMode="cover"
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
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
                icon={<Settings size={19} color="#896225" strokeWidth={1.8} />}
                title="Explorer mon profil"
            />

            <View style={styles.actionsShadow}>
              <View style={styles.actionsPanel}>
                <Image
                    source={require("../../assets/onboarding/paper.png")}
                    style={styles.panelPaper}
                    resizeMode="cover"
                />

                <NavigationButtons />
              </View>
            </View>
          </View>

          {user.is_admin === true && (
              <View style={styles.section}>
                <SectionHeader
                    icon={<Wrench size={19} color="#896225" strokeWidth={1.8} />}
                    title="Administration"
                />

                <View style={styles.secondaryPanelShadow}>
                  <View style={styles.secondaryPanel}>
                    <Image
                        source={require("../../assets/onboarding/paper.png")}
                        style={styles.panelPaper}
                        resizeMode="cover"
                    />

                    <AdminPanel
                        cats={cats}
                        sightings={sightings}
                        mergeCats={mergeCats}
                    />
                  </View>
                </View>
              </View>
          )}

          {mode === "firebase" && (
              <View style={styles.section}>
                <SectionHeader
                    icon={
                      <ShieldCheck
                          size={19}
                          color="#896225"
                          strokeWidth={1.8}
                      />
                    }
                    title="Sécurité et compte"
                />

                <View style={styles.secondaryPanelShadow}>
                  <View style={styles.secondaryPanel}>
                    <Image
                        source={require("../../assets/onboarding/paper.png")}
                        style={styles.panelPaper}
                        resizeMode="cover"
                    />

                    <SecurityPanel
                        user={user as any}
                        signOut={signOut}
                    />
                  </View>
                </View>
              </View>
          )}

          <View style={[styles.section, styles.settingsSection]}>
            <SectionHeader
                icon={<Settings size={19} color="#896225" strokeWidth={1.8} />}
                title="Paramètres"
            />

            <View style={styles.secondaryPanelShadow}>
              <View style={styles.secondaryPanel}>
                <Image
                    source={require("../../assets/onboarding/paper.png")}
                    style={styles.panelPaper}
                    resizeMode="cover"
                />

                <SettingsSection signOut={signOut} />
              </View>
            </View>
          </View>

          <Text style={styles.footerText}>
            Continue d’explorer, le Chatlas grandit avec toi.
          </Text>
        </ScrollView>
      </View>
  );
}

function SectionHeader({
                         icon,
                         title,
                         subtitle,
                       }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {icon}

          <Text style={styles.sectionTitle}>
            {title}
          </Text>
        </View>

        {subtitle ? (
            <Text style={styles.sectionSubtitle}>
              {subtitle}
            </Text>
        ) : null}
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3E6C8",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 120,
  },

  paperBackground: {
    ...StyleSheet.absoluteFillObject,
    width: "125%",
    height: "120%",
    top: -30,
    left: -46,
    opacity: 0.98,
  },

  pageTitle: {
    marginBottom: 16,

    color: "#263F2A",
    fontSize: 34,
    lineHeight: 38,
    textAlign: "center",

    fontFamily: "CormorantGaramond_700Bold",
  },

  heroShadow: {
    borderRadius: 22,

    backgroundColor: "#C5A775",

    shadowColor: "#3C2B1A",
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.2,
    shadowRadius: 14,

    elevation: 10,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",

    paddingHorizontal: 13,
    paddingTop: 9,
    paddingBottom: 16,

    borderRadius: 22,

    backgroundColor: "rgba(247, 233, 203, 0.96)",

    borderWidth: 1,
    borderColor: "#CFB27F",
  },

  cardPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "125%",
    height: "125%",
    top: -18,
    left: -25,
    opacity: 0.45,
  },

  heroDivider: {
    height: 1,

    marginHorizontal: 14,
    marginVertical: 12,

    backgroundColor: "rgba(141, 105, 57, 0.22)",
  },

  section: {
    marginTop: 23,
  },

  sectionHeader: {
    minHeight: 28,

    marginHorizontal: 4,
    marginBottom: 9,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    color: "#332A21",
    fontSize: 19,
    lineHeight: 22,

    fontFamily: "CormorantGaramond_700Bold",
  },

  sectionSubtitle: {
    color: "#75644F",
    fontSize: 12,

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  panelShadow: {
    borderRadius: 18,

    backgroundColor: "#C5A775",

    shadowColor: "#47321E",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.13,
    shadowRadius: 10,

    elevation: 6,
  },

  panel: {
    position: "relative",
    overflow: "hidden",

    padding: 5,

    borderRadius: 18,

    backgroundColor: "rgba(242, 219, 178, 0.96)",

    borderWidth: 1,
    borderColor: "#D0B27D",
  },

  badgesPanel: {
    position: "relative",
    overflow: "hidden",

    paddingTop: 5,
    paddingHorizontal: 3,
    paddingBottom: 8,

    borderRadius: 18,

    backgroundColor: "rgba(242, 219, 178, 0.96)",

    borderWidth: 1,
    borderColor: "#D0B27D",
  },

  panelPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "130%",
    height: "140%",
    top: -20,
    left: -25,
    opacity: 0.35,
  },

  actionsShadow: {
    borderRadius: 18,

    backgroundColor: "#C5A775",

    shadowColor: "#47321E",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.13,
    shadowRadius: 10,

    elevation: 6,
  },

  actionsPanel: {
    position: "relative",
    overflow: "hidden",

    padding: 8,

    borderRadius: 18,

    backgroundColor: "rgba(245, 227, 193, 0.96)",

    borderWidth: 1,
    borderColor: "#D0B27D",
  },

  secondaryPanelShadow: {
    borderRadius: 15,

    backgroundColor: "#C9AC7B",

    shadowColor: "#47321E",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,

    elevation: 4,
  },

  secondaryPanel: {
    position: "relative",
    overflow: "hidden",

    padding: 12,

    borderRadius: 15,

    backgroundColor: "rgba(246, 230, 199, 0.96)",

    borderWidth: 1,
    borderColor: "#D4B984",
  },

  settingsSection: {
    marginBottom: 8,
  },

  footerText: {
    marginTop: 22,

    color: "#75644F",
    fontSize: 13,
    lineHeight: 17,
    textAlign: "center",

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  centered: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    padding: spacing.lg,

    backgroundColor: "#F3E6C8",
  },

  loadingPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "125%",
    height: "120%",
    top: -30,
    left: -46,
  },

  loadingMedallion: {
    width: 96,
    height: 96,

    borderRadius: 48,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#E7C678",

    borderWidth: 2,
    borderColor: "#BD8E3D",

    shadowColor: "#44301D",
    shadowOpacity: 0.17,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 7,
  },

  loadingEmoji: {
    fontSize: 46,
  },

  loadingTitle: {
    marginTop: 16,
    marginBottom: 14,

    color: "#3C3126",
    fontSize: 19,

    fontFamily: "CormorantGaramond_700Bold",
  },

  loader: {
    marginTop: 3,
  },
});
