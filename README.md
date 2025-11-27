# InboxZero - AI Email Assistant for DevRel Job Search

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

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkritiKeswani/inboxZero.git
   cd inboxZero
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your credentials:
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GOOGLE_REDIRECT_URI`: `http://localhost:3000/api/auth/callback`
   - `GROK_API_KEY` or `XAI_API_KEY`: From x.ai Console (your Grok API key - either variable name works)

4. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API and Calendar API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback` to authorized redirect URIs

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Example Scenarios

### Scenario 1: Scheduling with Constraints

**Email:** "Can we chat next Friday afternoon about our DevRel role?"

**InboxZero:** Checks calendar → Suggests "Friday 2:30pm works, here's my link"

### Scenario 2: Deadline Tracking

**Email:** "Send resume by Thursday"

**InboxZero:** Creates deadline → Suggests attaching resume → Reminds Wednesday

### Scenario 3: Multi-step Process

**Email:** "Next steps: (1) tech chat, (2) take-home, (3) final round"

**InboxZero:** Breaks into 3 tasks → Prioritizes step 1 → Suggests scheduling

### Scenario 4: LinkedIn Follow-up

**LinkedIn notification email:** "Sarah Johnson sent you a message about DevRel role at Stripe"

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

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

