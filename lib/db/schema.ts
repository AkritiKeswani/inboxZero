/**
 * Database schema for InboxZero email tracking and follow-ups
 * 
 * This schema is designed for Supabase (PostgreSQL) but can be adapted for other databases
 */

export interface EmailRecord {
  id: string; // Gmail message ID
  thread_id: string;
  user_id: string; // User identifier (email or user ID)
  subject: string;
  sender: string;
  sender_name: string;
  sender_email: string;
  company_name?: string;
  received_date: Date;
  body: string;
  snippet: string;
  is_linkedin_notification: boolean;
  linkedin_profile_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailConstraints {
  email_id: string;
  intent: "schedule_call" | "send_resume" | "deadline" | "technical_assessment" | "multi_step_process" | "linkedin_followup" | "other";
  constraints_json: {
    dates?: string[];
    times?: string[];
    deadlines?: string[];
    requirements?: string[];
    duration?: string;
    timeConstraints?: string;
    specificConstraints?: string[];
  };
  constraints_text?: string;
  required_actions?: string[];
  action_items?: string[];
  sender_info?: {
    name: string;
    company?: string;
    linkedInProfileUrl?: string;
    email: string;
  };
  priority: "high" | "medium" | "low";
  company_category?: "high" | "medium" | "low" | "unknown";
  created_at: Date;
  updated_at: Date;
}

export interface EmailSuggestion {
  id: string;
  email_id: string;
  type: "schedule" | "deadline" | "followup" | "linkedin-followup";
  title: string;
  description: string;
  generated_response?: string;
  time_slots?: string[];
  attachments_needed?: string[];
  suggested_time?: Date;
  deadline?: Date;
  action_items: string[];
  priority: "high" | "medium" | "low";
  linkedin_profile_url?: string;
  status: "pending" | "completed" | "dismissed";
  created_at: Date;
  updated_at: Date;
  last_reminded?: Date;
}

export interface FollowUpTracking {
  email_id: string;
  suggestion_id?: string;
  status: "pending" | "completed" | "overdue" | "dismissed";
  deadline?: Date;
  priority: "high" | "medium" | "low";
  last_reminded?: Date;
  reminder_count: number;
  completed_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * SQL schema for Supabase/PostgreSQL
 * Run this in your Supabase SQL editor to create the tables
 */
export const SQL_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email records table
CREATE TABLE IF NOT EXISTS email_records (
  id TEXT PRIMARY KEY, -- Gmail message ID
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  company_name TEXT,
  received_date TIMESTAMPTZ NOT NULL,
  body TEXT NOT NULL,
  snippet TEXT,
  is_linkedin_notification BOOLEAN DEFAULT FALSE,
  linkedin_profile_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email constraints table (extracted by Claude)
CREATE TABLE IF NOT EXISTS email_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT NOT NULL REFERENCES email_records(id) ON DELETE CASCADE,
  intent TEXT NOT NULL CHECK (intent IN ('schedule_call', 'send_resume', 'deadline', 'technical_assessment', 'multi_step_process', 'linkedin_followup', 'other')),
  constraints_json JSONB NOT NULL,
  constraints_text TEXT,
  required_actions TEXT[],
  action_items TEXT[],
  sender_info JSONB,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  company_category TEXT CHECK (company_category IN ('high', 'medium', 'low', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email suggestions table
CREATE TABLE IF NOT EXISTS email_suggestions (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL REFERENCES email_records(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('schedule', 'deadline', 'followup', 'linkedin-followup')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  generated_response TEXT,
  time_slots TEXT[],
  attachments_needed TEXT[],
  suggested_time TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  action_items TEXT[] NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  linkedin_profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reminded TIMESTAMPTZ
);

-- Follow-up tracking table
CREATE TABLE IF NOT EXISTS follow_up_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT NOT NULL REFERENCES email_records(id) ON DELETE CASCADE,
  suggestion_id TEXT REFERENCES email_suggestions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'dismissed')),
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  last_reminded TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_records_user_id ON email_records(user_id);
CREATE INDEX IF NOT EXISTS idx_email_records_received_date ON email_records(received_date DESC);
CREATE INDEX IF NOT EXISTS idx_email_constraints_email_id ON email_constraints(email_id);
CREATE INDEX IF NOT EXISTS idx_email_suggestions_email_id ON email_suggestions(email_id);
CREATE INDEX IF NOT EXISTS idx_email_suggestions_status ON email_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_email_id ON follow_up_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_status ON follow_up_tracking(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_deadline ON follow_up_tracking(deadline) WHERE deadline IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_email_records_updated_at BEFORE UPDATE ON email_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_constraints_updated_at BEFORE UPDATE ON email_constraints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_suggestions_updated_at BEFORE UPDATE ON email_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_tracking_updated_at BEFORE UPDATE ON follow_up_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

