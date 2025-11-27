import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/gmail";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    
    // Log for debugging
    console.log("Callback redirect URI:", redirectUri);
    console.log("Callback origin:", origin);
    
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
  } catch (error: any) {
    console.error("Error exchanging code for token:", error);
    
    // Provide more detailed error information
    let errorMessage = "auth_failed";
    if (error.message?.includes("redirect_uri_mismatch")) {
      errorMessage = "redirect_uri_mismatch";
    } else if (error.message?.includes("invalid_grant")) {
      errorMessage = "invalid_grant";
    }
    
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.message || "Unknown error")}`,
        request.url
      )
    );
  }
}

