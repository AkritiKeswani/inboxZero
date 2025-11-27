/**
 * Database client for Supabase
 * 
 * To use this, set up Supabase:
 * 1. Create a project at https://supabase.com
 * 2. Get your project URL and anon key
 * 3. Set environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
 * 4. Run the SQL schema from schema.ts in your Supabase SQL editor
 */

import { createClient } from "@supabase/supabase-js";
import { EmailRecord, EmailConstraints, EmailSuggestion, FollowUpTracking } from "./schema";
import { Email, EmailAnalysis } from "@/types";
import { EnhancedSuggestion } from "@/lib/suggestions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Client for server-side operations (uses service role key for admin access)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Save email record to database
 */
export async function saveEmailRecord(
  userId: string,
  email: Email,
  analysis: EmailAnalysis
): Promise<void> {
  try {
    // Upsert email record
    const { error: emailError } = await supabase
      .from("email_records")
      .upsert({
        id: email.id,
        thread_id: email.threadId,
        user_id: userId,
        subject: email.subject,
        sender: email.from,
        sender_name: email.fromName,
        sender_email: email.from,
        company_name: analysis.companyName,
        received_date: email.date.toISOString(),
        body: email.body,
        snippet: email.snippet,
        is_linkedin_notification: email.isLinkedInNotification,
        linkedin_profile_url: email.linkedInProfileUrl,
      }, {
        onConflict: "id",
      });

    if (emailError) {
      console.error("Error saving email record:", emailError);
      throw emailError;
    }

    // Save constraints
    const { error: constraintsError } = await supabase
      .from("email_constraints")
      .upsert({
        email_id: email.id,
        intent: analysis.intent,
        constraints_json: analysis.constraints,
        constraints_text: analysis.constraintsText,
        required_actions: analysis.requiredActions || analysis.actionItems,
        action_items: analysis.actionItems,
        sender_info: analysis.senderInfo,
        priority: analysis.priority,
        company_category: analysis.companyCategory,
      }, {
        onConflict: "email_id",
      });

    if (constraintsError) {
      console.error("Error saving email constraints:", constraintsError);
      throw constraintsError;
    }
  } catch (error) {
    console.error("Error saving email to database:", error);
    // Don't throw - allow processing to continue even if DB save fails
  }
}

/**
 * Save suggestions to database
 */
export async function saveSuggestions(
  emailId: string,
  suggestions: EnhancedSuggestion[]
): Promise<void> {
  try {
    const suggestionsToSave = suggestions.map((suggestion) => ({
      id: suggestion.id,
      email_id: emailId,
      type: suggestion.type,
      title: suggestion.title,
      description: suggestion.description,
      generated_response: suggestion.generatedResponse,
      time_slots: suggestion.timeSlots,
      attachments_needed: suggestion.attachmentsNeeded,
      suggested_time: suggestion.suggestedTime,
      deadline: suggestion.deadline,
      action_items: suggestion.actionItems,
      priority: suggestion.priority,
      linkedin_profile_url: suggestion.linkedInProfileUrl,
      status: "pending" as const,
    }));

    const { error } = await supabase
      .from("email_suggestions")
      .upsert(suggestionsToSave, {
        onConflict: "id",
      });

    if (error) {
      console.error("Error saving suggestions:", error);
      throw error;
    }

    // Create follow-up tracking entries for suggestions with deadlines
    const followUps = suggestions
      .filter((s) => s.deadline || s.priority === "high")
      .map((suggestion) => ({
        email_id: emailId,
        suggestion_id: suggestion.id,
        status: "pending" as const,
        deadline: suggestion.deadline,
        priority: suggestion.priority,
        reminder_count: 0,
      }));

    if (followUps.length > 0) {
      const { error: followUpError } = await supabase
        .from("follow_up_tracking")
        .upsert(followUps, {
          onConflict: "email_id,suggestion_id",
        });

      if (followUpError) {
        console.error("Error saving follow-up tracking:", followUpError);
      }
    }
  } catch (error) {
    console.error("Error saving suggestions to database:", error);
    // Don't throw - allow processing to continue
  }
}

/**
 * Get pending follow-ups for a user
 */
export async function getPendingFollowUps(userId: string): Promise<FollowUpTracking[]> {
  try {
    const { data, error } = await supabase
      .from("follow_up_tracking")
      .select(`
        *,
        email_records!inner(user_id)
      `)
      .eq("email_records.user_id", userId)
      .eq("status", "pending")
      .order("deadline", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching pending follow-ups:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching pending follow-ups:", error);
    return [];
  }
}

/**
 * Get overdue follow-ups
 */
export async function getOverdueFollowUps(userId: string): Promise<FollowUpTracking[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("follow_up_tracking")
      .select(`
        *,
        email_records!inner(user_id)
      `)
      .eq("email_records.user_id", userId)
      .eq("status", "pending")
      .lt("deadline", now);

    if (error) {
      console.error("Error fetching overdue follow-ups:", error);
      return [];
    }

    // Update status to overdue
    if (data && data.length > 0) {
      const ids = data.map((f) => f.id);
      await supabase
        .from("follow_up_tracking")
        .update({ status: "overdue" })
        .in("id", ids);
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching overdue follow-ups:", error);
    return [];
  }
}

/**
 * Mark suggestion as completed
 */
export async function markSuggestionCompleted(
  suggestionId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("email_suggestions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", suggestionId);

    if (error) {
      console.error("Error marking suggestion as completed:", error);
      throw error;
    }

    // Update follow-up tracking
    await supabase
      .from("follow_up_tracking")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("suggestion_id", suggestionId);
  } catch (error) {
    console.error("Error marking suggestion as completed:", error);
    throw error;
  }
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

