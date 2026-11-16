/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, setLogLevel } from "firebase/firestore";
import { EMULATOR_HOST } from "@/tests/helpers/firestoreEmulator";

// Checks firestore.rules: students reach only their own data and the catalog is read-only.
let env: RulesTestEnvironment;
// The denied writes below are expected; keep the SDK from printing each one as a warning.
setLogLevel("error");
const [host, port] = EMULATOR_HOST!.split(":");

const savedRole = (roleId: string) => ({
  roleId,
  roleTitle: "Data Analyst",
  targetTerm: "Fall 2030",
  note: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: `demo-rules-${Date.now()}`,
    firestore: { host, port: Number(port), rules: readFileSync("firestore.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "roles/data-analyst"), { title: "Data Analyst", field: "Data", medianPay: 1, requiredDegree: "BS" });
    await setDoc(doc(ctx.firestore(), "users/bob/savedRoles/data-analyst"), savedRole("data-analyst"));
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("firestore.rules", () => {
  it("lets a student create, read and delete their own saved role", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const ref = doc(db, "users/alice/savedRoles/data-analyst");
    await assertSucceeds(setDoc(ref, savedRole("data-analyst")));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(deleteDoc(ref));
  });

  it("blocks a student from reading or writing another student's data", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(db, "users/bob/savedRoles/data-analyst")));
    await assertFails(setDoc(doc(db, "users/bob/savedRoles/ux-designer"), savedRole("ux-designer")));
    await assertFails(getDoc(doc(db, "users/bob")));
  });

  it("blocks signed-out access", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/bob/savedRoles/data-analyst")));
    await assertFails(getDoc(doc(db, "roles/data-analyst")));
  });

  it("rejects saved roles with extra fields, a mismatched id or a long note", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "users/alice/savedRoles/data-analyst"), { ...savedRole("data-analyst"), admin: true }));
    await assertFails(setDoc(doc(db, "users/alice/savedRoles/ux-designer"), savedRole("data-analyst")));
    await assertFails(setDoc(doc(db, "users/alice/savedRoles/data-analyst"), { ...savedRole("data-analyst"), note: "x".repeat(281) }));
  });

  it("lets signed-in students read the role catalog but not change it", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(db, "roles/data-analyst")));
    await assertFails(setDoc(doc(db, "roles/data-analyst"), { title: "Hacked" }));
  });
});
