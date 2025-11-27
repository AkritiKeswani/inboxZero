import { NextRequest, NextResponse } from "next/server";
import { fetchEmails } from "@/lib/gmail";
import { analyzeEmail } from "@/lib/grok";
import { getAvailableDates } from "@/lib/calendar";
import { generateSuggestions } from "@/lib/suggestions";
import { calculatePriorityScore, scoreToPriority, generateDefinitiveAction } from "@/lib/priority";
import { DEFAULT_PREFERENCES } from "@/types/preferences";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, preferences: userPreferences } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    // Fetch top 10 emails to avoid rate limits (process fewer at once)
    const emails = await fetchEmails(accessToken, 10);

    // Get user preferences (use provided or defaults)
    const preferences = userPreferences || DEFAULT_PREFERENCES;

    // Process emails sequentially with delays to avoid rate limits
    const results = [];
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      try {
        // Add delay between API calls to respect rate limits
        // 500ms delay between each email processing
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Analyze email with Grok (this is the expensive API call)
        // Pass comprehensive user context so Grok can consider full profile when analyzing
        const userContext = {
          skills: preferences.skills,
          pastRoles: preferences.pastRoles,
          desiredRoles: preferences.desiredRoles,
          highPriorityRoles: preferences.highPriorityRoles,
          highPriorityKeywords: preferences.highPriorityKeywords,
          highPriorityCompanyTypes: preferences.highPriorityCompanyTypes,
          mediumPriorityCompanyTypes: preferences.mediumPriorityCompanyTypes,
          lowPriorityCompanyTypes: preferences.lowPriorityCompanyTypes,
        };
        const analysis = await analyzeEmail(email, userContext);

        // Calculate priority score based on user preferences
        const priorityScore = calculatePriorityScore(email, analysis, preferences);
        const calculatedPriority = scoreToPriority(priorityScore);

        // Update analysis with calculated priority
        analysis.priority = calculatedPriority;

        // Only skip obvious spam (very low score + spam keywords)
        // Show all emails but let priority sorting handle the ranking
        // Only skip if it's clearly spam (very low score AND has spam keywords)
        const hasSpamKeywords = preferences.lowPriorityKeywords.some((keyword: string) =>
          (email.from + " " + email.subject + " " + email.body).toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (calculatedPriority === "low" && analysis.intent === "other" && hasSpamKeywords && priorityScore < 30) {
          continue; // Skip only obvious spam
        }

        // Generate definitive action item with preferences context
        const definitiveAction = generateDefinitiveAction(email, analysis, calculatedPriority, preferences);

        // Get calendar availability if scheduling is needed
        // Only check calendar for high-priority scheduling requests
        let calendarAvailabilities: any[] = [];
        if (
          analysis.intent === "schedule" &&
          analysis.priority === "high" &&
          analysis.constraints.dates &&
          analysis.constraints.dates.length > 0 &&
          analysis.constraints.dates.length <= 3 // Limit to 3 dates max
        ) {
          // Add delay before calendar API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          calendarAvailabilities = await getAvailableDates(
            accessToken,
            analysis.constraints.dates.slice(0, 3) // Only check first 3 dates
          );
        }

        const suggestions = generateSuggestions(
          email,
          analysis,
          calendarAvailabilities
        );

        results.push({
          email: {
            ...email,
            date: email.date.toISOString(), // Serialize Date to string for JSON
          },
          analysis: {
            ...analysis,
            priority: calculatedPriority,
          },
          suggestions,
          priorityScore,
          definitiveAction,
        });
      } catch (error: any) {
        console.error(`Error processing email ${email.id}:`, error);
        
        // If it's a rate limit error, stop processing
        if (error.message?.includes("rate limit") || error.message?.includes("429")) {
          return NextResponse.json({
            results,
            warning: "Rate limit reached. Processed partial results. Please try again in a moment.",
          });
        }
        
        // For other errors, still include the email with basic info
        // This way user sees all emails even if analysis fails
        results.push({
          email: {
            ...email,
            date: email.date.toISOString(),
          },
          analysis: {
            intent: "other",
            constraints: {},
            actionItems: [],
            platform: email.isLinkedInNotification ? "linkedin" : "email",
            priority: "low",
          },
          suggestions: [],
          priorityScore: 30, // Default low score for failed analysis
          definitiveAction: `Review email from ${email.fromName}`,
        });
        
        continue;
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error processing emails:", error);
    return NextResponse.json(
      { error: "Failed to process emails" },
      { status: 500 }
    );
  }
}

