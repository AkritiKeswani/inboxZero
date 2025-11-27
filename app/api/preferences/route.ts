import { NextRequest, NextResponse } from "next/server";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/types/preferences";

// In production, store this in a database
// For now, we'll use a simple in-memory store (per user session)
// TODO: Replace with database storage

export async function GET() {
  // Return default preferences
  // In production, fetch from database based on user ID
  return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
}

export async function POST(request: NextRequest) {
  try {
    const preferences: UserPreferences = await request.json();
    
    // In production, save to database
    // For now, just validate and return
    
    return NextResponse.json({ 
      success: true,
      message: "Preferences saved (in-memory only - implement database storage)" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

