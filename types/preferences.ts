export interface UserPreferences {
  // User background
  skills: string[];
  pastRoles: string[];
  desiredRoles: string[];
  
  // Company priorities - AI will categorize based on these descriptions
  highPriorityCompanyTypes: string; // e.g., "AI companies, unicorn startups ($1B+), modern tech like Figma, xAI"
  mediumPriorityCompanyTypes: string; // e.g., "Enterprise companies like Salesforce, Oracle"
  lowPriorityCompanyTypes: string; // e.g., "Old-school firms like PWC, accounting firms, traditional companies"
  
  // Legacy fields (kept for backward compatibility, but not used)
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
  highPriorityCompanyTypes: "AI companies, unicorn startups ($1B+ valuation), modern tech companies like Figma, xAI, Anthropic",
  mediumPriorityCompanyTypes: "Enterprise companies like Salesforce, Oracle, Microsoft (not as startup-y)",
  lowPriorityCompanyTypes: "Old-school firms like PWC, accounting firms, traditional consulting companies",
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

