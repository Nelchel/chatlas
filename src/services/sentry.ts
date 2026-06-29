import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!DSN) {
    console.warn("[Sentry] DSN non configuré — monitoring désactivé");
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? "development" : "production",
    release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
    dist: Constants.expoConfig?.version,
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    debug: __DEV__,
    beforeSend(event) {
      if (__DEV__) {
        console.log("[Sentry] Event capturé :", event.event_id);
      }
      return event;
    },
  });
}

export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  isAnonymous?: boolean;
} | null) {
  if (!DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      data: {
        isAnonymous: user.isAnonymous ?? false,
      },
    });
  } else {
    Sentry.setUser(null);
  }
}

export { Sentry };
