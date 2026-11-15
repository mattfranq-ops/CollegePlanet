import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CampusHero from "@/components/campusHero";
import LoginForm from "@/components/loginForm";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export default async function LoginPage() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (session) redirect("/dashboard");

  return (
    <main className="login-page">
      <CampusHero />
      <LoginForm />
    </main>
  );
}
