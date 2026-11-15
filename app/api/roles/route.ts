import { NextResponse } from "next/server";
import { errorResponse, studentFromRequest, unauthorized } from "@/lib/apiHelpers";
import { repositories } from "@/lib/repositories";

/** GET /api/roles: the career role catalog. */
export async function GET(request: Request) {
  if (!(await studentFromRequest(request))) return unauthorized();
  try {
    return NextResponse.json({ ok: true, roles: await repositories().roles.listRoles() });
  } catch (err) {
    return errorResponse(err);
  }
}
