# How Email Processing Works

## The Flow (Step by Step)

### 1. User Clicks "Process Emails"
**Frontend:** `app/dashboard/page.tsx`
- Gets access token from localStorage
- Sends POST request to `/api/emails` with token

### 2. Backend Receives Request
**Backend:** `app/api/emails/route.ts`
- Validates access token
- Calls `fetchEmails(accessToken, 12)` - Gets top 12 most recent emails

### 3. Fetch Emails from Gmail
**Gmail API:** `lib/gmail.ts`
- Makes API call: `gmail.users.messages.list()` - Gets list of message IDs
- For each message, calls: `gmail.users.messages.get()` - Gets full email content
- Parses email: extracts headers (from, subject, date), body, detects LinkedIn notifications
- Returns array of Email objects

### 4. Analyze Each Email
**Grok API:** `lib/grok.ts`
- For each email, calls Grok API with email content
- Grok analyzes and extracts:
  - Intent (schedule, deadline, multi-step, etc.)
  - Constraints (dates, times, requirements)
  - Action items
  - Priority (high/medium/low)
- Returns EmailAnalysis object

### 5. Filter Substantive Emails
**Backend:** `app/api/emails/route.ts`
- Skips emails that are:
  - Intent: "other" AND Priority: "low" (likely spam/not relevant)
- Only processes job-search related emails

### 6. Check Calendar (if needed)
**Calendar API:** `lib/calendar.ts`
- If intent is "schedule" and dates are mentioned:
  - Calls Google Calendar API
  - Checks availability for those dates
  - Returns available time slots

### 7. Generate Suggestions
**Suggestions:** `lib/suggestions.ts`
- Based on analysis + calendar availability
- Creates actionable suggestions:
  - Schedule suggestions with available times
  - Deadline reminders
  - Multi-step task breakdowns
  - LinkedIn follow-ups

### 8. Return Results
**Backend:** `app/api/emails/route.ts`
- Serializes dates to ISO strings (JSON can't handle Date objects)
- Returns array of results with:
  - Email data
  - Analysis
  - Suggestions

### 9. Display in UI
**Frontend:** `app/dashboard/page.tsx`
- Parses dates back from ISO strings to Date objects
- Displays emails and suggestions in clean UI

## Current Optimizations

1. **Limited to 12 emails** - Focus on most recent, substantive content
2. **Sequential processing** - Avoids rate limits, ensures quality
3. **Smart filtering** - Skips low-priority "other" emails (likely spam)
4. **Error handling** - Continues processing if one email fails
5. **Date serialization** - Properly handles Date objects in JSON

## API Calls Made

For 12 emails:
- 1 call: `gmail.users.messages.list()` - Get message IDs
- 12 calls: `gmail.users.messages.get()` - Get each email
- 12 calls: Grok API - Analyze each email
- 0-12 calls: Calendar API - Only if scheduling needed

Total: ~25-37 API calls for 12 emails

## Rate Limits

- **Gmail API:** 250 quota units/second per user
- **Grok API:** Depends on your plan
- **Calendar API:** 1,000,000 queries/day

Current implementation processes sequentially to stay within limits.

