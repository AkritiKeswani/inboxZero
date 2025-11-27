import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=no_code", request.url)
    );
  }

  try {
    // Use the same redirect URI that was used in the auth request
    // This must match exactly what Google expects
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback`;
    
    const oauth2Client = getAuthClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/dashboard?error=no_token", request.url)
      );
    }

    // Redirect to dashboard with token in URL (in production, use secure session management)
    // The dashboard will store it in localStorage
    return NextResponse.redirect(
      new URL(
        `/dashboard?token=${encodeURIComponent(tokens.access_token)}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("auth_failed")}`,
        request.url
      )
    );
  }
}

