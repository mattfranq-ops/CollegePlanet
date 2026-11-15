import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS, type CareerRole, type CareerRoleDoc } from "@/types/roadmap";

/** Reads the career role catalog (roles/{roleId}). The seed script writes it. */
export class RoleCatalogRepository {
  constructor(private readonly db: Firestore) {}

  async listRoles(): Promise<CareerRole[]> {
    const snap = await this.db.collection(COLLECTIONS.roles).orderBy("title").get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CareerRoleDoc) }));
  }

  async getRole(roleId: string): Promise<CareerRole | null> {
    const snap = await this.db.collection(COLLECTIONS.roles).doc(roleId).get();
    return snap.exists ? { id: snap.id, ...(snap.data() as CareerRoleDoc) } : null;
  }
}
