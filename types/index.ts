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
  intent: "schedule" | "deadline" | "multi-step" | "linkedin-followup" | "other";
  constraints: {
    dates?: string[];
    times?: string[];
    deadlines?: string[];
    requirements?: string[];
  };
  actionItems: string[];
  linkedInProfileUrl?: string;
  platform: "email" | "linkedin";
  priority: "high" | "medium" | "low";
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

