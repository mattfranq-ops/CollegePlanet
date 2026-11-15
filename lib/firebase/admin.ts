import { getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * One Firebase Admin app and Firestore client for the whole server.
 *
 * - With FIRESTORE_EMULATOR_HOST set (local development and tests), the Admin SDK talks
 *   to the emulator and needs no credentials.
 * - Without it, the SDK uses GOOGLE_APPLICATION_CREDENTIALS (a service account key kept
 *   outside the repo) to reach the real database.
 *
 * Only server code may import this file. Never import it from a "use client" component.
 */
let app: App | undefined;
let db: Firestore | undefined;

export function projectId(): string {
  const id = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
  if (!id) throw new Error("FIREBASE_PROJECT_ID is not set. Copy .env.example to .env and fill it in.");
  return id;
}

export function getAdminApp(): App {
  if (app) return app;
  app =
    getApps()[0] ??
    initializeApp(
      process.env.FIRESTORE_EMULATOR_HOST
        ? { projectId: projectId() }
        : { projectId: projectId(), credential: applicationDefault() },
    );
  return app;
}

export function getDb(): Firestore {
  // getFirestore() returns the same client for the same app, so this is safe to call from
  // every API route. Do not call db.settings() here: Next.js bundles each route separately,
  // and a second settings() call on the shared client throws.
  db ??= getFirestore(getAdminApp());
  return db;
}
