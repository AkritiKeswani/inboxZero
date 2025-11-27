import { NextRequest, NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    // Get user profile from Gmail API
    const gmail = await getGmailClient(accessToken);
    const profile = await gmail.users.getProfile({
      userId: "me",
    });

    return NextResponse.json({
      email: profile.data.emailAddress,
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

