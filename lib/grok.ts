import { Email, EmailAnalysis } from "@/types";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";

export async function analyzeEmail(
  email: Email,
  userContext?: {
    skills?: string[];
    pastRoles?: string[];
    desiredRoles?: string[];
    highPriorityRoles?: string[];
    highPriorityKeywords?: string[];
    highPriorityCompanyTypes?: string;
    mediumPriorityCompanyTypes?: string;
    lowPriorityCompanyTypes?: string;
  }
): Promise<EmailAnalysis> {
  // Shorter, more focused prompt to reduce token usage and API costs
  // Limit body to first 800 chars to avoid hitting token limits
  const bodyPreview = email.body.substring(0, 800);
  
  // Build comprehensive context about user's profile
  let contextNote = "";
  if (userContext) {
    const contextParts = [];
    if (userContext.skills && userContext.skills.length > 0) {
      contextParts.push(`User skills: ${userContext.skills.join(", ")}`);
    }
    if (userContext.pastRoles && userContext.pastRoles.length > 0) {
      contextParts.push(`User past roles: ${userContext.pastRoles.join(", ")}`);
    }
    if (userContext.desiredRoles && userContext.desiredRoles.length > 0) {
      contextParts.push(`User seeking roles: ${userContext.desiredRoles.join(", ")}`);
    }
    if (userContext.highPriorityRoles && userContext.highPriorityRoles.length > 0) {
      contextParts.push(`High priority roles: ${userContext.highPriorityRoles.join(", ")}`);
    }
    if (userContext.highPriorityKeywords && userContext.highPriorityKeywords.length > 0) {
      contextParts.push(`High priority keywords: ${userContext.highPriorityKeywords.slice(0, 5).join(", ")}`);
    }
    if (userContext.highPriorityCompanyTypes) {
      contextParts.push(`High priority company types: ${userContext.highPriorityCompanyTypes}`);
    }
    if (userContext.mediumPriorityCompanyTypes) {
      contextParts.push(`Medium priority company types: ${userContext.mediumPriorityCompanyTypes}`);
    }
    if (userContext.lowPriorityCompanyTypes) {
      contextParts.push(`Low priority company types: ${userContext.lowPriorityCompanyTypes}`);
    }
    if (contextParts.length > 0) {
      contextNote = `\n\nUser profile context: ${contextParts.join(". ")}`;
    }
  }
  
  const prompt = `Analyze job search email with user context. Return JSON only:

From: ${email.fromName}
Subject: ${email.subject}
Body: ${bodyPreview}${email.body.length > 800 ? "..." : ""}
LinkedIn: ${email.isLinkedInNotification ? "Yes" : "No"}${contextNote}

CRITICAL: Match email content against user profile to determine relevance.

Tasks:
1. Extract intent (schedule/deadline/multi-step/linkedin-followup/other)
2. Extract constraints (dates/times/deadlines/requirements)
3. Extract actionItems (specific tasks mentioned)
4. Identify company name from email (from address, body, or subject)
5. Check if email mentions any of user's skills, desired roles, or past roles - this is HIGH priority
6. Categorize company as "high", "medium", or "low" priority based on user's company type preferences
7. Determine overall priority (high/medium/low) considering:
   - Intent urgency (schedule/deadline = high)
   - Company category match
   - Skills/roles match with user profile
   - High priority keywords present

Company categorization:
- "high": Matches user's high priority company types (AI companies, unicorns, modern startups)
- "medium": Matches user's medium priority company types (enterprise companies)
- "low": Matches user's low priority company types (old-school firms, accounting)
- "unknown": Cannot determine or doesn't match any category

Priority determination:
- "high": Schedule/deadline intent + (company match OR skills/roles match OR high keywords)
- "medium": Company match OR skills/roles match OR important intent
- "low": No matches, generic outreach, or low priority company

JSON format:
{
  "intent": "schedule"|"deadline"|"multi-step"|"linkedin-followup"|"other",
  "constraints": {"dates":[], "times":[], "deadlines":[], "requirements":[]},
  "actionItems": [],
  "platform": "${email.isLinkedInNotification ? "linkedin" : "email"}",
  "priority": "high"|"medium"|"low",
  "companyCategory": "high"|"medium"|"low"|"unknown",
  "companyName": "extracted company name or empty string",
  "linkedInProfileUrl": "${email.linkedInProfileUrl || ""}"
}`;

  try {
    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-beta", // Can also use "grok-2-1212" or "grok-2-vision-1212" depending on your x.ai plan
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes emails and extracts structured information. Always return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
        stream: false,
        max_tokens: 512, // Limit response size to reduce costs and speed
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("x.ai API error:", response.status, errorText);
      throw new Error(`x.ai API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = content.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      
      // Try to find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const analysis = JSON.parse(jsonMatch[0]) as EmailAnalysis;
          return analysis;
        } catch (parseError) {
          console.error("Error parsing JSON from Grok:", parseError);
        }
      }
    }

    // Fallback
    return {
      intent: "other",
      constraints: {},
      actionItems: [],
      platform: email.isLinkedInNotification ? "linkedin" : "email",
      priority: "medium",
      companyCategory: "unknown",
      companyName: "",
      linkedInProfileUrl: email.linkedInProfileUrl,
    };
  } catch (error) {
    console.error("Error analyzing email with Grok:", error);
    return {
      intent: "other",
      constraints: {},
      actionItems: [],
      platform: email.isLinkedInNotification ? "linkedin" : "email",
      priority: "medium",
      companyCategory: "unknown",
      companyName: "",
      linkedInProfileUrl: email.linkedInProfileUrl,
    };
  }
}

