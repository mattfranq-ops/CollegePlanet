"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validateLoginInput } from "@/lib/validation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateLoginInput({ username, password });
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Sign-in failed. Try again.");
        return;
      }
      router.push(data.redirectTo ?? "/dashboard");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUncc() {
    const res = await fetch("/api/auth/uncc");
    const data = await res.json();
    setError(data.error);
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate aria-label="Student login">
      <h2>Student login</h2>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        aria-invalid={Boolean(error)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={Boolean(error)}
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Log in"}
      </button>

      <div className="divider"><span>or</span></div>

      <button type="button" className="secondary" onClick={handleUncc}>
        Sign in with UNCC account
      </button>
    </form>
  );
}
