import * as firebaseAdminSdk from "firebase-admin";
import { cert, getApps, initializeApp } from "firebase-admin";

type AuthApi = {
  verifyIdToken(token: string): Promise<{ uid: string; email?: string; [key: string]: unknown }>;
  getUser(uid: string): Promise<{ uid: string; email?: string; [key: string]: unknown }>;
};
type FirebaseAdminWithAuth = typeof firebaseAdminSdk & { getAuth: () => AuthApi };

const adminWithAuth = firebaseAdminSdk as unknown as FirebaseAdminWithAuth;

/** Initialize Firebase Admin from deployment credentials, never from hardcoded identities. */
export function customInitApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return initializeApp();
}

export function getAuth(): AuthApi {
  customInitApp();
  return adminWithAuth.getAuth();
}

export const firebaseAdmin = { customInitApp, getAuth };
export default firebaseAdmin;
