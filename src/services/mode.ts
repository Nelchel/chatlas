export type AppMode = "firebase" | "local";

export function getMode(): AppMode {
  if (
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return "firebase";
  }
  return "local";
}
