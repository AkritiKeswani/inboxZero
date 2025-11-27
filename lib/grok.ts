import { Email, EmailAnalysis } from "@/types";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";

export async function analyzeEmail(email: Email): Promise<EmailAnalysis> {
  const prompt = `Analyze this email and extract key information for a job search context.

Email from: ${email.fromName} (${email.from})
Subject: ${email.subject}
Body: ${email.body}
Is LinkedIn notification: ${email.isLinkedInNotification}
${email.linkedInProfileUrl ? `LinkedIn URL: ${email.linkedInProfileUrl}` : ""}

Please extract:
1. Intent: One of "schedule", "deadline", "multi-step", "linkedin-followup", or "other"
2. Constraints: Any dates, times, deadlines, or requirements mentioned
3. Action items: What the user needs to do
4. Platform: "email" or "linkedin" based on the source
5. Priority: "high", "medium", or "low" based on urgency and importance

Return your response as a JSON object with this structure:
{
  "intent": "schedule" | "deadline" | "multi-step" | "linkedin-followup" | "other",
  "constraints": {
    "dates": ["array of date strings if mentioned"],
    "times": ["array of time strings if mentioned"],
    "deadlines": ["array of deadline strings if mentioned"],
    "requirements": ["array of requirements if mentioned"]
  },
  "actionItems": ["array of action items"],
  "linkedInProfileUrl": "${email.linkedInProfileUrl || ""}",
  "platform": "email" | "linkedin",
  "priority": "high" | "medium" | "low"
}

IMPORTANT: Return ONLY valid JSON, no additional text or markdown formatting.`;

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

