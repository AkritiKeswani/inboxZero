# InboxZero - AI Email Assistant for Optimized Job Search

An intelligent email assistant that reads context, checks your calendar, and generates actionable follow-ups for job search communications.

## 🎯 Core Problem

- Forgetting to follow up on opened emails
- Too lazy to check calendar and match recruiter availability
- Missing deadlines for resume submissions or work samples
- Losing track of multi-step interview processes

## 🚀 Features

### Current Implementation

- **Gmail Integration**: Connect your Gmail account via OAuth2
- **Email Analysis**: Uses x.ai (Grok) to extract intent, constraints, and action items
- **Calendar Sync**: Checks Google Calendar for availability
- **Smart Suggestions**: Generates actionable suggestions based on email content and calendar
- **LinkedIn Detection**: Automatically detects LinkedIn notification emails and extracts profile URLs
- **Deadline Tracking**: Identifies and tracks deadlines from emails
- **Multi-step Process Breakdown**: Breaks down complex processes into individual action items

### Future Implementations

- Voice AI Interface for querying next actions
- LinkedIn Integration for cross-platform conversation tracking
- Analytics dashboard for response rates and interview pipeline

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Backend:**
- Next.js API routes
- Google APIs (Gmail, Calendar)
- x.ai (Grok) API

**Database:**
- Currently using in-memory storage (can be extended to Supabase/Postgres)

## 📋 Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Cloud Project with Gmail and Calendar APIs enabled
- x.ai (Grok) API key

