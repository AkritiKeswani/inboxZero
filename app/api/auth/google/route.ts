import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";

// Force dynamic rendering since we use request headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { 
          error: "OAuth not configured",
          message: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file. See QUICK_OAUTH_FIX.md for setup instructions."
        },
        { status: 500 }
      );
    }

    // Check if using placeholder values
    if (
      process.env.GOOGLE_CLIENT_ID.includes("your_") ||
      process.env.GOOGLE_CLIENT_SECRET.includes("your_")
    ) {
      return NextResponse.json(
        { 
          error: "OAuth not configured",
          message: "Please replace placeholder values in .env with your actual Google OAuth credentials. See QUICK_OAUTH_FIX.md"
        },
        { status: 500 }
      );
    }

    // Dynamically determine redirect URI based on request origin
    // This ensures it works in both dev (localhost) and production (Vercel)
    // Prefer the request URL origin as it's more reliable than headers
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback`;
    
    // Log for debugging (remove in production if needed)
    console.log("OAuth redirect URI:", redirectUri);
    console.log("Request origin:", origin);
    console.log("Request URL:", request.url);
    
    const authUrl = getAuthUrl(redirectUri);
    return NextResponse.json({ authUrl, redirectUri }); // Include redirectUri in response for debugging
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate auth URL",
        message: error.message || "Unknown error. Check server logs.",
        details: "See QUICK_OAUTH_FIX.md for troubleshooting"
      },
      { status: 500 }
    );
  }
}

