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

  // Check company priority
  const emailLower = (email.from + " " + email.subject + " " + email.body).toLowerCase();
  
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

  // Desired roles (what you're looking for) - highest priority (+25 points)
  for (const role of preferences.desiredRoles) {
    if (emailLower.includes(role.toLowerCase())) {
      score += 25;
      break;
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

  // Skills match (+15 points if email mentions your skills)
  for (const skill of preferences.skills) {
    if (emailLower.includes(skill.toLowerCase())) {
      score += 15;
      break; // Only count once
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

  // Intent-based scoring
  if (analysis.intent === "schedule") score += 20;
  if (analysis.intent === "deadline") score += 25;
  if (analysis.intent === "multi-step") score += 15;
  if (analysis.intent === "linkedin-followup") score += 10;
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
  priority: "high" | "medium" | "low"
): string {
  const fromName = email.fromName.split(" ")[0]; // First name only
  
  if (analysis.intent === "schedule") {
    if (analysis.constraints.dates && analysis.constraints.dates.length > 0) {
      const date = analysis.constraints.dates[0];
      return `Schedule call with ${fromName} for ${date}`;
    }
    return `Respond to ${fromName} with your availability`;
  }

  if (analysis.intent === "deadline") {
    if (analysis.constraints.deadlines && analysis.constraints.deadlines.length > 0) {
      const deadline = analysis.constraints.deadlines[0];
      return `Complete task by ${deadline} - ${analysis.actionItems[0] || "see email"}`;
    }
    return `Complete deadline task from ${fromName}`;
  }

  if (analysis.intent === "multi-step") {
    if (analysis.actionItems.length > 0) {
      return `Start step 1: ${analysis.actionItems[0]}`;
    }
    return `Begin multi-step process with ${fromName}`;
  }

  if (analysis.intent === "linkedin-followup") {
    return `Follow up with ${fromName} on LinkedIn`;
  }

  // Default based on priority
  if (priority === "high") {
    return `Respond to ${fromName} - ${email.subject}`;
  }

  return `Review email from ${fromName}`;
}

