import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Award,
  Binoculars,
  Check,
  House,
  Medal,
  PawPrint,
  Search,
  Trophy,
} from "lucide-react-native";

import { useCats } from "../hooks/useCats";
import { formatTimeRemaining } from "../utils/quests";

type Quest = {
  id: string;
  type: "daily" | "weekly" | "one_time";
  description: string;
  progress: number;
  target?: number;
  reward_xp: number;
  completed: boolean;
  expires_at?: string | null;
};

type QuestIllustration =
    | "cat"
    | "house"
    | "plant"
    | "search"
    | "badge"
    | "trophy";

function ProgressBar({
                       progress,
                       target,
                       completed,
                     }: {
  progress: number;
  target: number;
  completed: boolean;
}) {
  const percentage = Math.min(
      100,
      Math.max(0, target > 0 ? (progress / target) * 100 : 0)
  );

  return (
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View
              style={[
                styles.progressFill,
                completed && styles.progressFillCompleted,
                { width: `${percentage}%` },
              ]}
          />
        </View>

        <Text style={styles.progressValue}>
          {progress} / {target}
        </Text>
      </View>
  );
}

function QuestIcon({
                     type,
                     completed,
                   }: {
  type: QuestIllustration;
  completed: boolean;
}) {
  const iconColor = completed ? "#355C3C" : "#A86725";

  return (
      <View
          style={[
            styles.questIcon,
            completed && styles.questIconCompleted,
          ]}
      >
        {type === "cat" && (
            <Image
                source={require("../../assets/quest/orange-cat.png")}
                style={styles.catIllustrationImage}
                resizeMode="contain"
            />
        )}

        {type === "house" && (
            <Image
                source={require("../../assets/quest/house.png")}
                style={styles.houseIllustrationImage}
                resizeMode="contain"
            />
        )}

        {type === "plant" && (
            <Image
                source={require("../../assets/quest/plant.png")}
                style={styles.plantIllustrationImage}
                resizeMode="contain"
            />
        )}

        {type === "search" && (
            <Image
                source={require("../../assets/quest/search.png")}
                style={styles.searchIllustrationImage}
                resizeMode="contain"
            />
        )}

        {type === "badge" && (
            <Image
                source={require("../../assets/quest/medal.png")}
                style={styles.medalIllustrationImage}
                resizeMode="contain"
            />
        )}

        {type === "trophy" && (
            <Image
                source={require("../../assets/quest/trophy.png")}
                style={styles.trophyIllustrationImage}
                resizeMode="contain"
            />
        )}

        {completed && (
            <View style={styles.completedCheck}>
              <Check
                  size={11}
                  color="#FFF8E8"
                  strokeWidth={3}
              />
            </View>
        )}
      </View>
  );
}

function getQuestIllustration(
    quest: Quest,
    index: number
): QuestIllustration {
  if (quest.completed) {
    return "badge";
  }

  if (quest.type === "daily") {
    return "cat";
  }

  const weeklyIcons: QuestIllustration[] = [
    "house",
    "plant",
    "search",
  ];

  if (quest.type === "weekly") {
    return weeklyIcons[index % weeklyIcons.length];
  }

  return "trophy";
}

function QuestCard({
                     quest,
                     icon,
                     compact = false,
                   }: {
  quest: Quest;
  icon: QuestIllustration;
  compact?: boolean;
}) {
  const target = quest.target || 1;

  const timeRemaining =
      quest.type !== "one_time" && quest.expires_at
          ? formatTimeRemaining(quest.expires_at)
          : null;

  return (
      <View
          style={[
            styles.cardShadow,
            compact && styles.compactCardShadow,
          ]}
      >
        <View
            style={[
              styles.card,
              compact && styles.compactCard,
              quest.completed && styles.cardCompleted,
            ]}
        >
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.cardPaper}
              resizeMode="cover"
          />

          <QuestIcon
              type={icon}
              completed={quest.completed}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text
                  style={[
                    styles.cardTitle,
                    quest.completed && styles.cardTitleCompleted,
                  ]}
                  numberOfLines={2}
              >
                {quest.description}
              </Text>

              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>
                  +{quest.reward_xp} XP
                </Text>
              </View>
            </View>

            {quest.completed ? (
                <View style={styles.completedRow}>
                  <Check
                      size={13}
                      color="#355C3C"
                      strokeWidth={2.7}
                  />

                  <Text style={styles.completedText}>
                    Terminé
                  </Text>
                </View>
            ) : (
                <ProgressBar
                    progress={quest.progress || 0}
                    target={target}
                    completed={quest.completed}
                />
            )}

            {timeRemaining && !quest.completed && (
                <Text style={styles.timeRemaining}>
                  Plus que {timeRemaining}
                </Text>
            )}
          </View>
        </View>
      </View>
  );
}

