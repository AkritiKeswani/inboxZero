# Gmail Integration Development Guide

## Current Implementation Overview

The Gmail integration consists of:

1. **OAuth Flow** (`lib/gmail.ts`, `app/api/auth/*`)
   - Generates Google OAuth URL
   - Handles callback and token exchange
   - Creates authenticated Gmail client

2. **Email Fetching** (`lib/gmail.ts::fetchEmails`)
   - Fetches unread/inbox emails
   - Extracts headers (from, subject, date)
   - Parses email body (text/plain)
   - Detects LinkedIn notifications
   - Extracts LinkedIn profile URLs

## Current Flow

```
User clicks "Connect with Google"
  ↓
GET /api/auth/google → Returns OAuth URL
  ↓
User authorizes in Google
  ↓
GET /api/auth/callback?code=... → Exchanges code for token
  ↓
Redirects to /dashboard?token=...
  ↓
Dashboard stores token in localStorage
  ↓
User clicks "Process Emails"
  ↓
POST /api/emails → Uses token to fetch emails via Gmail API
```

## Testing the Gmail Integration

### Step 1: Set Up Your Environment

Make sure your `.env` has:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### Step 2: Test OAuth Flow

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/dashboard`
3. Click "Connect with Google"
4. Check browser console for any errors
5. Verify you get redirected back with a token

### Step 3: Test Email Fetching

1. After connecting, click "Process Emails"
2. Check browser Network tab for `/api/emails` request
3. Check server console for any Gmail API errors
4. Verify emails appear in the dashboard

## Areas to Improve

### 1. Email Body Parsing
**Current:** Only handles `text/plain` in multipart emails
**Needed:** Handle HTML emails, nested multipart, attachments

### 2. Token Refresh
**Current:** Access tokens expire after 1 hour
**Needed:** Implement refresh token handling

### 3. Email Filtering
**Current:** Basic query `is:unread OR in:inbox`
**Needed:** More sophisticated filtering (by sender, date, labels)

### 4. Error Handling
**Current:** Basic try/catch
**Needed:** Better error messages, retry logic, rate limit handling

### 5. Thread Handling
**Current:** Fetches individual messages
**Needed:** Group by thread, show conversation context

## Next Steps

1. **Improve email body extraction** - Handle HTML and nested multipart
2. **Add token refresh** - Store refresh token, auto-refresh expired tokens
3. **Better error handling** - User-friendly error messages
4. **Add email filtering UI** - Let users filter by date, sender, etc.
5. **Thread grouping** - Show email threads instead of individual messages

