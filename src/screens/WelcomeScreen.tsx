import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PawPrint } from "lucide-react-native";

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.card}>
          <Image
              source={require("../../assets/onboarding/paper.png")}
              style={styles.paper}
              resizeMode="cover"
          />

          <Image
              source={require("../../assets/onboarding/grasminou.png")}
              style={styles.grasminou}
              resizeMode="contain"
          />

          <View style={styles.textContainer}>
            <Text style={styles.title}>Salut ! Moi c'est</Text>
            <Text style={styles.name}>Grasminou.</Text>

            <Text style={styles.subtitle}>
              Je vais t'aider à remplir{"\n"}le Chatlas.
            </Text>
          </View>

          <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={onContinue}
          >
            <View style={styles.buttonInner} />
            <View style={styles.buttonHighlight} />

            <Text style={styles.buttonText}>C'est parti !</Text>

            <PawPrint size={23} color="#F8F0DC" style={styles.paw} />
          </Pressable>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3EBD7",
  },

  card: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F6EEDB",
  },

  paper: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  grasminou: {
    position: "absolute",
    left: -46,
    bottom: -28,
    width: 585,
    height: 900,
  },

  textContainer: {
    position: "absolute",
    top: 112,
    right: 34,
    width: 210,
  },

  title: {
    fontSize: 27,
    lineHeight: 31,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  name: {
    marginTop: -2,
    fontSize: 39,
    lineHeight: 42,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 25,
    color: "#2D241D",
    fontFamily: "CormorantGaramond_700Bold",
  },

  button: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 54,
    height: 62,
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

  buttonPressed: {
    transform: [{ scale: 0.985 }, { translateY: 1 }],
    shadowOpacity: 0.14,
  },

  buttonInner: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  buttonHighlight: {
    position: "absolute",
    top: 3,
    left: 14,
    right: 14,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  buttonText: {
    color: "#F8F0DC",
    fontSize: 25,
    fontFamily: "CormorantGaramond_600SemiBold",
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  paw: {
    position: "absolute",
    right: 26,
    opacity: 0.82,
  },
});
