import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList, TabParamList } from "../types";
import { colors, spacing } from "../constants/theme";
import { LocalStorage } from "../services/storage";
import { getMode } from "../services/mode";
import { useAuth } from "../hooks/useAuth";

import { HomeMapScreen } from "../screens/HomeMapScreen";
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
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { UsernameSetupScreen } from "../screens/UsernameSetupScreen";

import {
  Map,
  CalendarCheck,
  Search,
  ScrollText,
  UserRound,
  PawPrint,
} from "lucide-react-native";

const AUTH_SETUP_KEY = "auth_setup_complete";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const iconComponents: Record<string, any> = {
  HomeMap: Map,
  Activity: CalendarCheck,
  Collection: Search,
  Quests: ScrollText,
  Profile: UserRound,
};

const tabLabels: Record<string, string> = {
  HomeMap: "Carte",
  Activity: "Activité",
  Collection: "Chatlas",
  Quests: "Quêtes",
  Profile: "Profil",
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBarContainer}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const IconComponent = iconComponents[route.name];
            const label = tabLabels[route.name];

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
                <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    testID={options.tabBarTestID}
                    onPress={onPress}
                    activeOpacity={0.85}
                    style={styles.tabButton}
                >
                  <View
                      style={
                        isFocused ? styles.activeTabInner : styles.inactiveTabInner
                      }
                  >
                    {isFocused ? (
                        <PawPrint
                            size={21}
                            color="#E7C16A"
                            strokeWidth={2.4}
                        />
                    ) : (
                        <IconComponent
                            size={24}
                            color="#4D463C"
                            strokeWidth={2}
                        />
                    )}

                    <Text
                        style={isFocused ? styles.activeLabel : styles.inactiveLabel}
                        numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </View>
                </TouchableOpacity>
            );
          })}
        </View>
      </View>
  );
}

function MainTabs() {
  return (
      <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
      >
        <Tab.Screen name="HomeMap" component={HomeMapScreen} />
        <Tab.Screen name="Activity" component={ActivityFeedScreen} />
        <Tab.Screen name="Collection" component={CollectionScreen} />
        <Tab.Screen name="Quests" component={QuestsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { authReady, user, onSignOut } = useAuth();

  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [authSetupDone, setAuthSetupDone] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
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

  useEffect(() => {
    if (mode === "firebase" && user && !authSetupDone && !checkingAuthSetup) {
      setAuthSetupDone(true);
    }
  }, [user, authSetupDone, checkingAuthSetup, mode]);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user]);

  if ((mode === "firebase" && (!authReady || checkingAuthSetup)) || checking) {
    return (
        <View style={styles.splash}>
          <Text style={styles.splashEmoji}>🐱</Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
  }

  if (mode === "firebase" && !welcomeDone && (!authSetupDone || !user)) {
    return <WelcomeScreen onContinue={() => setWelcomeDone(true)} />;
  }

  if (mode === "firebase" && (!authSetupDone || !user)) {
    return <AuthScreen onAuthComplete={handleAuthComplete} />;
  }

  if (!username) {
    return (
        <UsernameSetupScreen
            onComplete={async (name) => {
              setUsername(name);
            }}
        />
    );
  }

  return (
      <NavigationContainer>
        <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.text,
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
              options={{ title: "Badges" }}
          />

          <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{ title: "Statistiques" }}
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

  tabBarWrapper: {
    backgroundColor: "transparent",
  },
  tabBarContainer: {
    height: 92,
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 14,

    backgroundColor: "#F8F0DC",

    borderTopWidth: 1,
    borderTopColor: "#DCCEB1",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 12,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  inactiveTabInner: {
    width: 60,
    height: 60,

    alignItems: "center",
    justifyContent: "center",
  },

  inactiveLabel: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 16,
    color: "#3F382E",
    fontFamily: "CormorantGaramond_700Bold",
    textAlign: "center",
  },
  activeTabInner: {
    width: 52,
    height: 60,

    borderRadius: 26,

    backgroundColor: "#355C3C",

    alignItems: "center",
    justifyContent: "center",

    transform: [{ translateY: -6 }],

    shadowColor: "#243922",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },
  activeLabel: {
    marginTop: 4,

    color: "#FFF7E8",

    fontSize: 13,

    fontFamily: "CormorantGaramond_700Bold",
  },
});
