import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";

export async function GET() {
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

    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
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

