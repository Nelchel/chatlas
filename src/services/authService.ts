import {
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification as sendFirebaseEmailVerification,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  OAuthProvider,
  EmailAuthProvider,
  signInWithCredential,
  linkWithCredential,
  unlink,
  reauthenticateWithCredential,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  deleteUser,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { AuthProvider, UserProfile } from "../types";
import { LocalStorage } from "./storage";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export type SignInResult = {
  user: FirebaseUser;
  isNew: boolean;
};

async function ensureProfile(
  firebaseUser: FirebaseUser,
  provider: AuthProvider,
  username?: string,
): Promise<UserProfile> {
  if (!db) {
    console.error("[auth] db is null, profile not synced");
    throw new Error("Firestore non initialisé");
  }

  try {
    const profileRef = doc(db, "profiles", firebaseUser.uid);
    const existing = await getDoc(profileRef);

    if (existing.exists()) {
      return existing.data() as UserProfile;
    }

    const storedUsername = (await LocalStorage.getUsername()) || username || "";
    const profile: UserProfile = {
      id: firebaseUser.uid,
      username: storedUsername || `Chatlasien·ne ${firebaseUser.uid.slice(0, 6)}`,
      email: firebaseUser.email || null,
      avatar_url: firebaseUser.photoURL || null,
      auth_provider: provider,
      total_cats: 0,
      total_sightings: 0,
      total_favorites: 0,
      badges: [],
      created_at: new Date().toISOString(),
    };

    await setDoc(profileRef, profile);
    console.log("[auth] Profile created for", firebaseUser.uid, profile.username);
    if (profile.username) {
      await LocalStorage.setUsername(profile.username);
    }
    return profile;
  } catch (err) {
    console.error("[auth] ensureProfile failed:", err);
    throw err;
  }
}

export const authService = {
  async signInAnonymously(): Promise<SignInResult> {
    if (!auth) throw new Error("Firebase non configuré");
    const cred = await firebaseSignInAnonymously(auth);
    await ensureProfile(cred.user, "anonymous");
    return { user: cred.user, isNew: true };
  },

  async signInWithEmail(email: string, password: string): Promise<SignInResult> {
    if (!auth) throw new Error("Firebase non configuré");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureProfile(cred.user, "email");
    return { user: cred.user, isNew: false };
  },

  async signUpWithEmail(
    email: string,
    password: string,
    username?: string,
  ): Promise<SignInResult> {
    if (!auth) throw new Error("Firebase non configuré");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (username) {
      await firebaseUpdateProfile(cred.user, { displayName: username });
    }
    await LocalStorage.setUsername("");
    await ensureProfile(cred.user, "email", username);
    await sendFirebaseEmailVerification(cred.user, {
      url: `https://${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "cat-quest.app"}/auth/verify`,
      handleCodeInApp: false,
    });
    return { user: cred.user, isNew: true };
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (!auth) throw new Error("Firebase non configuré");
    await sendPasswordResetEmail(auth, email);
  },

  async sendEmailVerification(user: FirebaseUser): Promise<void> {
    if (!auth) throw new Error("Firebase non configuré");
    await sendFirebaseEmailVerification(user, {
      url: `https://${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "cat-quest.app"}/auth/verify`,
      handleCodeInApp: false,
    });
  },

  async checkEmailVerification(user: FirebaseUser): Promise<boolean> {
    await user.reload();
    return user.emailVerified;
  },

  async reauthenticateWithPassword(user: FirebaseUser, password: string): Promise<void> {
    if (!user.email) throw new Error("Aucun email pour ré-authentification");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  },

  async changePassword(user: FirebaseUser, currentPassword: string, newPassword: string): Promise<void> {
    await authService.reauthenticateWithPassword(user, currentPassword);
    await firebaseUpdatePassword(user, newPassword);
  },

  async signInWithGoogleIdToken(idToken: string): Promise<SignInResult> {
    if (!auth) throw new Error("Firebase non configuré");
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = auth.currentUser?.isAnonymous
      ? await linkWithCredential(auth.currentUser, credential)
      : await signInWithCredential(auth, credential);
    await ensureProfile(cred.user, "google");
    return { user: cred.user, isNew: false };
  },

  async signInWithAppleIdToken(idToken: string): Promise<SignInResult> {
    if (!auth) throw new Error("Firebase non configuré");
    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({ idToken });
    const cred = auth.currentUser?.isAnonymous
      ? await linkWithCredential(auth.currentUser, credential)
      : await signInWithCredential(auth, credential);
    await ensureProfile(cred.user, "apple");
    return { user: cred.user, isNew: false };
  },

  async linkGoogleAccount(user: FirebaseUser, idToken: string): Promise<void> {
    if (!auth) throw new Error("Firebase non configuré");
    const credential = GoogleAuthProvider.credential(idToken);
    await linkWithCredential(user, credential);
  },

  async linkAppleAccount(user: FirebaseUser, idToken: string): Promise<void> {
    if (!auth) throw new Error("Firebase non configuré");
    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({ idToken });
    await linkWithCredential(user, credential);
  },

  async linkEmailAccount(user: FirebaseUser, email: string, password: string): Promise<void> {
    if (!auth) throw new Error("Firebase non configuré");
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
    await updateDoc(doc(db!, "profiles", user.uid), { auth_provider: "email" });
  },

  async unlinkProvider(user: FirebaseUser, providerId: string): Promise<void> {
    await unlink(user, providerId);
  },

  async deleteAccount(user: FirebaseUser): Promise<void> {
    const uid = user.uid;
    try {
      await deleteDoc(doc(db!, "profiles", uid));
    } catch {
      // ignore
    }
    await deleteUser(user);
  },
};

