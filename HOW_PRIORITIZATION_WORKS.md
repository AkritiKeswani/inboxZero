# How Email Extraction & Prioritization Works

## The Complete Flow

### Step 1: Fetch Emails from Gmail
**File:** `lib/gmail.ts::fetchEmails()`

```typescript
// 1. Call Gmail API to list messages
gmail.users.messages.list({
  userId: "me",
  maxResults: 6,
  q: "is:unread OR in:inbox",
  orderBy: "internalDate" // Most recent first
})

// 2. For each message, get full details
for (each message) {
  gmail.users.messages.get({
    userId: "me",
    id: message.id,
    format: "full"
  })
  
  // 3. Extract data:
  - Headers: From, Subject, Date
  - Body: Email content (text/HTML)
  - Snippet: Preview text
  - LinkedIn detection: Check if from LinkedIn
}
```

**What we get:**
- Email object with: from, subject, body, date, snippet
- LinkedIn notification detection
- Profile URL extraction (if LinkedIn)

---

### Step 2: Analyze Email with Grok
**File:** `lib/grok.ts::analyzeEmail()`

```typescript
// Send to Grok API with shortened prompt
const prompt = `
Analyze job search email. Return JSON only:
From: ${email.fromName}
Subject: ${email.subject}
Body: ${email.body.substring(0, 800)} // First 800 chars
LinkedIn: ${email.isLinkedInNotification}

Extract: intent, constraints, actionItems, priority, platform
`;

// Grok returns:
{
  "intent": "schedule" | "deadline" | "multi-step" | "linkedin-followup" | "other",
  "constraints": {
    "dates": ["2024-01-15"],
    "times": ["2pm"],
    "deadlines": ["Thursday"],
    "requirements": ["Send resume"]
  },
  "actionItems": ["Schedule call", "Send portfolio"],
  "priority": "high" | "medium" | "low", // Grok's initial guess
  "platform": "email" | "linkedin"
}
```

**What Grok does:**
- Reads email content
- Identifies intent (what does the sender want?)
- Extracts constraints (dates, deadlines, requirements)
- Lists action items
- Makes initial priority guess (but we recalculate this)

---

### Step 3: Calculate Priority Score
**File:** `lib/priority.ts::calculatePriorityScore()`

This is where YOUR preferences come in!

```typescript
// Start with base score: 50
let score = 50;

// Check company priority (from YOUR profile)
if (email mentions highPriorityCompanies) {
  score += 30; // Dream company = big boost
}
if (email mentions mediumPriorityCompanies) {
  score += 15;
}
if (email mentions lowPriorityCompanies) {
  score -= 20; // Not interested = penalty
}

// Check role matches (from YOUR profile)
if (email mentions desiredRoles) {
  score += 25; // What you're looking for = highest boost
}
if (email mentions highPriorityRoles) {
  score += 20;
}
if (email mentions skills) {
  score += 15; // Skills match = relevant
}

// Check keywords (from YOUR profile)
if (email contains highPriorityKeywords) {
  score += 15; // "interview", "offer", etc.
}

// Intent-based scoring
if (intent === "deadline") score += 25;
if (intent === "schedule") score += 20;
if (intent === "multi-step") score += 15;
if (intent === "other") score -= 10;

// Deadline urgency
if (has deadlines) score += 20;

// Spam detection
if (contains lowPriorityKeywords) score -= 25;

// Clamp to 0-100
return Math.max(0, Math.min(100, score));
```

**Example:**
- Email from Stripe (high priority company) = +30
- Mentions "Staff Engineer" (your desired role) = +25
- Has deadline = +25
- Intent is "schedule" = +20
- **Total: 100/100 = HIGH priority**

---

### Step 4: Convert Score to Priority Level
**File:** `lib/priority.ts::scoreToPriority()`

```typescript
if (score >= 70) return "high";
if (score >= 40) return "medium";
return "low";
```

---

### Step 5: Generate Definitive Action
**File:** `lib/priority.ts::generateDefinitiveAction()`

Based on analysis + priority, creates a clear action:

```typescript
if (intent === "schedule" && has dates) {
  return "Schedule call with Sarah for Friday";
}
if (intent === "deadline" && has deadline) {
  return "Complete task by Thursday - Send resume";
}
if (intent === "multi-step") {
  return "Start step 1: Technical interview prep";
}
// etc.
```

---

### Step 6: Sort & Display
**File:** `app/dashboard/page.tsx`

```typescript
// Sort by priority score (highest first)
results.sort((a, b) => b.priorityScore - a.priorityScore);

// Display with:
- Priority badge (HIGH/MEDIUM/LOW)
- Priority score (0-100)
- Definitive action item
- All sorted by importance
```

---

## Real Example

**Email:** "Hi! We'd love to schedule a call about our Staff Engineer role at Stripe. Are you free Friday?"

**Step 1: Extract**
- From: Stripe recruiter
- Subject: Staff Engineer opportunity
- Body: Scheduling request for Friday

**Step 2: Grok Analysis**
```json
{
  "intent": "schedule",
  "constraints": {"dates": ["Friday"]},
  "actionItems": ["Schedule call"],
  "priority": "medium" // Grok's guess
}
```

**Step 3: Priority Calculation**
- Base: 50
- Stripe (high priority company): +30
- Staff Engineer (desired role): +25
- Intent "schedule": +20
- **Total: 125 → clamped to 100 = HIGH priority**

**Step 4: Action**
- "Schedule call with Stripe recruiter for Friday"

**Step 5: Display**
- Shows at TOP of list (highest priority)
- Red "HIGH" badge
- Score: 100/100
- Clear action item

---

## Key Points

1. **Grok extracts** what's in the email (intent, dates, etc.)
2. **Your profile** determines priority (companies, roles, keywords)
3. **Score calculation** combines both
4. **Sorting** puts most important first
5. **Action items** are clear and specific

The prioritization is personalized to YOU based on what you set in your Profile!

