import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Tests always use the local emulator, never the real database.
// `npm test` starts the emulator and sets these; the defaults cover `npm run test:jest`
// while `npm run emulators` is already running in another terminal.
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8085";
process.env.FIREBASE_PROJECT_ID ??= process.env.GCLOUD_PROJECT ?? "collegeplanet-2e87a";

export const TEST_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
export const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;

let counter = 0;

/** A separate Admin app and Firestore client, like a fresh server process. */
export function openTestDb(name = `test-${process.pid}-${Date.now()}-${counter++}`): { app: App; db: Firestore; close: () => Promise<void> } {
  const app = initializeApp({ projectId: TEST_PROJECT_ID }, name);
  const db = getFirestore(app);
  return { app, db, close: () => deleteApp(app) };
}

/** A user id no other test uses, so tests can run in parallel without clearing the database. */
export function uniqueUserId(label: string): string {
  return `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
