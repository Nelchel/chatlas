import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, Pencil, X } from "lucide-react-native";

const MODE_LABELS: Record<
    string,
    {
      icon: string;
      label: string;
    }
> = {
  local: {
    icon: "📦",
    label: "Local",
  },
  firebase: {
    icon: "☁️",
    label: "Cloud",
  },
};

const OFFLINE_LABEL = {
  icon: "📴",
  label: "Hors ligne",
};

interface ProfileHeaderProps {
  username: string;
  email?: string | null;
  authProvider?: string;
  cloudStatus?: string;

  editingName: boolean;
  newName: string;
  mode: string;

  level: number;
  totalXP: number;
  xpProgress: number;
  xpNeeded: number;
  percentage: number;

  onStartEdit: () => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  onChangeName: (name: string) => void;
}

export function ProfileHeader({
                                username,
                                cloudStatus,
                                editingName,
                                newName,
                                mode,
                                level,
                                totalXP,
                                xpProgress,
                                xpNeeded,
                                percentage,
                                onStartEdit,
                                onSaveName,
                                onCancelEdit,
                                onChangeName,
                              }: ProfileHeaderProps) {
  const modeInfo =
      mode === "firebase" && cloudStatus === "offline"
          ? OFFLINE_LABEL
          : MODE_LABELS[mode] || MODE_LABELS.local;

  const progressPercentage = Math.min(
      100,
      Math.max(0, percentage)
  );

  return (
      <View style={styles.container}>
        <View style={styles.portraitColumn}>
          <View style={styles.portraitShadow}>
            <View style={styles.portraitFrame}>
              {/*
            <Image
              source={require("../../assets/profile/profile-cat.png")}
              style={styles.portrait}
              resizeMode="cover"
            />
            */}

              <View style={styles.levelBadgeWrapper}>
                <View style={styles.levelBadgeOuter}>
                  <View style={styles.levelBadgeInner}>
                    <View style={styles.levelBadgeCircle}>
                      <Text style={styles.levelBadgeValue}>
                        {level}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.pawMedallion}>
                <Text style={styles.pawMedallionText}>
                  🐾
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.identityColumn}>
          {editingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                    style={styles.nameInput}
                    value={newName}
                    onChangeText={onChangeName}
                    placeholder="Ton pseudo"
                    placeholderTextColor="#8A7B67"
                    maxLength={30}
                    autoFocus
                />

                <TouchableOpacity
                    style={styles.editAction}
                    onPress={onSaveName}
                    activeOpacity={0.8}
                >
                  <Check
                      size={17}
                      color="#355C3C"
                      strokeWidth={2.4}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.editAction}
                    onPress={onCancelEdit}
                    activeOpacity={0.8}
                >
                  <X
                      size={17}
                      color="#9A4E42"
                      strokeWidth={2.3}
                  />
                </TouchableOpacity>
              </View>
          ) : (
              <TouchableOpacity
                  style={styles.nameRow}
                  onPress={onStartEdit}
                  activeOpacity={0.75}
              >
                <Text
                    style={styles.username}
                    numberOfLines={1}
                >
                  {username}
                </Text>

                <Pencil
                    size={17}
                    color="#6E5B43"
                    strokeWidth={1.8}
                />
              </TouchableOpacity>
          )}

          <Text style={styles.mode}>
            Mode : {modeInfo.icon} {modeInfo.label}
          </Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>
              🎖️ Niveau {level}
            </Text>

            <Text style={styles.totalXP}>
              {totalXP} XP
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                  },
                ]}
            />

            <View style={styles.scrollEnd}>
              <View style={styles.scrollCap} />
            </View>
          </View>

          <Text style={styles.progressText}>
            {xpProgress} / {xpNeeded} XP pour niveau{" "}
            {level + 1}
          </Text>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 178,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 5,
    paddingVertical: 5,
  },

  portraitColumn: {
    width: "43%",

    alignItems: "center",
    justifyContent: "center",
  },

  portraitShadow: {
    width: 148,
    height: 148,

    borderRadius: 74,

    backgroundColor: "#C5A166",

    shadowColor: "#46301D",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.21,
    shadowRadius: 10,

    elevation: 8,
  },

  portraitFrame: {
    width: 148,
    height: 148,

    position: "relative",
    overflow: "visible",

    borderRadius: 74,

    backgroundColor: "#E8D4AA",

    borderWidth: 2,
    borderColor: "#B98D4A",
  },

  portrait: {
    width: "100%",
    height: "100%",

    borderRadius: 72,
  },

  levelBadgeWrapper: {
    position: "absolute",
    left: -15,
    bottom: -12,

    width: 66,
    height: 68,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 10,

    shadowColor: "#45301B",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 4,
    },

  },

  levelBadgeOuter: {
    width: 48,
    height: 48,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#A66F24",

    borderRadius: 8,

    transform: [
      {
        rotate: "45deg",
      },
    ],
  },

  levelBadgeInner: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E8C66D",

    borderWidth: 1.5,
    borderColor: "#F4D98C",

    borderRadius: 6,
  },

  levelBadgeCircle: {
    width: 31,
    height: 31,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255, 239, 182, 0.32)",

    borderWidth: 1,
    borderColor: "rgba(111, 72, 25, 0.42)",

    transform: [
      {
        rotate: "-45deg",
      },
    ],
  },

  levelBadgeValue: {
    color: "#3C2D1F",

    fontSize: 22,
    lineHeight: 25,

    fontFamily: "CormorantGaramond_700Bold",
  },

  pawMedallion: {
    position: "absolute",
    right: -7,
    bottom: 2,

    width: 47,
    height: 47,

    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E6C986",

    borderWidth: 2,
    borderColor: "#B7873C",

    shadowColor: "#46301D",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  pawMedallionText: {
    fontSize: 22,
  },

  identityColumn: {
    flex: 1,

    paddingLeft: 10,
    paddingRight: 3,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  username: {
    maxWidth: "82%",

    color: "#263F2A",
    fontSize: 31,
    lineHeight: 34,

    fontFamily: "CormorantGaramond_700Bold",
  },

  mode: {
    marginTop: 3,

    color: "#746653",
    fontSize: 15,

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  levelRow: {
    marginTop: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  levelLabel: {
    color: "#2E2A23",
    fontSize: 15,

    fontFamily: "CormorantGaramond_700Bold",
  },

  totalXP: {
    color: "#355C3C",
    fontSize: 14,

    fontFamily: "CormorantGaramond_700Bold",
  },

  progressTrack: {
    height: 11,

    marginTop: 8,

    position: "relative",
    overflow: "visible",

    borderRadius: 999,

    backgroundColor: "#D8C8A7",
  },

  progressFill: {
    height: "100%",

    borderRadius: 999,

    backgroundColor: "#355C3C",
  },

  scrollEnd: {
    position: "absolute",
    right: -4,
    top: -5,

    width: 16,
    height: 21,

    alignItems: "center",
    justifyContent: "center",
  },

  scrollCap: {
    width: 8,
    height: 18,

    borderRadius: 5,

    backgroundColor: "#C69B58",

    borderWidth: 1,
    borderColor: "#8E682E",

    transform: [
      {
        rotate: "6deg",
      },
    ],
  },

  progressText: {
    marginTop: 5,

    color: "#665946",
    fontSize: 11,

    textAlign: "center",

    fontFamily: "CormorantGaramond_600SemiBold",
  },

  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  nameInput: {
    flex: 1,
    minHeight: 40,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 9,

    color: "#2F281F",
    fontSize: 18,

    backgroundColor:
        "rgba(255, 248, 232, 0.76)",

    borderWidth: 1,
    borderColor: "#CBAA73",

    fontFamily: "CormorantGaramond_700Bold",
  },

  editAction: {
    width: 34,
    height: 34,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
        "rgba(245, 229, 197, 0.90)",

    borderWidth: 1,
    borderColor: "#CBAA73",
  },
});
