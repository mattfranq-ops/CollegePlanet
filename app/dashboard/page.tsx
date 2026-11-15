import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SavedRoles from "@/components/savedRoles";
import { repositories } from "@/lib/repositories";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { CareerRole, SavedRole } from "@/types/roadmap";

// Saved roles come from Firestore on every visit, so never serve a cached copy.
export const dynamic = "force-dynamic";

async function loadRoadmapData(userId: string): Promise<{ roles: CareerRole[]; savedRoles: SavedRole[]; loadError?: string }> {
  try {
    const repos = repositories();
    const [roles, savedRoles] = await Promise.all([repos.roles.listRoles(), repos.savedRoles.listSavedRoles(userId)]);
    if (roles.length === 0) {
      return { roles, savedRoles, loadError: "The career role list is empty. Run npm run seed to load it." };
    }
    return { roles, savedRoles };
  } catch (err) {
    console.error("Dashboard could not load Firestore data:", err);
    return { roles: [], savedRoles: [], loadError: "We couldn't load your saved roles. Check that the database is running, then refresh." };
  }
}

export default async function DashboardPage() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/");

  const { roles, savedRoles, loadError } = await loadRoadmapData(session.sub);

  return (
    <main className="dashboard">
      <header>
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome, {session.name}</h1>
          <p>{session.major} · @{session.username}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="secondary">Log out</button>
        </form>
      </header>
      <SavedRoles roles={roles} initialSavedRoles={savedRoles} loadError={loadError} />
    </main>
  );
}
