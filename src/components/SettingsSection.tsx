import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { colors, spacing, borderRadius } from "../constants/theme";

interface SettingsSectionProps {
  signOut: () => void;
}

export function SettingsSection({ signOut }: SettingsSectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
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
  );
}

const styles = StyleSheet.create({
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
});
