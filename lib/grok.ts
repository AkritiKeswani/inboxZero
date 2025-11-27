import { Email, EmailAnalysis } from "@/types";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";

export async function analyzeEmail(email: Email): Promise<EmailAnalysis> {
  // Shorter, more focused prompt to reduce token usage and API costs
  // Limit body to first 800 chars to avoid hitting token limits
  const bodyPreview = email.body.substring(0, 800);
  
  const prompt = `Analyze job search email. Return JSON only:

From: ${email.fromName}
Subject: ${email.subject}
Body: ${bodyPreview}${email.body.length > 800 ? "..." : ""}
LinkedIn: ${email.isLinkedInNotification ? "Yes" : "No"}

Extract: intent (schedule/deadline/multi-step/linkedin-followup/other), constraints (dates/times/deadlines/requirements), actionItems, priority (high/medium/low), platform (email/linkedin).

JSON format:
{
  "intent": "schedule"|"deadline"|"multi-step"|"linkedin-followup"|"other",
  "constraints": {"dates":[], "times":[], "deadlines":[], "requirements":[]},
  "actionItems": [],
  "platform": "${email.isLinkedInNotification ? "linkedin" : "email"}",
  "priority": "high"|"medium"|"low",
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
      linkedInProfileUrl: email.linkedInProfileUrl,
    };
  }
}

