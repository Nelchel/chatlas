import { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential, linkWithCredential } from "firebase/auth";
import { auth } from "../services/firebase";
import { authService } from "../services/authService";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const clientId = process.env.EXPO_PUBLIC_FIREBASE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      console.warn("Google Sign-In désactivé : EXPO_PUBLIC_FIREBASE_CLIENT_ID manquant");
      setError("Configuration Google manquante");
      return;
    }
    async function configureGoogle() {
      try {
        const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
        GoogleSignin.configure({
          webClientId: clientId,
          iosClientId: process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID || undefined,
          scopes: ["openid", "profile", "email"],
        });
        console.log("✅ Google Sign-In natif configuré");
        setIsConfigured(true);
      } catch (e: any) {
        console.warn("Google Sign-In natif non disponible (Expo Go ?):", e.message);
        setError("Google Sign-In natif indisponible. Utilise un build de développement.");
      }
    }
    configureGoogle();
  }, [clientId]);

  const signIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
      
      // Vérifier si Google Play Services sont disponibles
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error("Pas de token Google reçu");
      }
      
      // Auth Firebase
      await authService.signInWithGoogleIdToken(idToken);
      
    } catch (e: any) {
      if (e.code === "SIGN_IN_CANCELLED") {
        console.log("Google Sign-In annulé");
      } else {
        console.error("Erreur Google Sign-In:", e);
        setError(e.message || "Connexion Google échouée");
      }
    } finally {
      setBusy(false);
    }
  };

  return { signIn, busy, error, disabled: !isConfigured };
}

export async function signInWithAppleNative() {
  try {
    const AppleAuthentication = await import("expo-apple-authentication");
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken } = appleCredential;
    if (!identityToken) {
      throw new Error("Pas de token Apple reçu");
    }

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({ idToken: identityToken });

    if (auth) {
      const cred = auth.currentUser?.isAnonymous
        ? await linkWithCredential(auth.currentUser, credential)
        : await signInWithCredential(auth, credential);
      await authService.signInWithAppleIdToken(identityToken);
      return cred.user;
    }
  } catch (e: any) {
    if (e.code === "ERR_CANCELED") {
      return null;
    }
    throw e;
  }
}