### Quick Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/AkritiKeswani/inboxZero.git
   cd inboxZero
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in:
   - `GOOGLE_CLIENT_ID`: From [Google Cloud Console](https://console.cloud.google.com/)
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GROK_API_KEY` or `XAI_API_KEY`: From [x.ai Console](https://x.ai/)

3. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project → Enable **Gmail API** and **Calendar API**
   - Create OAuth 2.0 credentials (Web application)
   - Add redirect URI: `http://localhost:3000/api/auth/callback` (for dev)
   - Add your email as a test user in OAuth consent screen

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 👤 User Guide

### First Time Setup (New Users)

1. **Start the app**
   - Run `npm run dev` and open `http://localhost:3000`
   - You'll see the InboxZero landing page

2. **Set up your profile** (Required first step)
   - Click "Go to Dashboard" → Click "Profile" in the header
   - Fill in your information:
     - **Skills**: Type skills like "React", "TypeScript" and press Enter to add as tags
     - **Past Roles**: Add roles you've held (e.g., "Software Engineer")
     - **Desired Roles**: Add roles you're seeking (e.g., "Staff Engineer")
     - **Company Priorities**: Describe company types you're interested in:
       - High Priority: "AI companies, unicorn startups ($1B+), modern tech like Figma, xAI"
       - Medium Priority: "Enterprise companies like Salesforce, Oracle"
       - Low Priority: "Old-school firms like PWC, accounting firms"
     - **High Priority Keywords**: Add keywords like "interview", "offer", "deadline"
   - Click "Save" - your preferences are stored locally

3. **Connect Gmail**
   - Go back to Dashboard
   - Click "Sign in with Google"
   - Select your Google account
   - Grant permissions for Gmail and Calendar access
   - You'll be redirected back with "Connected" status shown

4. **Process your emails**
   - Click "Process Emails" button
   - Wait for processing (analyzes top 10 emails)
   - Emails are prioritized based on your profile:
     - **High Priority**: Matches your desired roles, skills, or high-priority companies
     - **Medium Priority**: Relevant but not top priority
     - **Low Priority**: Less relevant or spam

5. **Review and take action**
   - Emails are sorted by priority score (highest first)
   - Each email shows:
     - Priority badge (High/Medium/Low)
     - Priority score (0-100)
     - Definitive action item (what you should do)
     - Company name (if detected)
     - Calendar availability (if scheduling needed)
   - Click on emails to see full details and suggestions

### Understanding Your Dashboard

**Header Status:**
- Shows your email address when connected
- "Connected" badge indicates Gmail is authenticated
- "Profile" button to update preferences
- "Logout" button to disconnect

**Email Cards Show:**
- **Priority Score**: 0-100 (higher = more important)
- **Priority Level**: High (70+), Medium (40-69), Low (<40)
- **Definitive Action**: Clear next step (e.g., "Schedule call with John for Friday")
- **Company Category**: AI-determined company priority (high/medium/low)
- **Intent**: What the email is asking for (schedule/deadline/multi-step/etc.)

**How Prioritization Works:**
- Emails matching your **desired roles** get +25 points
- Emails from **high priority company types** get +30 points
- Emails mentioning your **skills** get +15 points each
- **Deadline/schedule** intents get +20-25 points
- **High priority keywords** (interview, offer) get +15 points each
- Final score determines High/Medium/Low priority

### Troubleshooting

**"OAuth not configured" error:**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`

**"Access blocked" error:**
- Add your email as a test user in Google Cloud Console → OAuth consent screen

**"redirect_uri_mismatch" error:**
- Make sure redirect URI in Google Cloud Console matches exactly:
  - Dev: `http://localhost:3000/api/auth/callback`
  - Production: `https://your-domain.vercel.app/api/auth/callback`

**No emails showing:**
- Make sure you have unread emails or emails in inbox
- Check that Gmail API is enabled in Google Cloud Console
- Verify you granted Gmail permissions during OAuth

**Profile not saving:**
- Check browser console for errors
- Make sure you click "Save" button after making changes
- Preferences are stored in browser localStorage

## 📋 Example Scenarios

### Scenario 1: Scheduling with Constraints

**Email:** "Can we chat next Friday afternoon about our role?"

**InboxZero:** Checks calendar → Suggests "Friday 2:30pm works, here's my link"

### Scenario 2: Deadline Tracking

**Email:** "Send resume by Thursday"

**InboxZero:** Creates deadline → Suggests attaching resume → Reminds Wednesday

### Scenario 3: Multi-step Process

**Email:** "Next steps: (1) tech chat, (2) take-home, (3) final round"

**InboxZero:** Breaks into 3 tasks → Prioritizes step 1 → Suggests scheduling

### Scenario 4: LinkedIn Follow-up

**LinkedIn notification email:** "Sarah Johnson sent you a message about a role at Stripe"

**InboxZero:** 
- Extracts LinkedIn profile URL
- After 3 days with no reply, flags: "Follow up with Sarah on LinkedIn - [Open DM]"
- Shows message preview

## 🗺️ Roadmap

**Phase 1: Core Email Intelligence** ✅
- [x] Gmail integration & email ingestion
- [x] Calendar sync & availability checking
- [x] LLM-powered constraint extraction
- [x] Action suggestion engine
- [x] LinkedIn notification parsing

**Phase 2: Enhanced Features** (In Progress)
- [ ] Database integration for persistent storage
- [ ] Cross-platform conversation tracking
- [ ] Analytics dashboard
- [ ] Email reply drafting

**Phase 3: Voice & Advanced AI** (Future)
- [ ] Voice AI interface
- [ ] Priority-based routing
- [ ] Smart batching
- [ ] Auto-draft responses for approval

## 🚀 Deploying to Vercel

### Step 1: Deploy Your App

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your `inboxZero` repository
   - Click "Deploy" (Vercel will auto-detect Next.js settings)

3. **Get your Vercel URL**
   - After deployment, you'll get a URL like: `https://inboxzero-xxxxx.vercel.app`
   - Copy this URL - you'll need it for OAuth setup

### Step 2: Configure Google OAuth for Production

**What is a redirect URI?** It's the URL where Google sends users back after they sign in. Google requires you to pre-register it for security.

**How to add it:**

1. **Go to Google Cloud Console**
   - Open [console.cloud.google.com](https://console.cloud.google.com/)
   - Make sure you're in the correct project

2. **Navigate to Credentials**
   - Click **"APIs & Services"** → **"Credentials"**
   - Find your OAuth 2.0 Client ID (the one for InboxZero)
   - Click on it to edit

3. **Add the Production Redirect URI**
   - Scroll to **"Authorized redirect URIs"** section
   - Click **"+ ADD URI"**
   - Enter: `https://your-vercel-app.vercel.app/api/auth/callback`
     (Replace `your-vercel-app` with your actual Vercel domain from Step 1)
   - Click **"ADD"**
   - Click **"SAVE"** at the bottom

4. **Important**: You should now have TWO redirect URIs:
   - `http://localhost:3000/api/auth/callback` (for local dev)
   - `https://your-vercel-app.vercel.app/api/auth/callback` (for production)

### Step 3: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

2. **Add these variables:**
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GROK_API_KEY=your_grok_api_key_here
   ```
   (Or use `XAI_API_KEY` instead of `GROK_API_KEY` - both work)

3. **Important**: 
   - Select **Production**, **Preview**, and **Development** for each variable
   - Click **Save** after each one

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the "..." menu on latest deployment
   - Click **Redeploy** (this applies the new environment variables)

### Step 4: Test OAuth

1. **Visit your Vercel URL**: `https://your-app.vercel.app`
2. **Click "Sign in with Google"**
3. **It should work!** ✅

### Troubleshooting OAuth on Vercel

**"redirect_uri_mismatch" error:**
- Make sure the redirect URI in Google Cloud Console matches **exactly**:
  - Must be `https://` (not `http://`)
  - Must match your actual Vercel domain
  - No trailing slash
  - Example: `https://inboxzero-abc123.vercel.app/api/auth/callback`

**"Access blocked" error:**
- Add your email as a test user in Google Cloud Console → OAuth consent screen → Test users

**Environment variables not working:**
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding variables
- Check Vercel logs: Deployments → Click deployment → Functions → View logs

**Still not working?**
- Check Vercel function logs for detailed error messages
- Verify all environment variables are set correctly
- Make sure you saved the redirect URI in Google Cloud Console (can take a few minutes to propagate)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

