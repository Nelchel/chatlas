import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Camera } from "lucide-react-native";
import { LocalStorage } from "../services/storage";

const TUTORIAL_KEY = "@catquest_map_tutorial_seen";

export function MapTutorial({
                              visible,
                              onDismiss,
                            }: {
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!visible) return null;

  const handleDismiss = async () => {
    try {
      await LocalStorage.setRaw(TUTORIAL_KEY, "true");
    } catch {}
    onDismiss();
  };

  return (
      <View style={styles.overlay} pointerEvents="auto">
        <View style={styles.spotlight}>
          <View style={styles.glow} />
          <View style={styles.pinRing} />
          <View style={styles.pinDot} />
        </View>

        <Image
            source={require("../../assets/tuto/grasminou-tuto.png")}
            style={styles.grasminou}
            resizeMode="contain"
        />


        <View style={styles.bubble}>
          <View style={styles.bubbleTail} />

          <Text style={styles.bubbleText}>
            Commence ton aventure en{"\n"}
            touchant le <Text style={styles.highlight}>pin blanc</Text> pour{"\n"}
            prendre ta première photo !
          </Text>

          <View style={styles.cameraBadge}>
            <Camera size={28} color="#3A4F54" strokeWidth={2.2} />
            <Text style={styles.sparkle}>✦</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleDismiss}>
            <Text style={styles.buttonText}>Compris !</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  spotlight: {
    position: "absolute",
    top: "49%",
    left: "49%",
    width: 118,
    height: 118,
    marginLeft: -59,
    marginTop: -59,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },

  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 232, 155, 0.24)",
  },

  pinRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#FFF8E8",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  pinDot: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: "#FFF8E8",
    backgroundColor: "rgba(216, 162, 75, 0.28)",
  },

  grasminou: {
    position: "absolute",
    left: -45,
    bottom: -35,
    width: 240,
    height: 300,
    zIndex: 8,
  },

  arrow: {
    position: "absolute",
    left: 134,
    top: "43%",
    width: 76,
    height: 76,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: "#FFF8E8",
    borderTopLeftRadius: 70,
    transform: [{ rotate: "-28deg" }],
    zIndex: 7,
  },

  bubble: {
    position: "absolute",
    left: 170,
    right: 8,
    bottom: 8,

    backgroundColor: "rgba(248, 240, 220, 1)",
    borderRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,

    alignItems: "center",

    borderWidth: 2,
    borderColor: "#E6D4B2",

    shadowColor: "#2D241D",
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,

    zIndex: 9,
  },

  bubbleTail: {
    position: "absolute",
    left: -17,
    top: 58,

    width: 34,
    height: 34,

    backgroundColor: "rgba(248, 240, 220, 1)",

    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#E6D4B2",

    transform: [{ rotate: "45deg" }],
  },

  intro: {
    fontSize: 18,
    lineHeight: 20,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  name: {
    marginTop: -2,
    fontSize: 30,
    lineHeight: 34,
    color: "#355C3C",
    fontFamily: "CormorantGaramond_700Bold",
  },

  separator: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  line: {
    width: 48,
    height: 1,
    backgroundColor: "#CDB98F",
  },

  separatorIcon: {
    color: "#C49A50",
    fontSize: 13,
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    color: "#3A2E24",
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  highlight: {
    color: "#B9742E",
    fontFamily: "CormorantGaramond_700Bold",
  },

  cameraBadge: {
    marginTop: 12,
    marginBottom: 12,
    width: 44,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  sparkle: {
    position: "absolute",
    right: -4,
    top: -8,
    fontSize: 15,
    color: "#D8A24B",
  },

  button: {
    minWidth: 160,
    height: 46,

    borderRadius: 999,

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

  buttonText: {
    color: "#FFF8E8",
    fontSize: 20,
    fontFamily: "CormorantGaramond_700Bold",
  },
});
