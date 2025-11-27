# Google OAuth Setup - Quick Guide

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Click the project dropdown at the top
- Click "New Project" or select an existing one
- Give it a name like "InboxZero" and click "Create"

### 3. Enable Required APIs
1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for **"Gmail API"** → Click it → Click **"Enable"**
3. Go back to Library
4. Search for **"Google Calendar API"** → Click it → Click **"Enable"**

### 4. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Click **Create**
4. Fill in:
   - **App name**: `InboxZero`
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Add or Remove Scopes**
   - Search and add: `https://www.googleapis.com/auth/gmail.readonly`
   - Search and add: `https://www.googleapis.com/auth/calendar.readonly`
   - Click **Update** → **Save and Continue**
7. On **Test users** page:
   - Click **Add Users**
   - Add your email address
   - Click **Save and Continue**
8. Click **Back to Dashboard**

### 5. Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, complete the consent screen first (see step 4)
4. Choose **Web application**
5. Name it: `InboxZero Web Client`
6. **Authorized redirect URIs** - Click **Add URI**:
   - For local development: `http://localhost:3000/api/auth/callback`
   - (Add production URL later if needed)
7. Click **Create**
8. **IMPORTANT**: Copy these values immediately (you won't see the secret again):
   - **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc...`)

### 6. Add to Your .env.local File

Create or edit `.env.local` in your project root:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# x.ai (Grok) API - Use GROK_API_KEY or XAI_API_KEY (both work)
GROK_API_KEY=your_grok_api_key_here
```

### 7. Test It!

1. Run your dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Go to Dashboard"
4. Click "Connect with Google"
5. You should see the OAuth consent screen
6. Authorize the app
7. You'll be redirected back to the dashboard

## Common Issues

**"Redirect URI mismatch"**
- Make sure the redirect URI in Google Console EXACTLY matches: `http://localhost:3000/api/auth/callback`
- Check for typos, extra spaces, or missing `http://`

**"Access blocked"**
- Make sure you added your email as a test user in the OAuth consent screen
- The app is in "Testing" mode, so only test users can access it

**"Invalid client"**
- Double-check you copied the Client ID and Secret correctly
- Make sure there are no extra spaces in your `.env.local` file

## That's It!

Once you have both:
- ✅ Google OAuth credentials in `.env.local`
- ✅ x.ai API key in `.env.local`

You're ready to process emails! 🎉

