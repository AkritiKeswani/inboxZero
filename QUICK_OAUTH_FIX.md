# Quick Fix: "OAuth client was not found"

## The Problem

Your `.env` file has placeholder values instead of real Google OAuth credentials:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here  ❌ This is a placeholder!
GOOGLE_CLIENT_SECRET=your_google_client_secret_here  ❌ This is a placeholder!
```

Google can't find an OAuth client because these aren't real credentials.

## The Solution: Get Your Real Credentials

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account (`akritikeswani76@gmail.com`)

### Step 2: Create or Select a Project

- If you don't have a project, click **"New Project"**
- Name it: `InboxZero`
- Click **Create**

### Step 3: Enable APIs

1. Go to **APIs & Services** > **Library** (left sidebar)
2. Search for **"Gmail API"** → Click it → Click **"Enable"**
3. Go back to Library
4. Search for **"Google Calendar API"** → Click it → Click **"Enable"**

### Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** → Click **Create**
3. Fill in:
   - **App name**: `InboxZero`
   - **User support email**: `akritikeswani76@gmail.com`
   - **Developer contact**: `akritikeswani76@gmail.com`
4. Click **Save and Continue**
5. On **Scopes** page:
   - Click **Add or Remove Scopes**
   - Search and add: `https://www.googleapis.com/auth/gmail.readonly`
   - Search and add: `https://www.googleapis.com/auth/calendar.readonly`
   - Click **Update** → **Save and Continue**
6. On **Test users** page:
   - Click **Add Users**
   - Add: `akritikeswani76@gmail.com`
   - Click **Save and Continue**
7. Click **Back to Dashboard**

### Step 5: Create OAuth Credentials (THIS IS THE KEY STEP!)

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, complete the consent screen first (Step 4)
4. Choose **Web application**
5. Name: `InboxZero Web Client`
6. **Authorized redirect URIs** → Click **Add URI**:
   ```
   http://localhost:3000/api/auth/callback
   ```
   ⚠️ **IMPORTANT:** Must be EXACTLY this (no trailing slash, http not https)
7. Click **Create**
8. **COPY THESE VALUES IMMEDIATELY** (you won't see the secret again):
   - **Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

### Step 6: Update Your .env File

Open `.env` in your project root and replace the placeholders:

```bash
# Replace these placeholder values:
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# With your REAL values from Step 5:
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Example:**
```bash
GOOGLE_CLIENT_ID=987654321-xyz123abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefghijklmnop
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### Step 7: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

**Important:** Next.js only reads `.env` when it starts. You MUST restart after changing `.env`.

### Step 8: Verify It's Working

1. Visit: http://localhost:3000/api/debug-env
2. You should see:
   ```json
   {
     "status": "✅ Ready",
     "clientIdValue": "123456789-abc...",
     "clientSecretValue": "✅ Set (hidden)"
   }
   ```
3. If you see "❌ PLACEHOLDER VALUE", your `.env` still has placeholders

### Step 9: Try Again

1. Go to http://localhost:3000/dashboard
2. Click "Connect with Google"
3. It should work now! 🎉

## Still Not Working?

### Check Your .env File Format

Make sure there are NO spaces around the `=`:

✅ **Correct:**
```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

❌ **Wrong:**
```bash
GOOGLE_CLIENT_ID = 123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
```

### Verify Redirect URI Matches EXACTLY

In Google Cloud Console, the redirect URI must be:
```
http://localhost:3000/api/auth/callback
```

Not:
- `http://localhost:3000/api/auth/callback/` (trailing slash)
- `https://localhost:3000/api/auth/callback` (https)
- `http://127.0.0.1:3000/api/auth/callback` (IP address)

### Check Server Logs

When you click "Connect with Google", check your terminal. You should see the auth URL being generated. If you see errors about missing environment variables, your `.env` isn't being read.

## Summary

1. ✅ Create OAuth client in Google Cloud Console
2. ✅ Copy Client ID and Secret
3. ✅ Paste into `.env` file (replace placeholders)
4. ✅ Restart `npm run dev`
5. ✅ Test at `/api/debug-env`
6. ✅ Try connecting again

That's it! The error happens because Google can't find a client with ID "your_google_client_id_here" - you need to use your real Client ID from Google Cloud Console.

