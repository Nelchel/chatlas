import { useState, useEffect, useCallback, useRef } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { getMode } from "../services/mode";
import { LocalStorage } from "../services/storage";
import { authService, SignInResult } from "../services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { AuthProvider, UserProfile } from "../types";
import { setSentryUser } from "../services/sentry";

export type AppUser = {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  auth_provider: AuthProvider;
  emailVerified?: boolean;
  is_admin?: boolean;
} | null;

const signOutListeners: Set<() => void> = new Set();

export function useAuth() {
  const [user, setUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const prevUserId = useRef<string | null>(null);

  const mode = getMode();

  const buildAppUser = useCallback(
    async (firebaseUser: FirebaseUser): Promise<AppUser> => {
      const stored = await LocalStorage.getUsername();

      let username = stored || "";
      let email = firebaseUser.email || undefined;
      let avatar_url = firebaseUser.photoURL || undefined;
      let auth_provider: AuthProvider = "anonymous";

      let is_admin = false;
      try {
        const profileRef = doc(db!, "profiles", firebaseUser.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const p = snap.data() as UserProfile;
          username = p.username || username;
          email = p.email || email;
          avatar_url = p.avatar_url || avatar_url;
          auth_provider = p.auth_provider || "anonymous";
          is_admin = p.is_admin || false;
        }
      } catch {
        // profile pas encore créé, valeurs par défaut
      }

      if (username && username !== (stored || "")) {
        await LocalStorage.setUsername(username);
      }

      return {
        id: firebaseUser.uid,
        username: username || `Chatlasien·ne ${firebaseUser.uid.slice(0, 6)}`,
        email,
        avatar_url,
        auth_provider,
        emailVerified: firebaseUser.emailVerified,
        is_admin,
      };
    },
    [],
  );

  useEffect(() => {
    if (mode === "firebase" && auth) {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            const appUser = await buildAppUser(firebaseUser);
            setUser(appUser);
          } else {
            setUser(null);
          }
          setAuthReady(true);
          setLoading(false);
        },
      );
      return unsubscribe;
    }
    initLocalUser();
  }, [mode, buildAppUser]);

  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      setSentryUser({
        id: user.id,
        email: user.email,
        username: user.username,
        isAnonymous: user.auth_provider === "anonymous",
      });
      prevUserId.current = user.id;
    } else if (!user && prevUserId.current !== null) {
      setSentryUser(null);
      prevUserId.current = null;
    }
  }, [user]);

  async function initLocalUser() {
    try {
      const stored = await LocalStorage.getUsername();
      setUser({
        id: "mock_user",
        username: stored || "CatExplorer",
        auth_provider: "anonymous",
      });
    } catch {
      setUser({ id: "mock_user", username: "CatExplorer", auth_provider: "anonymous" });
    } finally {
      setAuthReady(true);
      setLoading(false);
    }
  }

  async function signOut() {
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    setUser(null);
    if (auth) {
      await firebaseSignOut(auth).catch(() => {});
    }
    await LocalStorage.clearUserData();
    await LocalStorage.setRaw("auth_setup_complete", "false").catch(() => {});
    await LocalStorage.setUsername("").catch(() => {});
    signOutListeners.forEach((cb) => cb());
  }

  function onSignOut(callback: () => void) {
    signOutListeners.add(callback);
    return () => { signOutListeners.delete(callback); };
  }

  async function updateUsername(name: string) {
    await LocalStorage.setUsername(name);
    if (user) {
      setUser({ ...user, username: name });
    }

    if (mode === "firebase" && auth?.currentUser) {
      try {
        const { updateDoc, doc } = await import("firebase/firestore");
        await updateDoc(doc(db!, "profiles", auth.currentUser.uid), {
          username: name,
        });
      } catch {
        // échec silencieux
      }
    }
  }

  const handleSignInResult = useCallback(
    async (result: SignInResult) => {
      await LocalStorage.clearUserData();
      const appUser = await buildAppUser(result.user);
      setUser(appUser);
      return appUser;
    },
    [buildAppUser],
  );

  return {
    user,
    loading,
    authReady,
    signOut,
    onSignOut,
    updateUsername,
    authService,
    handleSignInResult,
  };
}
