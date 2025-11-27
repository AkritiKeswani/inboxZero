export interface UserPreferences {
  // User background
  skills: string[];
  pastRoles: string[];
  desiredRoles: string[];
  
  // Company priorities
  highPriorityCompanies: string[];
  mediumPriorityCompanies: string[];
  lowPriorityCompanies: string[];
  
  // Role priorities
  highPriorityRoles: string[];
  mediumPriorityRoles: string[];
  
  // Keywords that indicate high priority
  highPriorityKeywords: string[];
  
  // Keywords that indicate low priority (spam filters)
  lowPriorityKeywords: string[];
  
  // Preferred response time (in hours)
  preferredResponseTime: number;
  
  // Urgent indicators
  urgentIndicators: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  skills: [],
  pastRoles: [],
  desiredRoles: [],
  highPriorityCompanies: [],
  mediumPriorityCompanies: [],
  lowPriorityCompanies: [],
  highPriorityRoles: [],
  mediumPriorityRoles: [],
  highPriorityKeywords: ["interview", "deadline", "urgent", "asap", "final round", "offer"],
  lowPriorityKeywords: ["unsubscribe", "newsletter", "promotion", "marketing"],
  preferredResponseTime: 24,
  urgentIndicators: ["deadline", "due", "by", "asap", "urgent", "immediately"],
};

