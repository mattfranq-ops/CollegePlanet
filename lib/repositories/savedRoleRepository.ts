import { FieldValue, Timestamp, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { validateSaveRoleInput, validateUpdateSavedRoleInput } from "@/lib/roadmapValidation";
import { RepositoryError } from "@/lib/repositories/errors";
import {
  COLLECTIONS,
  type CareerRoleDoc,
  type SavedRole,
  type SavedRoleDoc,
  type UserProfileDoc,
} from "@/types/roadmap";

/** Who is saving: the signed-in student from the session cookie. */
export interface StudentRef {
  id: string;
  username: string;
  name: string;
  major: string;
  email?: string;
}

function toIso(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : new Date(0).toISOString();
}

export function toSavedRole(doc: SavedRoleDoc): SavedRole {
  return {
    roleId: doc.roleId,
    roleTitle: doc.roleTitle,
    targetTerm: doc.targetTerm,
    note: doc.note,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/**
 * Data access for user story #3: a student saves target roles to come back to.
 * Stored at users/{userId}/savedRoles/{roleId}.
 *
 * Every method takes the signed-in student's id from the session (never from the request body),
 * so a student can only reach their own saved roles.
 */
export class SavedRoleRepository {
  constructor(private readonly db: Firestore) {}

  private userRef(userId: string): DocumentReference {
    if (!userId) throw new RepositoryError("invalid-input", "You need to be signed in.");
    return this.db.collection(COLLECTIONS.users).doc(userId);
  }

  private savedRoleRef(userId: string, roleId: string): DocumentReference {
    return this.userRef(userId).collection(COLLECTIONS.savedRoles).doc(roleId);
  }

  /** The student's saved roles, oldest first. */
  async listSavedRoles(userId: string): Promise<SavedRole[]> {
    const snap = await this.userRef(userId).collection(COLLECTIONS.savedRoles).orderBy("createdAt", "asc").get();
    return snap.docs.map((d) => toSavedRole(d.data() as SavedRoleDoc));
  }

  /**
   * Saves a target role. Fails with invalid-input for bad fields or an unknown role,
   * and already-exists if the student saved this role before.
   * Also creates the student's profile document the first time.
   */
  async saveRole(student: StudentRef, input: unknown): Promise<SavedRole> {
    const checked = validateSaveRoleInput(input);
    if (!checked.ok) throw new RepositoryError("invalid-input", "Check the highlighted fields.", checked.errors);
    const { roleId, targetTerm, note } = checked.value;

    const userRef = this.userRef(student.id);
    const savedRef = this.savedRoleRef(student.id, roleId);
    const roleRef = this.db.collection(COLLECTIONS.roles).doc(roleId);

    await this.db.runTransaction(async (tx) => {
      const [roleSnap, savedSnap, userSnap] = await Promise.all([tx.get(roleRef), tx.get(savedRef), tx.get(userRef)]);
      if (!roleSnap.exists) {
        throw new RepositoryError("invalid-input", "Check the highlighted fields.", { roleId: "That career role isn't in the catalog." });
      }
      if (savedSnap.exists) {
        throw new RepositoryError("already-exists", `You already saved ${(roleSnap.data() as CareerRoleDoc).title}.`);
      }

      const now = FieldValue.serverTimestamp();
      if (!userSnap.exists) {
        const profile: Omit<UserProfileDoc, "createdAt" | "updatedAt"> & { createdAt: FieldValue; updatedAt: FieldValue } = {
          username: student.username,
          name: student.name,
          email: student.email ?? "",
          major: student.major,
          createdAt: now,
          updatedAt: now,
        };
        tx.set(userRef, profile);
      }
      tx.create(savedRef, {
        roleId,
        roleTitle: (roleSnap.data() as CareerRoleDoc).title,
        targetTerm,
        note,
        createdAt: now,
        updatedAt: now,
      });
    });

    return this.getSavedRoleOrThrow(student.id, roleId);
  }

  /** Changes the target term and/or note of a role the student saved. */
  async updateSavedRole(userId: string, roleId: string, input: unknown): Promise<SavedRole> {
    const checked = validateUpdateSavedRoleInput(input);
    if (!checked.ok) throw new RepositoryError("invalid-input", "Check the highlighted fields.", checked.errors);

    const ref = this.savedRoleRef(userId, roleId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new RepositoryError("not-found", "That saved role no longer exists.");
      tx.update(ref, { ...checked.value, updatedAt: FieldValue.serverTimestamp() });
    });
    return this.getSavedRoleOrThrow(userId, roleId);
  }

  /** Removes a saved role. */
  async removeSavedRole(userId: string, roleId: string): Promise<void> {
    const ref = this.savedRoleRef(userId, roleId);
    const snap = await ref.get();
    if (!snap.exists) throw new RepositoryError("not-found", "That saved role no longer exists.");
    await ref.delete();
  }

  private async getSavedRoleOrThrow(userId: string, roleId: string): Promise<SavedRole> {
    const snap = await this.savedRoleRef(userId, roleId).get();
    if (!snap.exists) throw new RepositoryError("not-found", "That saved role no longer exists.");
    return toSavedRole(snap.data() as SavedRoleDoc);
  }
}
