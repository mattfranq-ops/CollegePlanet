import { NextResponse } from "next/server";
import { errorResponse, readJson, studentFromRequest, unauthorized } from "@/lib/apiHelpers";
import { repositories } from "@/lib/repositories";

/** GET /api/saved-roles: the signed-in student's saved target roles. */
export async function GET(request: Request) {
  const student = await studentFromRequest(request);
  if (!student) return unauthorized();
  try {
    return NextResponse.json({ ok: true, savedRoles: await repositories().savedRoles.listSavedRoles(student.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/saved-roles  { roleId, targetTerm, note? }: save a target role. */
export async function POST(request: Request) {
  const student = await studentFromRequest(request);
  if (!student) return unauthorized();
  try {
    const savedRole = await repositories().savedRoles.saveRole(student, await readJson(request));
    return NextResponse.json({ ok: true, savedRole }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
