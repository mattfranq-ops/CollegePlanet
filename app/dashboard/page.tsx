import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/");

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
      <section className="card">
        <h2>Your career roadmap</h2>
        <p>Choose a target role to build your roadmap. This arrives with issues #3 and #4.</p>
      </section>
    </main>
  );
}
