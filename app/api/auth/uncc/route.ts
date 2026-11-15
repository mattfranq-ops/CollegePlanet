import { NextResponse } from "next/server";

// Optional UNCC single sign-on from issue #1. It needs the university's SSO (SAML/Shibboleth)
// registration, which the team does not have yet, so this route reports that it is unavailable.
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "UNCC sign-in is not available yet. Use your CollegePlanet username and password." },
    { status: 501 },
  );
}
