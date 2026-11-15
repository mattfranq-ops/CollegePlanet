import { NextResponse } from "next/server";
import { errorResponse, readJson, studentFromRequest, unauthorized } from "@/lib/apiHelpers";
import { repositories } from "@/lib/repositories";

type Params = { params: Promise<{ roleId: string }> };

/** PATCH /api/saved-roles/:roleId  { targetTerm?, note? }: change a saved role. */
export async function PATCH(request: Request, { params }: Params) {
  const student = await studentFromRequest(request);
  if (!student) return unauthorized();
  try {
    const { roleId } = await params;
    const savedRole = await repositories().savedRoles.updateSavedRole(student.id, roleId, await readJson(request));
    return NextResponse.json({ ok: true, savedRole });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/saved-roles/:roleId: remove a saved role. */
export async function DELETE(request: Request, { params }: Params) {
  const student = await studentFromRequest(request);
  if (!student) return unauthorized();
  try {
    const { roleId } = await params;
    await repositories().savedRoles.removeSavedRole(student.id, roleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
