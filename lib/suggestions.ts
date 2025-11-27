import { Email, EmailAnalysis, CalendarAvailability, Suggestion } from "@/types";
import { format, addDays, parseISO } from "date-fns";
import { formatTimeSlots } from "./calendar";

export interface EnhancedSuggestion extends Suggestion {
  generatedResponse?: string; // Ready-to-use response template
  timeSlots?: string[]; // Formatted time slots
  attachmentsNeeded?: string[]; // Files to attach
}

export function generateSuggestions(
  email: Email,
  analysis: EmailAnalysis,
  calendarAvailabilities: CalendarAvailability[]
): EnhancedSuggestion[] {
  const suggestions: EnhancedSuggestion[] = [];
  const senderName = analysis.senderInfo?.name || email.fromName;
  const firstName = senderName.split(" ")[0];

  // Handle scheduling requests (schedule_call or schedule)
  if ((analysis.intent === "schedule_call" || analysis.intent === "schedule") && calendarAvailabilities.length > 0) {
    const timeSlots = formatTimeSlots(calendarAvailabilities, 3);
    
    if (timeSlots.length > 0) {
      // Generate response template
      const timeSlotText = timeSlots.length === 1 
        ? timeSlots[0]
        : timeSlots.slice(0, 2).join(" or ");
      
      const duration = analysis.constraints.duration || "30 minutes";
      const generatedResponse = `Hi ${firstName},\n\nI'm available ${timeSlotText} PT. Does either work for you? Here's my calendar link: [your-calendar-link]\n\nLooking forward to chatting!\n\nBest,\n[Your Name]`;

      suggestions.push({
        id: `sched-${email.id}`,
        emailId: email.id,
        type: "schedule",
        title: `Schedule ${duration} call with ${senderName}`,
        description: `Suggested times: ${timeSlots.join(", ")}`,
        suggestedTime: calendarAvailabilities[0]?.availableSlots[0]?.start,
        timeSlots,
        generatedResponse,
        actionItems: analysis.requiredActions || analysis.actionItems,
        priority: analysis.priority,
        createdAt: new Date(),
      });
    } else if (analysis.constraints.timeConstraints) {
      // If no calendar slots but we have time constraints, suggest manual response
      suggestions.push({
        id: `sched-manual-${email.id}`,
        emailId: email.id,
        type: "schedule",
        title: `Respond to ${senderName} with availability`,
        description: `Check your calendar for ${analysis.constraints.timeConstraints} and respond`,
        generatedResponse: `Hi ${firstName},\n\nI'd love to chat! Let me check my calendar for ${analysis.constraints.timeConstraints} and get back to you with specific times.\n\nBest,\n[Your Name]`,
        actionItems: analysis.requiredActions || analysis.actionItems,
        priority: analysis.priority,
        createdAt: new Date(),
      });
    }
  }

  // Handle send_resume intent
  if (analysis.intent === "send_resume") {
    const attachmentsNeeded = ["akriti-resume-nov.pdf"]; // Default, could be configurable
    const deadline = analysis.constraints.deadlines?.[0];
    const deadlineText = deadline 
      ? ` by ${format(parseISO(deadline), "EEEE, MMMM d")}`
      : "";
    
    const generatedResponse = `Hi ${firstName},\n\nThanks for reaching out! I've attached my resume${deadlineText ? ` as requested${deadlineText}` : ""}.\n\nI'm excited to learn more about the ${analysis.companyName || "role"}.\n\nBest,\n[Your Name]`;

    suggestions.push({
      id: `resume-${email.id}`,
      emailId: email.id,
      type: "followup",
      title: `Send resume to ${senderName}${deadlineText}`,
      description: `Attach resume and respond${deadlineText}`,
      generatedResponse,
      attachmentsNeeded,
      deadline: deadline ? parseISO(deadline) : undefined,
      actionItems: ["Attach resume", "Send email"],
      priority: analysis.priority,
      createdAt: new Date(),
    });
  }

  // Handle deadlines
  if (analysis.intent === "deadline" && analysis.constraints.deadlines) {
    for (const deadlineStr of analysis.constraints.deadlines) {
      // Try to parse the deadline
      let deadline: Date;
      try {
        deadline = parseISO(deadlineStr);
      } catch {
        // If parsing fails, try to extract date from string
        const dateMatch = deadlineStr.match(/\d{4}-\d{2}-\d{2}/);
        deadline = dateMatch ? parseISO(dateMatch[0]) : addDays(new Date(), 7);
      }

      const actionItem = analysis.requiredActions?.[0] || analysis.actionItems[0] || "Complete task";
      const generatedResponse = `Hi ${firstName},\n\nI've completed ${actionItem}${deadline ? ` (due ${format(deadline, "EEEE, MMMM d")})` : ""}.\n\n[Add completion details here]\n\nBest,\n[Your Name]`;

      suggestions.push({
        id: `deadline-${email.id}-${deadline.getTime()}`,
        emailId: email.id,
        type: "deadline",
        title: `Deadline: ${actionItem}`,
        description: `Due: ${format(deadline, "EEEE, MMMM d, yyyy")}`,
        deadline,
        generatedResponse,
        actionItems: analysis.requiredActions || analysis.actionItems,
        priority: analysis.priority,
        createdAt: new Date(),
      });
    }
  }

  // Handle multi-step processes (multi_step_process or multi-step)
  if (analysis.intent === "multi_step_process" || analysis.intent === "multi-step") {
    const actionItems = analysis.requiredActions || analysis.actionItems;
    actionItems.forEach((actionItem, index) => {
      const isFirst = index === 0;
      const generatedResponse = isFirst 
        ? `Hi ${firstName},\n\nThanks for the details! I'll start with ${actionItem}.\n\nI'll keep you updated on my progress.\n\nBest,\n[Your Name]`
        : undefined;

      suggestions.push({
        id: `multistep-${email.id}-${index}`,
        emailId: email.id,
        type: "followup",
        title: `Step ${index + 1}: ${actionItem}`,
        description: `Part of multi-step process with ${senderName}`,
        generatedResponse,
        actionItems: [actionItem],
        priority: isFirst ? "high" : analysis.priority,
        createdAt: new Date(),
      });
    });
  }

  // Handle LinkedIn follow-ups (linkedin_followup or linkedin-followup)
  const linkedInUrl = analysis.senderInfo?.linkedInProfileUrl || analysis.linkedInProfileUrl || email.linkedInProfileUrl;
  if (
    analysis.intent === "linkedin_followup" ||
    analysis.intent === "linkedin-followup" ||
    (analysis.platform === "linkedin" && linkedInUrl)
  ) {
    const profileLink = linkedInUrl ? `https://www.linkedin.com/messaging/compose/?recipient=${linkedInUrl.split('/').pop()}` : undefined;
    
    suggestions.push({
      id: `linkedin-${email.id}`,
      emailId: email.id,
      type: "linkedin-followup",
      title: `Follow up with ${senderName} on LinkedIn`,
      description: `Continue conversation on LinkedIn. ${(analysis.requiredActions || analysis.actionItems).join(", ")}`,
      generatedResponse: profileLink 
        ? `Hi ${firstName},\n\nThanks for reaching out! I'd love to continue this conversation. [Add your message here]\n\nBest,\n[Your Name]`
        : undefined,
      actionItems: analysis.requiredActions || analysis.actionItems,
      priority: analysis.priority,
      linkedInProfileUrl: linkedInUrl,
      createdAt: new Date(),
    });
  }

  // Handle technical assessments
  if (analysis.intent === "technical_assessment") {
    const deadline = analysis.constraints.deadlines?.[0];
    const deadlineText = deadline 
      ? ` (due ${format(parseISO(deadline), "EEEE, MMMM d")})`
      : "";
    
    const generatedResponse = `Hi ${firstName},\n\nThanks for sending the technical assessment! I'll complete it${deadline ? ` by ${format(parseISO(deadline), "EEEE, MMMM d")}` : " soon"}.\n\nBest,\n[Your Name]`;
    
    suggestions.push({
      id: `tech-assessment-${email.id}`,
      emailId: email.id,
      type: "deadline",
      title: `Complete technical assessment${deadlineText}`,
      description: `Technical assessment from ${senderName}${deadlineText}`,
      deadline: deadline ? parseISO(deadline) : undefined,
      generatedResponse,
      actionItems: analysis.requiredActions || analysis.actionItems,
      priority: analysis.priority,
      createdAt: new Date(),
    });
  }

  // Generic follow-up if no specific suggestions
  if (suggestions.length === 0 && (analysis.actionItems.length > 0 || analysis.requiredActions?.length)) {
    const actionItems = analysis.requiredActions || analysis.actionItems;
    suggestions.push({
      id: `followup-${email.id}`,
      emailId: email.id,
      type: "followup",
      title: `Follow up with ${senderName}`,
      description: actionItems.join(". "),
      generatedResponse: `Hi ${firstName},\n\nThanks for reaching out! ${actionItems[0] || "I'll review this and get back to you."}\n\nBest,\n[Your Name]`,
      actionItems,
      priority: analysis.priority,
      createdAt: new Date(),
    });
  }

  return suggestions;
}

