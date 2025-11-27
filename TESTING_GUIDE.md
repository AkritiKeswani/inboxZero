# Testing Guide - Now That Google OAuth is Set Up

## Quick Test Checklist

### ✅ Step 1: Verify Environment Variables

1. Make sure your `.env` has:
   ```bash
   GOOGLE_CLIENT_ID=your_actual_client_id
   GOOGLE_CLIENT_SECRET=your_actual_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
   GROK_API_KEY=your_grok_api_key
   ```

2. Test the config:
   ```bash
   # Visit this URL in your browser:
   http://localhost:3000/api/debug-env
   ```
   Should show: `"status": "✅ Ready"`

### ✅ Step 2: Start the Dev Server

```bash
npm run dev
```

### ✅ Step 3: Test OAuth Flow

1. Go to: http://localhost:3000
2. Click "Go to Dashboard"
3. Click "Connect with Google"
4. You should be redirected to Google login
5. Sign in with your Gmail account
6. Click "Allow" to authorize the app
7. You should be redirected back to the dashboard
8. The dashboard should now show you're authenticated

### ✅ Step 4: Test Email Fetching

1. In the dashboard, click "Process Emails"
2. Watch the browser console (F12) for any errors
3. Check the server terminal for logs
4. Emails should appear in the dashboard

## What to Expect

### Successful OAuth Flow:
- ✅ Redirects to Google
- ✅ Shows consent screen with Gmail and Calendar permissions
- ✅ Redirects back to dashboard with token
- ✅ Dashboard shows "Process Emails" button enabled

### Successful Email Processing:
- ✅ "Process Emails" button shows loading state
- ✅ Emails appear in the "Recent Emails" section
- ✅ Action items appear in the "Action Items" section
- ✅ Each email shows: sender, subject, date, analysis

## Common Issues & Fixes

### Issue: "Still getting OAuth error"
**Fix:**
- Make sure you restarted `npm run dev` after updating `.env`
- Check `/api/debug-env` to verify env vars are loaded
- Verify redirect URI in Google Console matches exactly

### Issue: "Process Emails returns no results"
**Possible causes:**
- No unread emails in inbox
- Gmail API quota exceeded (wait a few minutes)
- Access token expired (reconnect)

**Fix:**
- Check if you have unread emails in Gmail
- Try the query: `in:inbox` instead of `is:unread OR in:inbox`
- Check server logs for Gmail API errors

### Issue: "Grok API errors"
**Fix:**
- Verify `GROK_API_KEY` is set correctly
- Check your x.ai account has credits
- Check server logs for specific error messages

## Testing Different Scenarios

### Test 1: Scheduling Email
Send yourself an email like:
```
Subject: Interview Scheduling
Body: Can we schedule a call next Friday afternoon?
```

Expected: InboxZero should detect "schedule" intent and check your calendar.

### Test 2: Deadline Email
Send yourself an email like:
```
Subject: Resume Submission
Body: Please send your resume by Thursday.
```

Expected: InboxZero should create a deadline suggestion.

### Test 3: LinkedIn Notification
If you have LinkedIn email notifications enabled, InboxZero should:
- Detect it's a LinkedIn notification
- Extract LinkedIn profile URL if present
- Create a "Follow up on LinkedIn" suggestion

## Next Steps After Testing

Once everything works:

1. **Customize Email Queries**
   - Edit `lib/gmail.ts` → `fetchEmails()` function
   - Change the query: `q: "is:unread OR in:inbox"`
   - Examples:
     - `q: "from:recruiter@company.com"`
     - `q: "subject:interview"`
     - `q: "newer_than:7d"`

2. **Improve Email Analysis**
   - Edit `lib/grok.ts` → `analyzeEmail()` function
   - Customize the prompt for your use case

3. **Add More Features**
   - Database storage (see README)
   - Email reply drafting
   - Calendar event creation
   - Email filtering UI

## Debugging Tips

### Check Server Logs
Watch your terminal where `npm run dev` is running. You'll see:
- OAuth URL generation
- Gmail API calls
- Email analysis results
- Any errors

### Check Browser Console
Open DevTools (F12) → Console tab:
- OAuth redirects
- API call errors
- Token storage

### Check Network Tab
Open DevTools (F12) → Network tab:
- See all API requests
- Check response status codes
- View request/response data

## Success Indicators

✅ **OAuth Working:**
- Can connect to Google
- Token stored in localStorage
- No "invalid_client" errors

✅ **Gmail API Working:**
- Emails appear in dashboard
- No "401 Unauthorized" errors
- Email data is parsed correctly

✅ **Grok API Working:**
- Emails are analyzed
- Suggestions are generated
- No API key errors

## Ready to Test!

Run `npm run dev` and go to http://localhost:3000/dashboard

Good luck! 🚀