function SectionTitle({
                        children,
                      }: {
  children: React.ReactNode;
}) {
  return (
      <Text style={styles.sectionTitle}>
        {children}
      </Text>
  );
}

export function QuestsScreen() {
  const { quests } = useCats();

  const typedQuests = quests as Quest[];

  const dailyQuest = typedQuests.find(
      (quest) => quest.type === "daily"
  );

  const weeklyQuests = typedQuests.filter(
      (quest) => quest.type === "weekly"
  );

  const oneTimeQuests = typedQuests.filter(
      (quest) => quest.type === "one_time"
  );

  const recentSuccesses = oneTimeQuests.filter(
      (quest) => quest.completed
  );

  const incompleteOneTime = oneTimeQuests.filter(
      (quest) => !quest.completed
  );

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Quêtes
            </Text>

            <View style={styles.guideArea}>
              <View style={styles.speechBubble}>
                <View style={styles.speechTail} />

                <Text style={styles.guideGreeting}>
                  Salut explorateur !
                </Text>

                <Text style={styles.guideText}>
                  Prêt pour de nouvelles{"\n"}
                  missions ?
                </Text>
              </View>

              <Image
                  source={require("../../assets/grasminou-quest.png")}
                  style={styles.grasminou}
                  resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>
              MISSION DU JOUR
            </SectionTitle>

            {dailyQuest ? (
                <QuestCard
                    quest={dailyQuest}
                    icon="cat"
                />
            ) : (
                <View style={styles.emptyCard}>
                  <PawPrint
                      size={26}
                      color="#9F7941"
                      strokeWidth={1.6}
                  />

                  <Text style={styles.emptyText}>
                    Aucune mission aujourd’hui
                  </Text>
                </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle>
              DÉFIS HEBDOMADAIRES
            </SectionTitle>

            {weeklyQuests.length > 0 ? (
                weeklyQuests.map((quest, index) => (
                    <QuestCard
                        key={quest.id}
                        quest={quest}
                        icon={getQuestIllustration(
                            quest,
                            index
                        )}
                    />
                ))
            ) : (
                <View style={styles.emptyCard}>
                  <Binoculars
                      size={26}
                      color="#9F7941"
                      strokeWidth={1.6}
                  />

                  <Text style={styles.emptyText}>
                    Aucun défi hebdomadaire
                  </Text>
                </View>
            )}
          </View>

          {incompleteOneTime.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>
                  OBJECTIFS D’EXPLORATION
                </SectionTitle>

                {incompleteOneTime.map(
                    (quest, index) => (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            icon={
                              index % 2 === 0
                                  ? "trophy"
                                  : "badge"
                            }
                        />
                    )
                )}
              </View>
          )}

          {recentSuccesses.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>
                  SUCCÈS RÉCENTS
                </SectionTitle>

                {recentSuccesses
                    .slice(0, 3)
                    .map((quest) => (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            icon="badge"
                            compact
                        />
                    ))}
              </View>
          )}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4E7CB",
  },

  scroll: {
    flex: 1,
  },

  paperBackground: {
    ...StyleSheet.absoluteFillObject,
    width: "120%",
    height: "115%",
    top: -25,
    left: -40,
    opacity: 0.98,
  },

  content: {
    paddingHorizontal: 14,
    paddingTop: 52,
    paddingBottom: 110,
  },

  header: {
    minHeight: 190,
    position: "relative",
    marginBottom: 5,
  },

  headerTitle: {
    textAlign: "center",
    color: "#2D251E",
    fontSize: 31,
    lineHeight: 35,
    fontFamily: "CormorantGaramond_700Bold",
  },

  guideArea: {
    flex: 1,
    position: "relative",
    marginTop: 7,
  },

  grasminou: {
    position: "absolute",
    right: -55,
    bottom: -75,
    width: 255,
    height: 250,
  },

  speechBubble: {
    position: "absolute",
    left: 50,
    top: 16,

    width: 168,
    minHeight: 88,

    paddingHorizontal: 13,
    paddingVertical: 12,

    borderRadius: 10,

    backgroundColor: "rgba(248, 240, 220, 0.94)",

    borderWidth: 1,
    borderColor: "#D1B57F",

    shadowColor: "#4B3620",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  speechTail: {
    position: "absolute",
    right: -11,
    top: 43,

    width: 21,
    height: 21,

    backgroundColor: "rgba(248, 240, 220, 0.94)",

    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D1B57F",

    transform: [{ rotate: "45deg" }],
  },

  guideGreeting: {
    color: "#332A21",
    fontSize: 15,
    lineHeight: 18,
    fontFamily: "CormorantGaramond_700Bold",
  },

  guideText: {
    marginTop: 5,

    color: "#514538",
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  section: {
    marginBottom: 16,
  },

  sectionTitle: {
    marginBottom: 7,
    marginLeft: 3,

    color: "#51483B",
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: "CormorantGaramond_700Bold",
  },

  cardShadow: {
    marginBottom: 8,

    borderRadius: 12,

    backgroundColor: "#CEAC75",

    shadowColor: "#46331F",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  compactCardShadow: {
    marginBottom: 6,
  },

  card: {
    minHeight: 92,

    position: "relative",
    overflow: "hidden",

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 10,
    paddingHorizontal: 10,

    borderRadius: 12,

    backgroundColor: "#F1DFC0",

    borderWidth: 1,
    borderColor: "#D0B17C",
  },

  compactCard: {
    minHeight: 74,
    paddingVertical: 8,
  },

  cardCompleted: {
    backgroundColor: "#EAD9B9",
  },

  cardPaper: {
    ...StyleSheet.absoluteFillObject,
    width: "130%",
    height: "160%",
    top: -25,
    left: -25,
    opacity: 0.38,
  },

  questIcon: {
    width: 54,
    height: 61,

    marginRight: 10,

    borderRadius: 13,
    display: "flex",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(232, 202, 146, 0.72)",

    borderWidth: 1,
    borderColor: "#D5B16F",
  },

  questIconCompleted: {
    backgroundColor: "rgba(202, 217, 183, 0.72)",
    borderColor: "#9DB17E",
  },

  catIllustrationImage: {
    width: 48,
    height: 48,
  },

  houseIllustrationImage: {
    width: 58,
    height: 68,
  },

  plantIllustrationImage: {
    width: 58,
    height: 78,
  },

  searchIllustrationImage: {
    width: 78,
    height: 88,
  },

  medalIllustrationImage: {
    width: 68,
    height: 88,
  },

  trophyIllustrationImage: {
    width: 68,
    height: 88,
  },

  completedCheck: {
    position: "absolute",
    right: -3,
    bottom: -3,

    width: 20,
    height: 20,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#355C3C",

    borderWidth: 2,
    borderColor: "#F3E3C5",
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cardTitle: {
    flex: 1,
    paddingRight: 7,

    color: "#342C23",
    fontSize: 16,
    lineHeight: 17,

    fontFamily: "CormorantGaramond_700Bold",
  },

  cardTitleCompleted: {
    color: "#4C5343",
  },

  xpBadge: {
    minHeight: 25,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EBC98D",

    borderWidth: 1,
    borderColor: "#D3AC66",
  },

  xpBadgeText: {
    color: "#875A22",
    fontSize: 12,
    fontFamily: "CormorantGaramond_700Bold",
  },

  progressSection: {
    marginTop: 10,

    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  progressTrack: {
    flex: 1,
    height: 8,

    overflow: "hidden",

    borderRadius: 999,

    backgroundColor: "#D7C6A3",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#355C3C",
  },

  progressFillCompleted: {
    backgroundColor: "#71865F",
  },

  progressValue: {
    width: 35,

    color: "#44392D",
    fontSize: 12,
    textAlign: "right",

    fontFamily: "CormorantGaramond_700Bold",
  },

  timeRemaining: {
    marginTop: 4,

    color: "#87745B",
    fontSize: 11,
    textAlign: "right",

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  completedRow: {
    marginTop: 8,

    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  completedText: {
    color: "#355C3C",
    fontSize: 13,
    fontFamily: "CormorantGaramond_700Bold",
  },

  emptyCard: {
    minHeight: 78,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(240, 221, 188, 0.62)",

    borderWidth: 1,
    borderColor: "#D4B987",
  },

  emptyText: {
    marginTop: 5,

    color: "#796950",
    fontSize: 13,

    fontFamily: "CormorantGaramond_600SemiBold",
  },
});
