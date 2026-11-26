import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

const firebaseApiKey =
  (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || '';
const firebaseAuthDomain =
  (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() || '';

export const isFirebaseGoogleBridgeConfigured =
  Boolean(firebaseApiKey) && Boolean(firebaseAuthDomain);

/**
 * Opens the official Google Sign-In popup via Firebase Auth (Spark Plan — $0, no GCP console needed),
 * extracts the cryptographically signed Google OIDC `idToken`, and returns it so Supabase Auth
 * (`supabase.auth.signInWithIdToken`) can establish the real PostgreSQL session.
 */
export async function requestGoogleIdTokenViaFirebase(): Promise<{
  idToken?: string;
  error?: string;
}> {
  if (!isFirebaseGoogleBridgeConfigured) {
    return { error: 'Firebase Google bridge is not configured.' };
  }

  try {
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            apiKey: firebaseApiKey,
            authDomain: firebaseAuthDomain,
          });

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential?.idToken || undefined;

    // Clear ephemeral Firebase auth state; Supabase owns the real session
    await firebaseSignOut(auth).catch(() => {});

    if (!idToken) {
      return { error: 'Google did not return an ID token.' };
    }
    return { idToken };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Google sign-in popup was closed or failed.';
    return { error: msg };
  }
}
