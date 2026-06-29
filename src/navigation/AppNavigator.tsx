import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList, TabParamList } from "../types";
import { colors, spacing } from "../constants/theme";
import { LocalStorage } from "../services/storage";
import { getMode } from "../services/mode";
import { useAuth } from "../hooks/useAuth";
import { HomeMapScreen } from "../screens/HomeMapScreen";
import { CaptureCatScreen } from "../screens/CaptureCatScreen";
import { CatDetailScreen } from "../screens/CatDetailScreen";
import { ActivityFeedScreen } from "../screens/ActivityFeedScreen";
import { CollectionScreen } from "../screens/CollectionScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { BugReportScreen } from "../screens/BugReportScreen";
import { BadgesScreen } from "../screens/BadgesScreen";
import { QuestsScreen } from "../screens/QuestsScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { PublicProfileScreen } from "../screens/PublicProfileScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { UsernameSetupScreen } from "../screens/UsernameSetupScreen";

const AUTH_SETUP_KEY = "auth_setup_complete";
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HomeMap: "🗺️",
    Capture: "📸",
    Activity: "🐱",
    Collection: "📚",
    Quests: "🎯",
    Profile: "👤",
  };
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {icons[label] || "📍"}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen
        name="HomeMap"
        component={HomeMapScreen}
        options={{ tabBarLabel: "Carte" }}
      />
      <Tab.Screen
        name="Capture"
        component={CaptureCatScreen}
        options={{ tabBarLabel: "Capturer" }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityFeedScreen}
        options={{ tabBarLabel: "Activité" }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{ tabBarLabel: "Chatlas" }}
      />
      <Tab.Screen
        name="Quests"
        component={QuestsScreen}
        options={{ tabBarLabel: "Quêtes" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profil" }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { authReady, user, onSignOut } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [authSetupDone, setAuthSetupDone] = useState(false);
  const [checkingAuthSetup, setCheckingAuthSetup] = useState(true);

  const mode = getMode();

  useEffect(() => {
    LocalStorage.getUsername().then((name) => {
      setUsername(name);
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    if (mode === "firebase") {
      const unsubscribe = onSignOut(() => {
        setAuthSetupDone(false);
        setUsername(null);
        LocalStorage.getUsername().then((name) => setUsername(name || null));
      });
      return unsubscribe;
    }
  }, [mode, onSignOut]);

  useEffect(() => {
    if (mode === "firebase") {
      LocalStorage.getRaw(AUTH_SETUP_KEY).then((val) => {
        setAuthSetupDone(val === "true");
        setCheckingAuthSetup(false);
      });
    } else {
      setCheckingAuthSetup(false);
    }
  }, [mode]);

  const handleAuthComplete = async () => {
    await LocalStorage.setRaw(AUTH_SETUP_KEY, "true");
    setAuthSetupDone(true);
  };

  // Auto-complete auth setup if user is logged in (Google/Apple OAuth)
  useEffect(() => {
    if (mode === "firebase" && user && !authSetupDone && !checkingAuthSetup) {
      setAuthSetupDone(true);
    }
  }, [user, authSetupDone, mode, checkingAuthSetup]);

  // Rafraîchir le pseudo quand l'utilisateur se reconnecte
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  if ((mode === "firebase" && (!authReady || checkingAuthSetup)) || checking) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🐱</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (mode === "firebase" && !authSetupDone) {
    return <AuthScreen onAuthComplete={handleAuthComplete} />;
  }

  if (mode === "firebase" && !user) {
    return <AuthScreen onAuthComplete={handleAuthComplete} />;
  }

  if (!username) {
    return (
      <UsernameSetupScreen
        onComplete={async (name) => {
          setUsername(name);
          if (mode === "firebase") {
            try {
              const { updateDoc, doc } = await import("firebase/firestore");
              const { db: fbDb } = await import("../services/firebase");
              const { auth: fbAuth } = await import("../services/firebase");
              if (fbAuth?.currentUser) {
                await updateDoc(doc(fbDb!, "profiles", fbAuth.currentUser.uid), {
                  username: name,
                });
              }
            } catch {}
          }
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CatDetail"
          component={CatDetailScreen}
          options={{ title: "Fiche Chat" }}
        />
        <Stack.Screen
          name="CaptureCat"
          component={CaptureCatScreen}
          options={{ title: "Capturer un Chat" }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: "Classement" }}
        />
        <Stack.Screen
          name="BugReport"
          component={BugReportScreen}
          options={{ title: "Signaler un bug" }}
        />
        <Stack.Screen
          name="Badges"
          component={BadgesScreen}
          options={{ title: "Tous les badges" }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: "Statistiques" }}
        />
        <Stack.Screen
          name="Quests"
          component={QuestsScreen}
          options={{ title: "Quêtes" }}
        />
        <Stack.Screen
          name="PublicProfile"
          component={PublicProfileScreen}
          options={{ title: "Profil" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  splashEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    height: 85,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
});
