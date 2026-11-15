import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/types/roadmap";
import { SEED_PROFILES, SEED_ROLES } from "@/lib/seed/data";

/**
 * Writes the role catalog and demo profiles. Safe to run more than once: catalog documents are
 * overwritten, profiles are merged, and students' saved roles are left alone.
 */
export async function seedDatabase(db: Firestore): Promise<{ roles: number; profiles: number }> {
  const batch = db.batch();
  for (const [id, role] of Object.entries(SEED_ROLES)) {
    batch.set(db.collection(COLLECTIONS.roles).doc(id), role);
  }
  for (const [id, profile] of Object.entries(SEED_PROFILES)) {
    batch.set(
      db.collection(COLLECTIONS.users).doc(id),
      { ...profile, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
  await batch.commit();

  // createdAt is set only the first time a profile is seeded.
  for (const id of Object.keys(SEED_PROFILES)) {
    const ref = db.collection(COLLECTIONS.users).doc(id);
    const snap = await ref.get();
    if (!snap.get("createdAt")) await ref.update({ createdAt: FieldValue.serverTimestamp() });
  }
  return { roles: Object.keys(SEED_ROLES).length, profiles: Object.keys(SEED_PROFILES).length };
}
