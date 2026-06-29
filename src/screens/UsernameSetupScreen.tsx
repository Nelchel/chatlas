import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LocalStorage } from "../services/storage";
import { colors, spacing, borderRadius } from "../constants/theme";

interface Props {
  onComplete: (name: string) => void;
}

export function UsernameSetupScreen({ onComplete }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await LocalStorage.setUsername(trimmed);
    onComplete(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.emoji}>🐱</Text>
        <Text style={styles.title}>Bienvenue sur Chatlas</Text>
        <Text style={styles.subtitle}>
          Photographiez des chats, retrouvez-les grâce à l'IA {"\n"}et construisez la plus grande carte féline.{"\n"}Choisis ton nom de chasseur·euse
          pour commencer !
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nom de chasseur·euse"
          placeholderTextColor={colors.textSecondary}
          maxLength={30}
          autoFocus
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>C'est parti !</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Visible dans le classement et l'activité.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
