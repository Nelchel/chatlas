import * as Sentry from "@sentry/react-native";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { initSentry } from "./src/services/sentry";
import { useFonts } from "expo-font";
import {
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";

initSentry();

function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

const SentryApp = Sentry.wrap(App);

export default function AppWrapper() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <SentryApp />;
}
