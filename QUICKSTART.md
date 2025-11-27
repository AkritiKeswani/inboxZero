# 🚀 Quick Start Guide - Get InboxZero Running in 15 Minutes

This guide will help you set up your own InboxZero instance with **your own** Gmail and API keys. No shared credentials - everything is yours!

## Prerequisites Checklist

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] A Gmail account (the one you want to analyze)
- [ ] A Google Cloud account (free tier works)
- [ ] An x.ai account with API access (or use Anthropic Claude if preferred)

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/AkritiKeswani/inboxZero.git
cd inboxZero

# Install dependencies
npm install
```

## Step 2: Get Your x.ai (Grok) API Key (3 minutes)

1. Go to [x.ai](https://x.ai/) and sign up/login
2. Navigate to API Keys section
3. Create a new API key or copy an existing one
4. **Save it somewhere safe** - you'll need it in Step 4

> 💡 **Note:** You can also use Anthropic Claude API if you prefer. Just update the code to use `ANTHROPIC_API_KEY` instead.

## Step 3: Set Up Google OAuth (8 minutes)

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown → **New Project**
3. Name it: `InboxZero` → Click **Create**

### 3.2 Enable APIs

1. Go to **APIs & Services** > **Library**
2. Search for **"Gmail API"** → Click **Enable**
3. Search for **"Google Calendar API"** → Click **Enable**

### 3.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** → Click **Create**
3. Fill in:
   - App name: `InboxZero`
   - User support email: **Your email**
   - Developer contact: **Your email**
4. Click **Save and Continue**
5. On **Scopes** page:
   - Click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/gmail.readonly`
   - Add: `https://www.googleapis.com/auth/calendar.readonly`
   - Click **Update** → **Save and Continue**
6. On **Test users**:
   - Click **Add Users**
   - Add **your Gmail address** (the one you want to analyze)
   - Click **Save and Continue**

### 3.4 Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: `InboxZero Web Client`
5. **Authorized redirect URIs** → Click **Add URI**:
   ```
   http://localhost:3000/api/auth/callback
   ```
6. Click **Create**
7. **IMPORTANT:** Copy these immediately (you won't see the secret again):
   - **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc...`)

## Step 4: Create Your .env File (2 minutes)

1. In the project root, create a file named `.env`:

```bash
# Copy the example file
cp .env.example .env
```

2. Open `.env` and fill in **your own** credentials:

```bash
# Google OAuth - Use YOUR credentials from Step 3.4
GOOGLE_CLIENT_ID=your_client_id_from_google_cloud
GOOGLE_CLIENT_SECRET=your_client_secret_from_google_cloud
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# x.ai (Grok) API - Use YOUR API key from Step 2
GROK_API_KEY=your_xai_api_key_here
```

> ⚠️ **Security Note:** Never commit `.env` to git. It's already in `.gitignore` for your protection.

## Step 5: Run & Test (1 minute)

```bash
# Start the development server
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **"Go to Dashboard"**
3. Click **"Connect with Google"**
4. Sign in with **your Gmail account** (the one you added as a test user)
5. Authorize the app
6. You'll be redirected back to the dashboard
7. Click **"Process Emails"** to analyze your inbox!

## 🎉 You're Done!

Your InboxZero is now running with **your own** credentials. All data stays on your machine - nothing is shared.

## Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Console is exactly: `http://localhost:3000/api/auth/callback`
- No trailing slashes, exact match required

### "Access blocked"
- Make sure you added your email as a test user in OAuth consent screen
- The app is in "Testing" mode - only test users can access

### "Invalid API key"
- Double-check your `GROK_API_KEY` in `.env`
- Make sure there are no extra spaces or quotes
- Verify your x.ai account has credits

### "Cannot read emails"
- Make sure you authorized Gmail access during OAuth
- Check that Gmail API is enabled in Google Cloud Console

## Next Steps

- Customize the email analysis prompts in `lib/grok.ts`
- Add your own priority rules in `lib/suggestions.ts`
- Extend with database storage (see README for options)

## Need Help?

- Check the detailed [SETUP.md](./SETUP.md) for more info
- See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for OAuth details
- Open an issue on GitHub if you encounter problems

---

**Remember:** This is **your** instance. Your emails, your keys, your data. Everything runs locally on your machine! 🔒

