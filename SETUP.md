# Setup Guide for InboxZero

## What You Need to Provide

### 1. x.ai (Grok) API Key

1. Go to [x.ai Console](https://x.ai/) or your x.ai account
2. Navigate to API Keys section
3. Copy your existing API key (starts with `xai-...`)
4. Or create a new one if needed

### 2. Google Cloud Setup (Gmail + Calendar APIs)

#### Step 1: Create/Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name

#### Step 2: Enable APIs
1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable:
   - **Gmail API**
   - **Google Calendar API**

#### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in app name: "InboxZero"
   - Add your email as a test user
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/calendar.readonly`
   - Save and continue through the steps

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "InboxZero Web Client"
   - Authorized redirect URIs: 
     - For development: `http://localhost:3000/api/auth/callback`
     - For production: `https://yourdomain.com/api/auth/callback`
   - Click **Create**

5. **Copy these values:**
   - **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abcdefghijklmnop`)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# x.ai (Grok) API - Use GROK_API_KEY or XAI_API_KEY (both work)
GROK_API_KEY=your_grok_api_key_here
```

**Important:** 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Replace the placeholder values with your actual credentials

## Quick Start After Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local`** with your credentials (see above)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Go to `http://localhost:3000`
   - Click "Go to Dashboard"
   - Click "Connect with Google"
   - Authorize the app
   - You'll be redirected back with your access token

5. **Process emails:**
   - Click "Process Emails" button
   - Wait for analysis (may take a minute for multiple emails)
   - View your action items and suggestions!

## Troubleshooting

### "Invalid credentials" error
- Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Make sure the redirect URI matches exactly (including `http://` vs `https://`)

### "API not enabled" error
- Go back to Google Cloud Console
- Make sure both Gmail API and Calendar API are enabled

### "Access denied" during OAuth
- Make sure you added your email as a test user in the OAuth consent screen
- If using "External" app type, you may need to publish the app (or keep it in testing mode with test users)

### Grok/x.ai API errors
- Verify your `GROK_API_KEY` (or `XAI_API_KEY`) is correct
- Check your x.ai account has credits/quota available
- Make sure you're using a valid model name (currently using `grok-beta`)

## Next Steps

Once you have everything working:
1. Test with a few emails
2. Check that calendar availability is working
3. Verify LinkedIn notifications are being detected
4. Ready to push to GitHub!

