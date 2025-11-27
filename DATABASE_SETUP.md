# Database Setup Guide

InboxZero uses Supabase (PostgreSQL) for persistent storage of email records, constraints, suggestions, and follow-up tracking.

## Quick Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be provisioned

### 2. Get Your Credentials

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for client-side)
   - **service_role key** (for server-side, keep this secret!)

### 3. Set Environment Variables

Add these to your `.env` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `lib/db/schema.ts` and copy the `SQL_SCHEMA` constant content
4. Paste it into the SQL Editor
5. Click "Run" to execute

Alternatively, you can run the SQL directly:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email records table
CREATE TABLE IF NOT EXISTS email_records (
  id TEXT PRIMARY KEY,
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
```

### 5. Verify Setup

The app will automatically detect if the database is configured. If the environment variables are set correctly, emails and suggestions will be saved to the database when processing emails.

## Database Schema Overview

### `email_records`
Stores raw email metadata from Gmail API.

### `email_constraints`
Stores extracted constraints and analysis from Claude API, including:
- Intent (schedule_call, send_resume, deadline, etc.)
- Constraints (dates, times, deadlines, requirements)
- Sender information
- Priority and company category

### `email_suggestions`
Stores generated suggestions with:
- Response templates
- Time slots
- Attachments needed
- Status (pending/completed/dismissed)

### `follow_up_tracking`
Tracks follow-ups that need reminders:
- Deadline tracking
- Reminder count
- Status (pending/completed/overdue/dismissed)

## Optional: Row Level Security (RLS)

For production, consider enabling Row Level Security in Supabase to ensure users can only access their own data:

```sql
-- Enable RLS
ALTER TABLE email_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your auth setup)
CREATE POLICY "Users can view own emails" ON email_records
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own constraints" ON email_constraints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_records 
      WHERE email_records.id = email_constraints.email_id 
      AND email_records.user_id = auth.uid()::text
    )
  );
```

## Troubleshooting

### Database not saving emails?

1. Check that environment variables are set correctly
2. Verify the schema was created successfully
3. Check browser console and server logs for errors
4. Ensure `userId` is being passed when calling the email processing API

### Connection errors?

1. Verify your Supabase project URL is correct
2. Check that your API keys are valid
3. Ensure your Supabase project is not paused (free tier projects pause after inactivity)

