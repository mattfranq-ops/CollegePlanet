/**
 * @jest-environment node
 */
import { openTestDb, uniqueUserId } from "@/tests/helpers/firestoreEmulator";
import { RepositoryError } from "@/lib/repositories/errors";
import { SavedRoleRepository } from "@/lib/repositories/savedRoleRepository";
import { RoleCatalogRepository } from "@/lib/repositories/roleCatalogRepository";
import { seedDatabase } from "@/lib/seed/seed";
import { NOTE_MAX_LENGTH } from "@/types/roadmap";

// Integration tests for issue #3 against the Firestore emulator (no mocks).
const conn = openTestDb();
const repo = new SavedRoleRepository(conn.db);
const catalog = new RoleCatalogRepository(conn.db);

const student = (id: string) => ({ id, username: "jalvarez", name: "Jordan Alvarez", major: "Information Systems", email: "j@charlotte.edu" });
const nextYear = new Date().getFullYear() + 1;

beforeAll(async () => {
  await seedDatabase(conn.db);
});

afterAll(async () => {
  await conn.close();
});

describe("Issue #3: seed data", () => {
  it("loads the 10 career roles into the catalog", async () => {
    const roles = await catalog.listRoles();
    expect(roles).toHaveLength(10);
    expect(roles.map((r) => r.id)).toContain("data-analyst");
  });
});

describe("Issue #3: save a target role (success)", () => {
  it("writes the saved role and the student's profile to Firestore", async () => {
    const userId = uniqueUserId("save");
    const saved = await repo.saveRole(student(userId), { roleId: "data-analyst", targetTerm: `Fall ${nextYear}`, note: "  Need PL-300  " });

    expect(saved).toMatchObject({ roleId: "data-analyst", roleTitle: "Data Analyst", targetTerm: `Fall ${nextYear}`, note: "Need PL-300" });

    // Read the raw documents back to prove they are stored, not just returned.
    const doc = await conn.db.doc(`users/${userId}/savedRoles/data-analyst`).get();
    expect(doc.exists).toBe(true);
    expect(doc.data()).toMatchObject({ roleId: "data-analyst", roleTitle: "Data Analyst", note: "Need PL-300" });
    const profile = await conn.db.doc(`users/${userId}`).get();
    expect(profile.get("username")).toBe("jalvarez");

    expect(await repo.listSavedRoles(userId)).toEqual([saved]);
  });

  it("keeps the data after the server restarts (new Firestore client)", async () => {
    const userId = uniqueUserId("restart");
    await repo.saveRole(student(userId), { roleId: "ux-designer", targetTerm: `Spring ${nextYear}` });

    const restarted = openTestDb();
    try {
      const list = await new SavedRoleRepository(restarted.db).listSavedRoles(userId);
      expect(list.map((r) => r.roleId)).toEqual(["ux-designer"]);
    } finally {
      await restarted.close();
    }
  });

  it("updates the target term and note, then removes the role", async () => {
    const userId = uniqueUserId("update");
    await repo.saveRole(student(userId), { roleId: "accountant", targetTerm: `Fall ${nextYear}` });

    const updated = await repo.updateSavedRole(userId, "accountant", { targetTerm: `Spring ${nextYear + 1}`, note: "MAcc" });
    expect(updated).toMatchObject({ targetTerm: `Spring ${nextYear + 1}`, note: "MAcc" });

    await repo.removeSavedRole(userId, "accountant");
    expect(await repo.listSavedRoles(userId)).toEqual([]);
  });

  it("keeps each student's saved roles separate", async () => {
    const a = uniqueUserId("a");
    const b = uniqueUserId("b");
    await repo.saveRole(student(a), { roleId: "registered-nurse", targetTerm: `Fall ${nextYear}` });
    expect(await repo.listSavedRoles(b)).toEqual([]);
  });
});

describe("Issue #3: save a target role (invalid input)", () => {
  async function expectRejected(promise: Promise<unknown>, code: string) {
    await expect(promise).rejects.toBeInstanceOf(RepositoryError);
    await expect(promise).rejects.toMatchObject({ code });
  }

  it("rejects missing fields and writes nothing", async () => {
    const userId = uniqueUserId("invalid");
    const attempt = repo.saveRole(student(userId), { roleId: "", targetTerm: "" });
    await expectRejected(attempt, "invalid-input");
    await expect(attempt).rejects.toMatchObject({
      fieldErrors: { roleId: "Choose a career role.", targetTerm: "Choose the term you want to qualify by." },
    });
    const snap = await conn.db.collection(`users/${userId}/savedRoles`).get();
    expect(snap.empty).toBe(true);
  });

  it("rejects a past term, a malformed term and a note that is too long", async () => {
    const userId = uniqueUserId("invalid2");
    await expectRejected(repo.saveRole(student(userId), { roleId: "data-analyst", targetTerm: "Fall 2001" }), "invalid-input");
    await expectRejected(repo.saveRole(student(userId), { roleId: "data-analyst", targetTerm: "fall-27" }), "invalid-input");
    await expectRejected(
      repo.saveRole(student(userId), { roleId: "data-analyst", targetTerm: `Fall ${nextYear}`, note: "x".repeat(NOTE_MAX_LENGTH + 1) }),
      "invalid-input",
    );
  });

  it("rejects a role that is not in the catalog", async () => {
    const attempt = repo.saveRole(student(uniqueUserId("unknown")), { roleId: "astronaut", targetTerm: `Fall ${nextYear}` });
    await expectRejected(attempt, "invalid-input");
    await expect(attempt).rejects.toMatchObject({ fieldErrors: { roleId: "That career role isn't in the catalog." } });
  });

  it("rejects saving the same role twice", async () => {
    const userId = uniqueUserId("dup");
    await repo.saveRole(student(userId), { roleId: "software-developer", targetTerm: `Fall ${nextYear}` });
    await expectRejected(repo.saveRole(student(userId), { roleId: "software-developer", targetTerm: `Fall ${nextYear}` }), "already-exists");
  });

  it("reports not-found when updating or removing a role that was never saved", async () => {
    const userId = uniqueUserId("missing");
    await expectRejected(repo.updateSavedRole(userId, "data-analyst", { note: "hi" }), "not-found");
    await expectRejected(repo.removeSavedRole(userId, "data-analyst"), "not-found");
  });
});
