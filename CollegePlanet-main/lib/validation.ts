import type { LoginRequest } from "@/types/auth";

// Shared by the login form (browser) and the login API (server), so it must not import server-only code.
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

/** Checks the shape of the login form before any lookup. Returns an error message, or null when valid. */
export function validateLoginInput(input: Partial<LoginRequest>): string | null {
  const username = (input.username ?? "").trim();
  const password = input.password ?? "";
  if (!username && !password) return "Enter your username and password.";
  if (!username) return "Enter your username.";
  if (!password) return "Enter your password.";
  if (!USERNAME_PATTERN.test(username)) return "Usernames are 3 to 32 letters, numbers, dots, dashes or underscores.";
  if (password.length < 8) return "Passwords are at least 8 characters.";
  return null;
}
