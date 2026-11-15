/**
 * Seeds Firestore with the career role catalog and the demo student profiles.
 *
 *   npm run seed            seeds the local emulator (FIRESTORE_EMULATOR_HOST from .env)
 *   npm run seed -- --prod  seeds the real database (needs GOOGLE_APPLICATION_CREDENTIALS)
 */
import { getDb, projectId } from "@/lib/firebase/admin";
import { seedDatabase } from "@/lib/seed/seed";

async function main() {
  const prod = process.argv.includes("--prod");
  if (!prod && !process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("FIRESTORE_EMULATOR_HOST is not set. Start the emulator and check .env, or pass --prod to seed the real database.");
    process.exit(1);
  }
  if (prod) delete process.env.FIRESTORE_EMULATOR_HOST;

  const target = prod ? `project ${projectId()}` : `emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`;
  const { roles, profiles } = await seedDatabase(getDb());
  console.log(`Seeded ${roles} roles and ${profiles} student profiles into the ${target}.`);
}

main().catch((err) => {
  console.error("Seeding failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
