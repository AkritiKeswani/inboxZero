import { Email, EmailAnalysis } from "@/types";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/types/preferences";

/**
 * Calculate priority score based on user preferences and email content
 * Returns a number 0-100, where higher = more important
 */
export function calculatePriorityScore(
  email: Email,
  analysis: EmailAnalysis,
  preferences: UserPreferences = DEFAULT_PREFERENCES
): number {
  let score = 50; // Base score

  // Use AI-determined company category (preferred method)
  if (analysis.companyCategory) {
    if (analysis.companyCategory === "high") {
      score += 30; // High priority company type match
    } else if (analysis.companyCategory === "medium") {
      score += 15; // Medium priority company type match
    } else if (analysis.companyCategory === "low") {
      score -= 20; // Low priority company type match
    }
    // "unknown" doesn't change the score
  }

  // Get email text for matching (used throughout)
  const emailLower = (email.from + " " + email.subject + " " + email.body).toLowerCase();

  // Fallback: Check legacy company lists if AI categorization not available
  // (for backward compatibility)
  if (!analysis.companyCategory || analysis.companyCategory === "unknown") {
    
    // High priority companies (+30 points)
    for (const company of preferences.highPriorityCompanies) {
      if (emailLower.includes(company.toLowerCase())) {
        score += 30;
        break;
      }
    }

    // Medium priority companies (+15 points)
    for (const company of preferences.mediumPriorityCompanies) {
      if (emailLower.includes(company.toLowerCase())) {
        score += 15;
        break;
      }
    }

    // Low priority companies (-20 points)
    for (const company of preferences.lowPriorityCompanies) {
      if (emailLower.includes(company.toLowerCase())) {
        score -= 20;
        break;
      }
    }
  }

  // Desired roles (what you're looking for) - highest priority (+25 points)
  // Use fuzzy matching for role variations (e.g., "Software Engineer" matches "software engineer", "SWE", etc.)
  for (const role of preferences.desiredRoles) {
    const roleLower = role.toLowerCase();
    // Exact match
    if (emailLower.includes(roleLower)) {
      score += 25;
      break;
    }
    // Check for common abbreviations/variations
    const roleWords = roleLower.split(/\s+/);
    if (roleWords.length > 1) {
      // Check if all key words are present (e.g., "Staff Engineer" -> check for "staff" and "engineer")
      const keyWords = roleWords.filter(w => w.length > 3); // Skip short words like "of", "the"
      if (keyWords.length > 0 && keyWords.every(word => emailLower.includes(word))) {
        score += 25;
        break;
      }
    }
  }

  // Past roles - if email mentions similar roles, boost relevance (+18 points)
  // This helps match emails for roles similar to what user has done
  for (const role of preferences.pastRoles) {
    const roleLower = role.toLowerCase();
    if (emailLower.includes(roleLower)) {
      score += 18;
      break;
    }
    // Fuzzy match for past roles too
    const roleWords = roleLower.split(/\s+/);
    if (roleWords.length > 1) {
      const keyWords = roleWords.filter(w => w.length > 3);
      if (keyWords.length > 0 && keyWords.every(word => emailLower.includes(word))) {
        score += 18;
        break;
      }
    }
  }

  // High priority roles (+20 points)
  for (const role of preferences.highPriorityRoles) {
    if (emailLower.includes(role.toLowerCase())) {
      score += 20;
      break;
    }
  }

  // Medium priority roles (+10 points)
  for (const role of preferences.mediumPriorityRoles) {
    if (emailLower.includes(role.toLowerCase())) {
      score += 10;
      break;
    }
  }

  // Skills match - improved matching (+15 points per skill, max +30 for multiple matches)
  // Check for skill variations (e.g., "React" matches "react", "React.js", "ReactJS")
  let skillMatches = 0;
  for (const skill of preferences.skills) {
    const skillLower = skill.toLowerCase().replace(/[.\-_]/g, ""); // Normalize skill name
    const emailNormalized = emailLower.replace(/[.\-_]/g, "");
    
    // Exact match
    if (emailNormalized.includes(skillLower)) {
      skillMatches++;
      if (skillMatches <= 2) {
        score += 15; // Max +30 for 2+ skills
      }
    }
    // Check for common variations (e.g., "typescript" vs "TypeScript" vs "TS")
    else if (skillLower.length > 3) {
      // Check first 4 chars match (handles "React" vs "ReactJS")
      const skillPrefix = skillLower.substring(0, 4);
      if (emailNormalized.includes(skillPrefix)) {
        skillMatches++;
        if (skillMatches <= 2) {
          score += 15;
        }
      }
    }
  }

  // High priority keywords (+15 points each, max +30)
  let keywordMatches = 0;
  for (const keyword of preferences.highPriorityKeywords) {
    if (emailLower.includes(keyword.toLowerCase())) {
      keywordMatches++;
      if (keywordMatches <= 2) {
        score += 15;
      }
    }
  }

  // Low priority keywords (spam) (-25 points)
  for (const keyword of preferences.lowPriorityKeywords) {
    if (emailLower.includes(keyword.toLowerCase())) {
      score -= 25;
      break;
    }
  }

  // Intent-based scoring (handle both new and legacy intent types)
  if (analysis.intent === "schedule_call" || analysis.intent === "schedule") score += 20;
  if (analysis.intent === "deadline") score += 25;
  if (analysis.intent === "send_resume") score += 18;
  if (analysis.intent === "technical_assessment") score += 22;
  if (analysis.intent === "multi_step_process" || analysis.intent === "multi-step") score += 15;
  if (analysis.intent === "linkedin_followup" || analysis.intent === "linkedin-followup") score += 10;
  if (analysis.intent === "other") score -= 10;

  // Deadline urgency (+20 if deadline is soon)
  if (analysis.constraints.deadlines && analysis.constraints.deadlines.length > 0) {
    score += 20;
  }

  // Urgent indicators (+15)
  for (const indicator of preferences.urgentIndicators) {
    if (emailLower.includes(indicator.toLowerCase())) {
      score += 15;
      break;
    }
  }

  // LinkedIn notifications get slight boost (+5)
  if (email.isLinkedInNotification) {
    score += 5;
  }

  // Clamp score between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Convert priority score to high/medium/low
 */
export function scoreToPriority(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Generate definitive action item based on analysis and priority
 */
export function generateDefinitiveAction(
  email: Email,
  analysis: EmailAnalysis,
  priority: "high" | "medium" | "low",
  preferences?: UserPreferences
): string {
  const fromName = email.fromName.split(" ")[0]; // First name only
  const companyName = analysis.companyName || "";
  const companyContext = companyName ? ` at ${companyName}` : "";
  
  if (analysis.intent === "schedule_call" || analysis.intent === "schedule") {
    if (analysis.constraints.dates && analysis.constraints.dates.length > 0) {
      const date = analysis.constraints.dates[0];
      return `Schedule call with ${fromName}${companyContext} for ${date}`;
    }
    if (analysis.constraints.timeConstraints) {
      return `Schedule call with ${fromName}${companyContext} for ${analysis.constraints.timeConstraints}`;
    }
    return `Respond to ${fromName}${companyContext} with your availability`;
  }

  if (analysis.intent === "send_resume") {
    const deadline = analysis.constraints.deadlines?.[0];
    if (deadline) {
      return `Send resume to ${fromName}${companyContext} by ${deadline}`;
    }
    return `Send resume to ${fromName}${companyContext}`;
  }

  if (analysis.intent === "technical_assessment") {
    const deadline = analysis.constraints.deadlines?.[0];
    if (deadline) {
      return `Complete technical assessment from ${fromName}${companyContext} by ${deadline}`;
    }
    return `Complete technical assessment from ${fromName}${companyContext}`;
  }

  if (analysis.intent === "deadline") {
    if (analysis.constraints.deadlines && analysis.constraints.deadlines.length > 0) {
      const deadline = analysis.constraints.deadlines[0];
      const action = analysis.actionItems[0] || "see email";
      return `Complete by ${deadline}: ${action}${companyContext ? ` (${companyName})` : ""}`;
    }
    return `Complete deadline task from ${fromName}${companyContext}`;
  }

  if (analysis.intent === "multi_step_process" || analysis.intent === "multi-step") {
    const actionItems = analysis.requiredActions || analysis.actionItems;
    if (actionItems.length > 0) {
      return `Start step 1: ${actionItems[0]}${companyContext}`;
    }
    return `Begin multi-step process with ${fromName}${companyContext}`;
  }

  if (analysis.intent === "linkedin_followup" || analysis.intent === "linkedin-followup") {
    if (analysis.linkedInProfileUrl || analysis.senderInfo?.linkedInProfileUrl) {
      return `Follow up with ${fromName}${companyContext} on LinkedIn`;
    }
    return `Follow up with ${fromName}${companyContext}`;
  }

  // Default based on priority and company category
  if (priority === "high") {
    if (analysis.companyCategory === "high") {
      return `Respond to ${fromName}${companyContext} - High priority match`;
    }
    return `Respond to ${fromName}${companyContext} - ${email.subject.substring(0, 50)}`;
  }

  if (priority === "medium") {
    return `Review email from ${fromName}${companyContext}`;
  }

  return `Review email from ${fromName}`;
}

