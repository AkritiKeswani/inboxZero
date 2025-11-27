import { Email, EmailAnalysis } from "@/types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export interface EnhancedEmailAnalysis extends EmailAnalysis {
  constraints: {
    dates?: string[];
    times?: string[];
    deadlines?: string[];
    requirements?: string[];
    duration?: string; // e.g., "30min", "1 hour"
    timeConstraints?: string; // e.g., "Friday afternoon", "next week"
    specificConstraints?: string[]; // Additional constraints like "only free Friday afternoon"
  };
  senderInfo?: {
    name: string;
    company?: string;
    linkedInProfileUrl?: string;
    email: string;
  };
  requiredActions?: string[]; // What user needs to do
  constraintsText?: string; // Human-readable constraints summary
}

/**
 * Analyze email using Anthropic Claude API to extract constraints and intent
 */
export async function analyzeEmailWithClaude(
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
): Promise<EnhancedEmailAnalysis> {
  // Limit body to first 2000 chars to avoid token limits while keeping context
  const bodyPreview = email.body.substring(0, 2000);
  
  // Build user context string
  let contextNote = "";
  if (userContext) {
    const contextParts = [];
    if (userContext.skills && userContext.skills.length > 0) {
      contextParts.push(`Skills: ${userContext.skills.join(", ")}`);
    }
    if (userContext.pastRoles && userContext.pastRoles.length > 0) {
      contextParts.push(`Past roles: ${userContext.pastRoles.join(", ")}`);
    }
    if (userContext.desiredRoles && userContext.desiredRoles.length > 0) {
      contextParts.push(`Seeking roles: ${userContext.desiredRoles.join(", ")}`);
    }
    if (userContext.highPriorityRoles && userContext.highPriorityRoles.length > 0) {
      contextParts.push(`High priority roles: ${userContext.highPriorityRoles.join(", ")}`);
    }
    if (userContext.highPriorityKeywords && userContext.highPriorityKeywords.length > 0) {
      contextParts.push(`High priority keywords: ${userContext.highPriorityKeywords.slice(0, 5).join(", ")}`);
    }
    if (userContext.highPriorityCompanyTypes) {
      contextParts.push(`High priority companies: ${userContext.highPriorityCompanyTypes}`);
    }
    if (userContext.mediumPriorityCompanyTypes) {
      contextParts.push(`Medium priority companies: ${userContext.mediumPriorityCompanyTypes}`);
    }
    if (userContext.lowPriorityCompanyTypes) {
      contextParts.push(`Low priority companies: ${userContext.lowPriorityCompanyTypes}`);
    }
    if (contextParts.length > 0) {
      contextNote = `\n\nUser Profile:\n${contextParts.join("\n")}`;
    }
  }

  const prompt = `You are an AI assistant that analyzes job search emails and extracts structured information.

Email to analyze:
From: ${email.fromName} <${email.from}>
Subject: ${email.subject}
Body: ${bodyPreview}${email.body.length > 2000 ? "\n[...truncated...]" : ""}
LinkedIn Notification: ${email.isLinkedInNotification ? "Yes" : "No"}
LinkedIn Profile URL: ${email.linkedInProfileUrl || "Not found"}${contextNote}

Your task is to extract:
1. Intent: One of: schedule_call, send_resume, deadline, technical_assessment, multi_step_process, linkedin_followup, other
2. Specific constraints: dates, times, deadlines, duration, time constraints (e.g., "Friday afternoon", "next week")
3. Required actions: What the user needs to do (e.g., "send resume", "complete assessment", "schedule call")
4. Sender information: Name, company, LinkedIn profile URL if present
5. Deadline dates/times if mentioned
6. Company name and category (high/medium/low/unknown based on user preferences)

Intent definitions:
- schedule_call: Email requests scheduling a call/meeting
- send_resume: Email requests resume/CV
- deadline: Email has a specific deadline
- technical_assessment: Email mentions technical test/assessment
- multi_step_process: Email describes a multi-step interview/hiring process
- linkedin_followup: Email is from LinkedIn and needs follow-up
- other: Doesn't fit above categories

Extract dates in ISO format (YYYY-MM-DD) when possible. For relative dates like "next Friday", calculate the actual date.
Extract times in 24-hour format when mentioned.
Extract duration (e.g., "30min", "1 hour", "45 minutes").

Return ONLY valid JSON in this exact format:
{
  "intent": "schedule_call" | "send_resume" | "deadline" | "technical_assessment" | "multi_step_process" | "linkedin_followup" | "other",
  "constraints": {
    "dates": ["YYYY-MM-DD"],
    "times": ["HH:MM"],
    "deadlines": ["YYYY-MM-DDTHH:MM:SS"] or ["YYYY-MM-DD"],
    "duration": "30min" | "1 hour" | etc.,
    "timeConstraints": "Friday afternoon" | "next week" | etc.,
    "specificConstraints": ["only free Friday afternoon", "need by Thursday EOD"],
    "requirements": ["send resume", "complete form"]
  },
  "requiredActions": ["action1", "action2"],
  "actionItems": ["item1", "item2"],
  "senderInfo": {
    "name": "Sender Name",
    "company": "Company Name" or null,
    "linkedInProfileUrl": "https://linkedin.com/in/..." or null,
    "email": "${email.from}"
  },
  "platform": "${email.isLinkedInNotification ? "linkedin" : "email"}",
  "priority": "high" | "medium" | "low",
  "companyCategory": "high" | "medium" | "low" | "unknown",
  "companyName": "extracted company name or empty string",
  "linkedInProfileUrl": "${email.linkedInProfileUrl || ""}",
  "constraintsText": "Human-readable summary of all constraints"
}`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (content) {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = content.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      
      // Try to find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const analysis = JSON.parse(jsonMatch[0]) as EnhancedEmailAnalysis;
          
          // Ensure all required fields are present
          return {
            intent: analysis.intent || "other",
            constraints: {
              dates: analysis.constraints?.dates || [],
              times: analysis.constraints?.times || [],
              deadlines: analysis.constraints?.deadlines || [],
              duration: analysis.constraints?.duration,
              timeConstraints: analysis.constraints?.timeConstraints,
              specificConstraints: analysis.constraints?.specificConstraints || [],
              requirements: analysis.constraints?.requirements || [],
            },
            requiredActions: analysis.requiredActions || analysis.actionItems || [],
            actionItems: analysis.actionItems || analysis.requiredActions || [],
            senderInfo: analysis.senderInfo || {
              name: email.fromName,
              email: email.from,
            },
            platform: analysis.platform || (email.isLinkedInNotification ? "linkedin" : "email"),
            priority: analysis.priority || "medium",
            companyCategory: analysis.companyCategory || "unknown",
            companyName: analysis.companyName || "",
            linkedInProfileUrl: analysis.linkedInProfileUrl || email.linkedInProfileUrl,
            constraintsText: analysis.constraintsText || "",
          };
        } catch (parseError) {
          console.error("Error parsing JSON from Claude:", parseError);
          console.error("Raw response:", jsonText);
        }
      }
    }

    // Fallback
    return {
      intent: "other",
      constraints: {},
      requiredActions: [],
      actionItems: [],
      senderInfo: {
        name: email.fromName,
        email: email.from,
      },
      platform: email.isLinkedInNotification ? "linkedin" : "email",
      priority: "medium",
      companyCategory: "unknown",
      companyName: "",
      linkedInProfileUrl: email.linkedInProfileUrl,
      constraintsText: "",
    };
  } catch (error) {
    console.error("Error analyzing email with Claude:", error);
    return {
      intent: "other",
      constraints: {},
      requiredActions: [],
      actionItems: [],
      senderInfo: {
        name: email.fromName,
        email: email.from,
      },
      platform: email.isLinkedInNotification ? "linkedin" : "email",
      priority: "medium",
      companyCategory: "unknown",
      companyName: "",
      linkedInProfileUrl: email.linkedInProfileUrl,
      constraintsText: "",
    };
  }
}

