export interface Email {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  date: Date;
  snippet: string;
  isLinkedInNotification: boolean;
  linkedInProfileUrl?: string;
}

export interface EmailAnalysis {
  intent: "schedule_call" | "send_resume" | "deadline" | "technical_assessment" | "multi_step_process" | "linkedin_followup" | "schedule" | "multi-step" | "linkedin-followup" | "other";
  constraints: {
    dates?: string[];
    times?: string[];
    deadlines?: string[];
    requirements?: string[];
    duration?: string; // e.g., "30min", "1 hour"
    timeConstraints?: string; // e.g., "Friday afternoon", "next week"
    specificConstraints?: string[]; // Additional constraints like "only free Friday afternoon"
  };
  actionItems: string[];
  requiredActions?: string[]; // What user needs to do
  senderInfo?: {
    name: string;
    company?: string;
    linkedInProfileUrl?: string;
    email: string;
  };
  linkedInProfileUrl?: string;
  platform: "email" | "linkedin";
  priority: "high" | "medium" | "low";
  companyCategory?: "high" | "medium" | "low" | "unknown"; // AI-determined company priority category
  companyName?: string; // Extracted company name from email
  constraintsText?: string; // Human-readable constraints summary
}

export interface CalendarAvailability {
  date: string;
  availableSlots: {
    start: string;
    end: string;
  }[];
}

export interface Suggestion {
  id: string;
  emailId: string;
  type: "schedule" | "deadline" | "followup" | "linkedin-followup";
  title: string;
  description: string;
  suggestedTime?: string;
  deadline?: Date;
  actionItems: string[];
  priority: "high" | "medium" | "low";
  linkedInProfileUrl?: string;
  createdAt: Date;
}

export interface LinkedInContact {
  recruiterName: string;
  company: string;
  linkedInProfileUrl: string;
  lastMessageDate: Date;
  messagePreview: string;
  platform: "linkedin" | "email";
}

// Re-export preferences
export * from "./preferences";

