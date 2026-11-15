import { getDb } from "@/lib/firebase/admin";
import { RoleCatalogRepository } from "@/lib/repositories/roleCatalogRepository";
import { SavedRoleRepository } from "@/lib/repositories/savedRoleRepository";

export { RepositoryError } from "@/lib/repositories/errors";
export { RoleCatalogRepository, SavedRoleRepository };

/** Repositories wired to the app's Firestore client. API routes use these. */
export function repositories() {
  const db = getDb();
  return {
    roles: new RoleCatalogRepository(db),
    savedRoles: new SavedRoleRepository(db),
  };
}
