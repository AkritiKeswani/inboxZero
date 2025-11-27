import { Email, EmailAnalysis, CalendarAvailability, Suggestion } from "@/types";
import { format, addDays, parseISO } from "date-fns";

export function generateSuggestions(
  email: Email,
  analysis: EmailAnalysis,
  calendarAvailabilities: CalendarAvailability[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Handle scheduling requests
  if (analysis.intent === "schedule" && analysis.constraints.dates) {
    for (const availability of calendarAvailabilities) {
      if (availability.availableSlots.length > 0) {
        const firstSlot = availability.availableSlots[0];
        const suggestedTime = format(
          parseISO(firstSlot.start),
          "EEEE, MMMM d 'at' h:mm a"
        );

        suggestions.push({
          id: `sched-${email.id}-${availability.date}`,
          emailId: email.id,
          type: "schedule",
          title: `Schedule call with ${email.fromName}`,
          description: `Suggested time: ${suggestedTime}. ${analysis.actionItems.join(", ")}`,
          suggestedTime: firstSlot.start,
          actionItems: analysis.actionItems,
          priority: analysis.priority,
          createdAt: new Date(),
        });
      }
    }
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

      suggestions.push({
        id: `deadline-${email.id}-${deadline.getTime()}`,
        emailId: email.id,
        type: "deadline",
        title: `Deadline: ${analysis.actionItems[0] || "Complete task"}`,
        description: `Due: ${format(deadline, "EEEE, MMMM d, yyyy")}`,
        deadline,
        actionItems: analysis.actionItems,
        priority: analysis.priority,
        createdAt: new Date(),
      });
    }
  }

  // Handle multi-step processes
  if (analysis.intent === "multi-step") {
    analysis.actionItems.forEach((actionItem, index) => {
      suggestions.push({
        id: `multistep-${email.id}-${index}`,
        emailId: email.id,
        type: "followup",
        title: `Step ${index + 1}: ${actionItem}`,
        description: `Part of multi-step process with ${email.fromName}`,
        actionItems: [actionItem],
        priority: index === 0 ? "high" : analysis.priority,
        createdAt: new Date(),
      });
    });
  }

  // Handle LinkedIn follow-ups
  if (
    analysis.intent === "linkedin-followup" ||
    (analysis.platform === "linkedin" && analysis.linkedInProfileUrl)
  ) {
    suggestions.push({
      id: `linkedin-${email.id}`,
      emailId: email.id,
      type: "linkedin-followup",
      title: `Follow up with ${email.fromName} on LinkedIn`,
      description: `Continue conversation on LinkedIn. ${analysis.actionItems.join(", ")}`,
      actionItems: analysis.actionItems,
      priority: analysis.priority,
      linkedInProfileUrl: analysis.linkedInProfileUrl || email.linkedInProfileUrl,
      createdAt: new Date(),
    });
  }

  // Generic follow-up if no specific suggestions
  if (suggestions.length === 0 && analysis.actionItems.length > 0) {
    suggestions.push({
      id: `followup-${email.id}`,
      emailId: email.id,
      type: "followup",
      title: `Follow up with ${email.fromName}`,
      description: analysis.actionItems.join(". "),
      actionItems: analysis.actionItems,
      priority: analysis.priority,
      createdAt: new Date(),
    });
  }

  return suggestions;
}

