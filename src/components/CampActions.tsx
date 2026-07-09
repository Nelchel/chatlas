import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { X } from "lucide-react-native";

interface Props {
  onPhotoPress: () => void;
  onClose: () => void;
}

export function CampActions({ onPhotoPress, onClose }: Props) {
  return (
    <View style={styles.campActions}>
      <TouchableOpacity
        style={[styles.campAction, styles.campActionPhoto]}
        onPress={onPhotoPress}
        activeOpacity={0.9}
      >
        <View style={styles.campIconWrapper}>
          <Image
            source={require("../../assets/map/photo.png")}
            style={styles.campIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.campTextWrapper}>
          <Text style={styles.campActionText}>Photo</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.campClose}
        onPress={onClose}
        activeOpacity={0.9}
      >
        <X size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  campActions: {
    position: "absolute",
    top: "47%",
    left: "48%",
    width: 1,
    height: 1,
    zIndex: 45,
  },

  campAction: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 9,
  },

  campActionPhoto: {
    top: -92,
    left: -92,
  },

  campIconWrapper: {
    width: 75,
    height: 75,
    borderRadius: 43,
    backgroundColor: "rgba(248, 240, 220, 0.94)",
    borderWidth: 3,
    borderColor: "#E8D4A8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A2521",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 8,
  },

  campIcon: {
    width: 46,
    height: 46,
  },

  campTextWrapper: {
    marginTop: -10,
    minWidth: 85,
    height: 34,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: "#FFF5E2",
    borderWidth: 2,
    borderColor: "#D9C7A2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2A2521",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 4,
  },

  campActionText: {
    color: "#3A2D23",
    fontSize: 18,
    fontFamily: "CormorantGaramond_700Bold",
  },

  campClose: {
    position: "absolute",
    top: 70,
    left: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#355C3C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F8F0DC",
  },
});
