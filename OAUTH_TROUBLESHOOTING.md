# OAuth Troubleshooting - "OAuth client was not found"

## The Error You're Seeing

```
Error 401: invalid_client
The OAuth client was not found.
```

This means Google can't find your OAuth client. Here's how to fix it.

## Step-by-Step Fix

### 1. Check Your .env File

Make sure you have a `.env` file (not `.env.local`) in the project root with:

```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Common mistakes:**
- ❌ Using `.env.local` instead of `.env` (Next.js reads `.env` by default)
- ❌ Missing quotes around values
- ❌ Extra spaces: `GOOGLE_CLIENT_ID = value` (should be `GOOGLE_CLIENT_ID=value`)
- ❌ Using placeholder text instead of real values

### 2. Verify Your Google Cloud Console Setup

#### A. Check OAuth Client Exists

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Look for your OAuth 2.0 Client ID
5. **If it doesn't exist**, create one:
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Name: `InboxZero Web Client`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback`
   - Click **Create**
   - **Copy the Client ID and Client Secret immediately**

#### B. Verify Redirect URI Matches EXACTLY

The redirect URI in Google Console must match EXACTLY:

✅ **Correct:**
```
http://localhost:3000/api/auth/callback
```

❌ **Wrong:**
```
http://localhost:3000/api/auth/callback/  (trailing slash)
https://localhost:3000/api/auth/callback  (https instead of http)
http://127.0.0.1:3000/api/auth/callback  (IP instead of localhost)
```

#### C. Check OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure it's configured:
   - App name: `InboxZero`
   - User support email: Your email
   - **Scopes added:**
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/calendar.readonly`
   - **Test users:** Add your email (`akritikeswani76@gmail.com`)

### 3. Restart Your Dev Server

After updating `.env`:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

**Important:** Next.js only reads `.env` on startup. Changes require a restart.

### 4. Verify Environment Variables Are Loaded

Add this temporary debug endpoint to check:

**File:** `app/api/debug-env/route.ts` (create this file)

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
}
```

Then visit: `http://localhost:3000/api/debug-env`

**Expected output:**
```json
{
  "hasClientId": true,
  "hasClientSecret": true,
  "hasRedirectUri": true,
  "clientIdPrefix": "123456789-abc...",
  "redirectUri": "http://localhost:3000/api/auth/callback"
}
```

If any are `false`, your `.env` isn't being read correctly.

### 5. Check the Actual Auth URL Being Generated

When you click "Connect with Google", check the browser console or Network tab:

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Connect with Google"
4. Look for the request to `/api/auth/google`
5. Check the response - it should contain an `authUrl`
6. Copy that URL and check:
   - Does it contain your `client_id`?
   - Does it have the correct `redirect_uri`?

## Quick Checklist

- [ ] `.env` file exists in project root (not `.env.local`)
- [ ] `GOOGLE_CLIENT_ID` has a real value (not placeholder)
- [ ] `GOOGLE_CLIENT_SECRET` has a real value (not placeholder)
- [ ] `GOOGLE_REDIRECT_URI` is exactly: `http://localhost:3000/api/auth/callback`
- [ ] OAuth client exists in Google Cloud Console
- [ ] Redirect URI in Google Console matches exactly
- [ ] OAuth consent screen is configured
- [ ] Your email is added as a test user
- [ ] Dev server restarted after `.env` changes
- [ ] Gmail API and Calendar API are enabled

## Still Not Working?

### Option 1: Create a Fresh OAuth Client

1. Go to Google Cloud Console > Credentials
2. Delete the old OAuth client (if it exists)
3. Create a new one:
   - Type: Web application
   - Name: `InboxZero Web Client`
   - Redirect URI: `http://localhost:3000/api/auth/callback`
4. Copy the new Client ID and Secret
5. Update `.env` with new values
6. Restart dev server

### Option 2: Check Server Logs

When you click "Connect with Google", check your terminal where `npm run dev` is running. Look for:
- Any error messages
- The actual auth URL being generated
- Any warnings about missing environment variables

### Option 3: Test with curl

```bash
# Get the auth URL from your API
curl http://localhost:3000/api/auth/google

# Should return something like:
# {"authUrl":"https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&..."}
```

If the `client_id` in the URL doesn't match your Google Console client ID, your `.env` isn't being read.

## Common Issues

### Issue: "I created the OAuth client but it still doesn't work"

**Solution:** 
- Make sure you're using the correct project in Google Cloud Console
- Verify the Client ID in `.env` matches the one in Console
- Check for typos (extra spaces, missing characters)

### Issue: "It works sometimes but not others"

**Solution:**
- This might be a caching issue - clear browser cache
- Or token expiration - make sure you're getting a fresh auth URL each time

### Issue: "The redirect URI doesn't match"

**Solution:**
- In Google Console, the redirect URI must be EXACTLY: `http://localhost:3000/api/auth/callback`
- No trailing slash
- Must be `http://` not `https://`
- Must be `localhost` not `127.0.0.1`

## Need More Help?

1. Check the actual error in browser DevTools Console
2. Check server logs in terminal
3. Verify your `.env` file format is correct (no spaces around `=`)
4. Make sure you're using the right Google Cloud project

