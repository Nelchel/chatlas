import * as Sentry from "@sentry/react-native";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { initSentry } from "./src/services/sentry";

initSentry();

function AppContent() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default Sentry.wrap(AppContent);
