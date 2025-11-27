import { NextRequest, NextResponse } from "next/server";
import { fetchEmails } from "@/lib/gmail";
import { analyzeEmail } from "@/lib/grok";
import { getAvailableDates } from "@/lib/calendar";
import { generateSuggestions } from "@/lib/suggestions";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    // Fetch emails
    const emails = await fetchEmails(accessToken, 20);

    // Analyze each email and generate suggestions
    const results = await Promise.all(
      emails.map(async (email) => {
        const analysis = await analyzeEmail(email);

        // Get calendar availability if scheduling is needed
        let calendarAvailabilities = [];
        if (
          analysis.intent === "schedule" &&
          analysis.constraints.dates &&
          analysis.constraints.dates.length > 0
        ) {
          calendarAvailabilities = await getAvailableDates(
            accessToken,
            analysis.constraints.dates
          );
        }

        const suggestions = generateSuggestions(
          email,
          analysis,
          calendarAvailabilities
        );

        return {
          email,
          analysis,
          suggestions,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error processing emails:", error);
    return NextResponse.json(
      { error: "Failed to process emails" },
      { status: 500 }
    );
  }
}

